import { test, expect } from "@playwright/test";
import { createDb } from "../../src/lib/db";
import { hashPassword } from "better-auth/crypto";
import sharp from "sharp";
const db = createDb(),
  email = "browser@example.com",
  password = crypto.randomUUID() + "!Strong";
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
test.beforeAll(async () => {
  await clean();
  const id = crypto.randomUUID();
  await db.user.create({
    data: {
      id,
      name: "Admin navegador",
      email,
      emailVerified: true,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          providerId: "credential",
          accountId: id,
          password: await hashPassword(password),
        },
      },
    },
  });
});
test.afterAll(async () => {
  await clean();
  await db.$disconnect();
});
test("acceso privado y protecciones de escritura", async ({
  page,
  request,
}) => {
  await page.goto("/admin/productos");
  await expect(page).toHaveURL(/admin\/login/);
  const unauthorized = await request.post("/api/inventory", {
    headers: { Origin: "http://localhost:3001" },
    data: { quantity: 999 },
  });
  expect(unauthorized.status()).toBe(401);
  const csrf = await request.post("/api/settings", {
    headers: { Origin: "https://intruso.example" },
    data: {},
  });
  expect(csrf.status()).toBe(403);
  const malformed = await request.post("/api/orders", {
    headers: { Origin: "http://localhost:3001" },
    data: { customerEmail: "invalido" },
  });
  expect(malformed.status()).toBe(400);
});
test("flujo completo desde formularios: producto, foto, 10 unidades, pedido de 2, venta y cancelación", async ({
  page,
}) => {
  page.on("response", (r) => {
    if (r.status() >= 400)
      console.log("HTTP", r.status(), new URL(r.url()).pathname);
  });
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al panel" }).click();
  await expect(page).toHaveURL("/admin");
  await page.getByRole("link", { name: "Configuración", exact: true }).click();
  await page.getByLabel("Nombre comercial").fill("Estudio de prueba");
  await page.getByLabel("Habilitar pedidos").check();
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByText("Configuración guardada.")).toBeVisible();
  await page.getByRole("link", { name: "Productos", exact: true }).click();
  await page
    .getByRole("link", { name: "Nuevo producto", exact: false })
    .click();
  await page.getByLabel("Nombre", { exact: true }).fill("Remera navegador");
  await page.getByLabel("Identificador de URL").fill("remera-navegador");
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Diseño creado por prueba automatizada de interfaz.");
  await page.getByLabel("Publicado en la tienda").check();
  await page.getByLabel("Destacado en inicio").check();
  const image = await sharp({
    create: { width: 320, height: 400, channels: 3, background: "#dce1d2" },
  })
    .png()
    .toBuffer();
  await page
    .locator("input[type=file]")
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: image });
  await expect(page.getByLabel("Texto alternativo")).toBeVisible();
  await page.getByLabel("color variante 1", { exact: true }).fill("Negro");
  await page.getByLabel("size variante 1", { exact: true }).fill("M");
  await page.getByLabel("sku variante 1", { exact: true }).fill("BROWSER-M");
  await page.getByLabel("price variante 1", { exact: true }).fill("15000");
  await page.getByLabel("cost variante 1", { exact: true }).fill("6000");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page).toHaveURL("/admin/productos");
  await page.getByRole("link", { name: "Inventario", exact: true }).click();
  await expect(page).toHaveURL("/admin/inventario");
  await page
    .getByLabel("Variante", { exact: true })
    .selectOption({ label: "Remera navegador · Negro / M · 0 uds." });
  await page.getByLabel("Unidades (+ ingreso / − baja)").fill("10");
  await page.getByLabel("Motivo", { exact: true }).fill("Ingreso de prueba");
  await page
    .getByRole("button", { name: "Registrar movimiento", exact: true })
    .click();
  await expect(
    page.getByText("Movimiento registrado. Stock actualizado."),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Remera navegador" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/store-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: /Remera navegador/ }).click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByLabel("Cantidad", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Carrito (2)" }).click();
  await expect(page).toHaveURL("/carrito");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Remera navegador" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continuar con el pedido" }).click();
  await page.getByLabel("Nombre y apellido").fill("Cliente navegador");
  await page.getByLabel("Email de contacto").fill("cliente@example.com");
  await page.getByLabel("Entiendo que el pedido requiere confirmación").check();
  await page.getByRole("button", { name: "Crear pedido pendiente" }).click();
  await expect(page).toHaveURL(/pedido\/[a-f0-9]{64}/);
  await expect(
    page.getByText("Pendiente de confirmación", { exact: true }).first(),
  ).toBeVisible();
  const token = page.url().split("/").pop()!;
  const order = await db.order.findUniqueOrThrow({
    where: { publicToken: token },
  });
  expect(
    (await db.variant.findUniqueOrThrow({ where: { sku: "BROWSER-M" } })).stock,
  ).toBe(10);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/admin/ventas/${order.id}`);
  await page
    .getByRole("button", { name: "Confirmar y descontar stock" })
    .click();
  await expect(page.getByText("Inventario descontado: Sí")).toBeVisible();
  expect(
    (await db.variant.findUniqueOrThrow({ where: { sku: "BROWSER-M" } })).stock,
  ).toBe(8);
  await page.goto("/admin");
  await expect(
    page.getByText("30.000,00", { exact: false }).first(),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await page.goto("/admin/estadisticas");
  await expect(
    page.getByRole("heading", { name: "Productos más vendidos y márgenes" }),
  ).toBeVisible();
  await page.goto(`/admin/ventas/${order.id}`);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cancelado", exact: true }).click();
  await expect(page.getByText("Inventario descontado: No")).toBeVisible();
  expect(
    (await db.variant.findUniqueOrThrow({ where: { sku: "BROWSER-M" } })).stock,
  ).toBe(10);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/admin/login");
});
