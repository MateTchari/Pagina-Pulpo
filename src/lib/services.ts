import { Prisma, OrderStatus } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { AppError } from "./security";
import { checkoutSchema, productSchema, settingsSchema } from "./validation";
import { transitions } from "./order-state";
import { z } from "zod";
import { isDemoMode } from "./mode";
import { demoSettings } from "./demo-products";

export async function serial<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let i = 0; i < 5; i++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 15000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        i < 4
      )
        continue;
      throw error;
    }
  }
  throw new AppError("Conflicto de concurrencia. Reintentá.", 409);
}
export async function saveProduct(raw: unknown, actorId: string, id?: string) {
  const data = productSchema.parse(raw);
  return serial(async (tx) => {
    const { variants, images, ...fields } = data;
    const product = id
      ? await tx.product.update({ where: { id }, data: fields })
      : await tx.product.create({ data: fields });
    const previous = await tx.variant.findMany({
      where: { productId: product.id },
    });
    if (variants.some((v) => v.id && !previous.some((p) => p.id === v.id)))
      throw new AppError("Variante ajena al producto.");
    await tx.variant.updateMany({
      where: {
        productId: product.id,
        id: { notIn: variants.flatMap((v) => (v.id ? [v.id] : [])) },
      },
      data: { active: false },
    });
    for (const v of variants) {
      const { id: variantId, ...values } = v;
      const old = previous.find((p) => p.id === variantId);
      const variant = variantId
        ? await tx.variant.update({ where: { id: variantId }, data: values })
        : await tx.variant.create({
            data: { ...values, productId: product.id },
          });
      if (!old || !old.price.equals(v.price) || !old.cost.equals(v.cost))
        await tx.priceHistory.create({
          data: {
            variantId: variant.id,
            price: v.price,
            cost: v.cost,
            actorId,
          },
        });
    }
    await tx.productImage.deleteMany({ where: { productId: product.id } });
    await tx.productImage.createMany({
      data: images.map((image, position) => ({
        ...image,
        productId: product.id,
        position,
      })),
    });
    return product;
  });
}
export async function adjustStock(raw: unknown, actorId: string) {
  const data = z
    .object({
      variantId: z.string(),
      quantity: z
        .number()
        .int()
        .min(-100000)
        .max(100000)
        .refine((v) => v !== 0),
      reason: z.string().trim().min(3).max(300),
    })
    .parse(raw);
  return serial(async (tx) => {
    const changed = await tx.variant.updateMany({
      where: {
        id: data.variantId,
        ...(data.quantity < 0 ? { stock: { gte: -data.quantity } } : {}),
      },
      data: { stock: { increment: data.quantity } },
    });
    if (!changed.count)
      throw new AppError(
        "La variante no existe o no tiene stock suficiente.",
        409,
      );
    return tx.stockMovement.create({ data: { ...data, actorId } });
  });
}
export async function createOrder(raw: unknown) {
  const input = checkoutSchema.parse(raw);
  const quantities = new Map<string, number>();
  for (const item of input.items)
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  if ([...quantities.values()].some((q) => q > 100))
    throw new AppError("Máximo 100 unidades por variante.");
  const items = [...quantities]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([variantId, quantity]) => ({ variantId, quantity }));
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ ...input, items }))
    .digest("hex");
  const replay = (existing: { requestHash: string; publicToken: string }) => {
    if (existing.requestHash !== requestHash)
      throw new AppError("La clave ya corresponde a otro pedido.", 409);
    return { token: existing.publicToken };
  };
  try {
    return await serial(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return replay(existing);
      const settings = await tx.settings.findUnique({
        where: { id: "business" },
      });
      if (!settings?.ordersEnabled)
        throw new AppError("Los pedidos todavía no están habilitados.", 409);
      const variants = await tx.variant.findMany({
        where: {
          id: { in: items.map((i) => i.variantId) },
          active: true,
          product: { active: true },
        },
        include: { product: true },
      });
      const lines = items.map((item) => {
        const v = variants.find((v) => v.id === item.variantId);
        if (!v || v.stock < item.quantity)
          throw new AppError(
            "Un producto ya no está disponible en esa cantidad.",
            409,
          );
        return {
          ...item,
          productName: v.product.name,
          color: v.color,
          size: v.size,
          unitPrice: v.price,
          unitCost: v.cost,
        };
      });
      const total = lines.reduce(
        (sum, l) => sum.add(l.unitPrice.mul(l.quantity)),
        new Prisma.Decimal(0),
      );
      const order = await tx.order.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          requestHash,
          publicToken: randomBytes(32).toString("hex"),
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          note: input.note,
          currency: settings.currency,
          total,
          items: { create: lines },
          history: { create: { status: "PENDING" } },
        },
      });
      return { token: order.publicToken };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await db.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return replay(existing);
    }
    throw error;
  }
}
export async function changeOrderStatus(
  id: string,
  status: OrderStatus,
  actorId: string,
) {
  return serial(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new AppError("Pedido inexistente.", 404);
    if (order.status === status) return order;
    if (!transitions[order.status].includes(status))
      throw new AppError("Transición de estado no permitida.", 409);
    if (status === "CONFIRMED") {
      for (const item of [...order.items].sort((a, b) =>
        a.variantId.localeCompare(b.variantId),
      )) {
        const updated = await tx.variant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
            active: true,
            product: { active: true },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (!updated.count)
          throw new AppError(
            `Stock insuficiente: ${item.productName}, ${item.color}, ${item.size}.`,
            409,
          );
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: -item.quantity,
            reason: "VENTA",
            orderId: id,
            actorId,
          },
        });
      }
    }
    if (status === "CANCELLED" && order.stockDeducted) {
      for (const item of order.items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            reason: "CANCELACION",
            orderId: id,
            actorId,
          },
        });
      }
    }
    return tx.order.update({
      where: { id },
      data: {
        status,
        stockDeducted:
          status === "CONFIRMED"
            ? true
            : status === "CANCELLED"
              ? false
              : order.stockDeducted,
        confirmedAt: status === "CONFIRMED" ? new Date() : order.confirmedAt,
        history: { create: { status, actorId } },
      },
    });
  });
}
export async function saveSettings(raw: unknown) {
  const parsed = settingsSchema.parse(raw);
  return serial(async (tx) => {
    const old = await tx.settings.findUnique({ where: { id: "business" } });
    if (old && old.currency !== parsed.currency && (await tx.order.count()))
      throw new AppError(
        "Ya hay pedidos. Cambiar moneda requiere una migración comercial para conservar importes históricos.",
      );
    return tx.settings.upsert({
      where: { id: "business" },
      create: { ...parsed, logoUrl: parsed.logoUrl || null },
      update: { ...parsed, logoUrl: parsed.logoUrl || null },
    });
  });
}
export async function settings() {
  if (isDemoMode()) return demoSettings;
  return (
    (await db.settings.findUnique({ where: { id: "business" } })) ?? {
      name: "SANTOS",
      description: "Remeras con tu identidad.",
      currency: "ARS",
      accent: "#c45135",
      logoUrl: "/brand/santos-logo-black.png",
      ordersEnabled: false,
    }
  );
}
export async function statistics(from: Date, to: Date) {
  const orders = await db.order.findMany({
    where: {
      status: { in: ["CONFIRMED", "PREPARING", "COMPLETED"] },
      confirmedAt: { gte: from, lte: to },
    },
    include: { items: true },
    orderBy: { confirmedAt: "asc" },
  });
  let revenue = new Prisma.Decimal(0),
    cost = new Prisma.Decimal(0),
    units = 0;
  const daily = new Map<
    string,
    { date: string; revenue: number; cost: number }
  >();
  const products = new Map<
    string,
    { name: string; units: number; revenue: number; cost: number }
  >();
  for (const o of orders) {
    const date = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(o.confirmedAt!);
    const day = daily.get(date) ?? { date, revenue: 0, cost: 0 };
    for (const item of o.items) {
      const r = item.unitPrice.mul(item.quantity),
        c = item.unitCost.mul(item.quantity);
      revenue = revenue.add(r);
      cost = cost.add(c);
      units += item.quantity;
      day.revenue += Number(r);
      day.cost += Number(c);
      const p = products.get(item.variantId) ?? {
        name: `${item.productName} · ${item.color} / ${item.size}`,
        units: 0,
        revenue: 0,
        cost: 0,
      };
      p.units += item.quantity;
      p.revenue += Number(r);
      p.cost += Number(c);
      products.set(item.variantId, p);
    }
    daily.set(date, day);
  }
  const monthly = new Map<
    string,
    { date: string; revenue: number; cost: number }
  >();
  for (const d of daily.values()) {
    const key = d.date.slice(0, 7);
    const m = monthly.get(key) ?? { date: key, revenue: 0, cost: 0 };
    m.revenue += d.revenue;
    m.cost += d.cost;
    monthly.set(key, m);
  }
  return {
    revenue: Number(revenue),
    cost: Number(cost),
    profit: Number(revenue.sub(cost)),
    units,
    orders: orders.length,
    daily: [...daily.values()],
    monthly: [...monthly.values()],
    products: [...products.values()].sort((a, b) => b.units - a.units),
  };
}
