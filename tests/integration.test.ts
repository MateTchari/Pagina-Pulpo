import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
if (
  !process.env.TEST_DATABASE_URL ||
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("/tienda_test")
)
  throw new Error(
    "Se requiere TEST_DATABASE_URL con base tienda_test exclusiva para pruebas.",
  );
if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL)
  throw new Error("No ejecutar contra la base de trabajo.");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { db } = await import("../src/lib/db");
const {
  saveProduct,
  adjustStock,
  createOrder,
  changeOrderStatus,
  statistics,
  saveSettings,
} = await import("../src/lib/services");
const { auth } = await import("../src/lib/auth");
const adminId = crypto.randomUUID();
const password = crypto.randomUUID() + "!aB1";
const base = {
  name: "Remera prueba",
  slug: "remera-prueba",
  description: "Producto de prueba",
  active: true,
  featured: true,
  images: [],
  variants: [
    {
      color: "Negro",
      size: "M",
      sku: "TEST-M",
      price: 100,
      cost: 60,
      minStock: 3,
      active: true,
    },
  ],
};
const buyer = () => ({
  idempotencyKey: crypto.randomUUID(),
  customerName: "Cliente prueba",
  customerEmail: "cliente@example.com",
  items: [] as { variantId: string; quantity: number }[],
});
async function clean() {
  await db.stockMovement.deleteMany();
  await db.orderHistory.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.priceHistory.deleteMany();
  await db.productImage.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.settings.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();
  await db.rateLimit.deleteMany();
}
before(async () => {
  execFileSync(
    process.execPath,
    [path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
    { env: process.env, stdio: "pipe" },
  );
  await clean();
  await db.user.create({
    data: {
      id: adminId,
      email: "admin@example.com",
      name: "Admin pruebas",
      emailVerified: true,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          providerId: "credential",
          accountId: adminId,
          password: await hashPassword(password),
        },
      },
    },
  });
  await saveSettings({
    name: "Tienda pruebas",
    description: "Pruebas",
    currency: "ARS",
    accent: "#c45135",
    logoUrl: "",
    ordersEnabled: true,
  });
});
after(async () => {
  await clean();
  await db.$disconnect();
});
test("circuito 10 → pedido de 2 → confirmar → 8; historial inmutable y cancelación única", async () => {
  const p = await saveProduct(base, adminId);
  let v = await db.variant.findFirstOrThrow({ where: { productId: p.id } });
  assert.equal(v.stock, 0);
  await adjustStock(
    { variantId: v.id, quantity: 10, reason: "Ingreso inicial" },
    adminId,
  );
  const input = {
    ...buyer(),
    items: [{ variantId: v.id, quantity: 2 }],
    total: 0.01,
  };
  const created = await createOrder(input),
    replay = await createOrder(input);
  assert.deepEqual(replay, created);
  const o = await db.order.findUniqueOrThrow({
    where: { publicToken: created.token },
    include: { items: true },
  });
  assert.equal(Number(o.total), 200);
  assert.equal(Number(o.items[0].unitCost), 60);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    10,
  );
  await Promise.all([
    changeOrderStatus(o.id, "CONFIRMED", adminId),
    changeOrderStatus(o.id, "CONFIRMED", adminId),
  ]);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    8,
  );
  assert.equal(
    await db.stockMovement.count({ where: { orderId: o.id, reason: "VENTA" } }),
    1,
  );
  let stats = await statistics(new Date(0), new Date("2100-01-01"));
  assert.equal(stats.revenue, 200);
  assert.equal(stats.cost, 120);
  assert.equal(stats.profit, 80);
  assert.equal(stats.units, 2);
  await saveProduct(
    {
      ...base,
      variants: [{ ...base.variants[0], id: v.id, price: 120, cost: 70 }],
    },
    adminId,
    p.id,
  );
  assert.equal(
    Number(
      (await db.orderItem.findFirstOrThrow({ where: { orderId: o.id } }))
        .unitPrice,
    ),
    100,
  );
  assert.equal(await db.priceHistory.count({ where: { variantId: v.id } }), 2);
  await assert.rejects(() => changeOrderStatus(o.id, "COMPLETED", adminId));
  await Promise.all([
    changeOrderStatus(o.id, "CANCELLED", adminId),
    changeOrderStatus(o.id, "CANCELLED", adminId),
  ]);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    10,
  );
  assert.equal(
    await db.stockMovement.count({
      where: { orderId: o.id, reason: "CANCELACION" },
    }),
    1,
  );
  stats = await statistics(new Date(0), new Date("2100-01-01"));
  assert.equal(stats.orders, 0);
  await assert.rejects(() => changeOrderStatus(o.id, "CONFIRMED", adminId));
  await assert.rejects(() =>
    adjustStock(
      { variantId: v.id, quantity: -11, reason: "Baja inválida" },
      adminId,
    ),
  );
});
test("ventas concurrentes de la última unidad: solo una confirma", async () => {
  const p = await saveProduct(
    {
      ...base,
      slug: "concurrencia",
      variants: [{ ...base.variants[0], sku: "TEST-CONCURRENT" }],
    },
    adminId,
  );
  const v = await db.variant.findFirstOrThrow({ where: { productId: p.id } });
  await adjustStock(
    { variantId: v.id, quantity: 1, reason: "Inicial" },
    adminId,
  );
  const tokens = await Promise.all([
    createOrder({ ...buyer(), items: [{ variantId: v.id, quantity: 1 }] }),
    createOrder({ ...buyer(), items: [{ variantId: v.id, quantity: 1 }] }),
  ]);
  const orders = await db.order.findMany({
    where: { publicToken: { in: tokens.map((t) => t.token) } },
  });
  const result = await Promise.allSettled(
    orders.map((o) => changeOrderStatus(o.id, "CONFIRMED", adminId)),
  );
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(result.filter((r) => r.status === "rejected").length, 1);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    0,
  );
});
test("confirmación de varias líneas revierte todo si una no tiene stock", async () => {
  const p = await saveProduct(
    {
      ...base,
      slug: "atomicidad",
      variants: [
        { ...base.variants[0], sku: "TEST-ATOMIC-1" },
        { ...base.variants[0], color: "Blanco", sku: "TEST-ATOMIC-2" },
      ],
    },
    adminId,
  );
  const vs = await db.variant.findMany({
    where: { productId: p.id },
    orderBy: { id: "asc" },
  });
  for (const v of vs)
    await adjustStock(
      { variantId: v.id, quantity: 2, reason: "Inicial" },
      adminId,
    );
  const created = await createOrder({
    ...buyer(),
    items: vs.map((v) => ({ variantId: v.id, quantity: 2 })),
  });
  await adjustStock(
    { variantId: vs[1].id, quantity: -2, reason: "Merma" },
    adminId,
  );
  const o = await db.order.findUniqueOrThrow({
    where: { publicToken: created.token },
  });
  await assert.rejects(() => changeOrderStatus(o.id, "CONFIRMED", adminId));
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: vs[0].id } })).stock,
    2,
  );
  assert.equal(await db.stockMovement.count({ where: { orderId: o.id } }), 0);
  assert.equal(
    (await db.order.findUniqueOrThrow({ where: { id: o.id } })).status,
    "PENDING",
  );
});
test("duplicación, stock y publicación validados desde servidor", async () => {
  const v = await db.variant.findFirstOrThrow({ where: { sku: "TEST-M" } });
  await assert.rejects(() =>
    createOrder({ ...buyer(), items: [{ variantId: v.id, quantity: 11 }] }),
  );
  const input = { ...buyer(), items: [{ variantId: v.id, quantity: 1 }] };
  const results = await Promise.all([createOrder(input), createOrder(input)]);
  assert.deepEqual(results[0], results[1]);
  await assert.rejects(() =>
    createOrder({ ...input, customerName: "Otro cliente" }),
  );
  await db.product.update({
    where: { id: v.productId },
    data: { active: false },
  });
  await assert.rejects(() =>
    createOrder({ ...buyer(), items: [{ variantId: v.id, quantity: 1 }] }),
  );
  await assert.rejects(() =>
    saveSettings({
      name: "Prueba",
      description: "",
      currency: "USD",
      accent: "#000000",
      logoUrl: "",
      ordersEnabled: true,
    }),
  );
});
test("autenticación persistente, contraseña inválida, registro cerrado, logout y rate limit", async () => {
  const request = (endpoint: string, body: unknown, cookie?: string) =>
    auth.handler(
      new Request(`http://localhost:3000/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
  const rejected = await request("sign-in/email", {
    email: "admin@example.com",
    password: "incorrecta",
  });
  assert.notEqual(rejected.status, 200);
  const signup = await request("sign-up/email", {
    email: "intruso@example.com",
    name: "Intruso",
    password,
  });
  assert.notEqual(signup.status, 200);
  const login = await request("sign-in/email", {
    email: "admin@example.com",
    password,
  });
  assert.equal(login.status, 200);
  const cookies = login.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  assert.match(cookies, /session_token/);
  assert.equal(await db.session.count({ where: { userId: adminId } }), 1);
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookies }),
  });
  assert.equal(session?.user.id, adminId);
  assert.equal(await auth.api.getSession({ headers: new Headers() }), null);
  const logout = await request("sign-out", {}, cookies);
  assert.equal(logout.status, 200);
  assert.equal(
    await auth.api.getSession({ headers: new Headers({ cookie: cookies }) }),
    null,
  );
  let limited = false;
  for (let i = 0; i < 8; i++) {
    const r = await request("sign-in/email", {
      email: "admin@example.com",
      password: "incorrecta",
    });
    if (r.status === 429) limited = true;
  }
  assert.equal(limited, true);
});
test("restricciones PostgreSQL y persistencia entre conexiones", async () => {
  const v = await db.variant.findFirstOrThrow();
  await assert.rejects(() =>
    db.variant.update({ where: { id: v.id }, data: { stock: -1 } }),
  );
  const { createDb } = await import("../src/lib/db");
  const independent = createDb();
  try {
    assert.equal(
      (await independent.variant.findUniqueOrThrow({ where: { id: v.id } }))
        .stock,
      v.stock,
    );
  } finally {
    await independent.$disconnect();
  }
});
