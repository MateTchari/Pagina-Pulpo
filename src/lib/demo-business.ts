import { z } from "zod";
import { demoProducts, demoSettings } from "./demo-products";
import { transitions, type labels } from "./order-state";
import { margins } from "./money";

export type DemoStatus = keyof typeof labels;
const amount = z
  .number()
  .finite()
  .min(0)
  .max(999999999)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001,
    "Usá hasta dos decimales.",
  );
const image = z
  .string()
  .max(1500000)
  .refine(
    (v) =>
      v === "/brand/santos-shirts-v2.webp" ||
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
    "Imagen no válida.",
  );
export const demoVariantSchema = z.object({
  id: z.string().min(1),
  color: z.string().trim().min(1).max(60),
  size: z.string().trim().min(1).max(20),
  sku: z.string().trim().min(1).max(80),
  price: amount,
  cost: amount,
  stock: z.number().int().min(0).max(1000000),
  minStock: z.number().int().min(0).max(1000000),
  active: z.boolean(),
});
export const demoProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(2).max(150),
    slug: z
      .string()
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().min(1).max(5000),
    active: z.boolean(),
    featured: z.boolean(),
    image,
    variants: z.array(demoVariantSchema).min(1).max(100),
  })
  .superRefine((p, ctx) => {
    if (
      new Set(p.variants.map((v) => v.id)).size !== p.variants.length ||
      new Set(p.variants.map((v) => `${v.color}|${v.size}`)).size !==
        p.variants.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Hay variantes repetidas.",
        path: ["variants"],
      });
  });
const statusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "COMPLETED",
  "CANCELLED",
]);
const itemSchema = z.object({
  variantId: z.string(),
  productName: z.string(),
  color: z.string(),
  size: z.string(),
  quantity: z.number().int().min(1).max(100),
  unitPrice: amount,
  unitCost: amount,
});
const orderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  note: z.string(),
  currency: z.string(),
  status: statusSchema,
  items: z.array(itemSchema).min(1).max(50),
  total: amount,
  stockDeducted: z.boolean(),
  createdAt: z.iso.datetime(),
  confirmedAt: z.iso.datetime().nullable(),
  history: z.array(z.object({ status: statusSchema, at: z.iso.datetime() })),
});
const movementSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  quantity: z.number().int(),
  reason: z.string(),
  at: z.iso.datetime(),
  orderId: z.string().nullable(),
});
export const demoBusinessSettingsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000),
  currency: z.enum(["ARS", "USD", "EUR"]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
const historySchema = z.object({
  id: z.string(),
  variantId: z.string(),
  price: amount,
  cost: amount,
  at: z.iso.datetime(),
});
export const demoBusinessSchema = z.object({
  version: z.literal(1),
  products: z.array(demoProductSchema).max(100),
  orders: z.array(orderSchema).max(1000),
  movements: z.array(movementSchema).max(10000),
  priceHistory: z.array(historySchema).max(10000),
  settings: demoBusinessSettingsSchema,
});
export type DemoProduct = z.infer<typeof demoProductSchema>;
export type DemoVariant = z.infer<typeof demoVariantSchema>;
export type DemoOrder = z.infer<typeof orderSchema>;
export type DemoBusiness = z.infer<typeof demoBusinessSchema>;
export const DEMO_BUSINESS_KEY = "santos-demo-business-v1";
export type DemoAction =
  | { type: "save-product"; product: DemoProduct }
  | {
      type: "adjust-stock";
      variantId: string;
      quantity: number;
      reason: string;
    }
  | {
      type: "create-order";
      id: string;
      items: { variantId: string; quantity: number }[];
    }
  | { type: "change-status"; id: string; status: DemoStatus }
  | { type: "settings"; settings: DemoBusiness["settings"] };

export function demoVariants(state: DemoBusiness) {
  return state.products.flatMap((p) =>
    p.variants.map((v) => ({
      ...v,
      productId: p.id,
      productName: p.name,
      productActive: p.active,
    })),
  );
}
function variantIn(state: DemoBusiness, id: string) {
  for (const product of state.products) {
    const variant = product.variants.find((v) => v.id === id);
    if (variant) return { product, variant };
  }
  throw new Error("No se encontró la variante de prueba.");
}
function movement(
  state: DemoBusiness,
  variantId: string,
  quantity: number,
  reason: string,
  at: string,
  orderId: string | null = null,
) {
  state.movements.unshift({
    id: `mov-${state.movements.length}-${variantId}-${at}`,
    variantId,
    quantity,
    reason,
    at,
    orderId,
  });
}
export function demoOrderPreview(
  state: DemoBusiness,
  lines: { variantId: string; quantity: number }[],
) {
  if (!lines.length || lines.length > 50)
    throw new Error("Agregá productos al carrito (hasta 50 variantes).");
  const grouped = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1)
      throw new Error("La cantidad debe ser un entero positivo.");
    grouped.set(
      line.variantId,
      (grouped.get(line.variantId) ?? 0) + line.quantity,
    );
  }
  const items = [...grouped].map(([variantId, quantity]) => {
    const { product, variant } = variantIn(state, variantId);
    if (
      !product.active ||
      !variant.active ||
      quantity > variant.stock ||
      quantity > 100
    )
      throw new Error(
        `Revisá disponibilidad de ${product.name}, ${variant.color}/${variant.size}.`,
      );
    return {
      variantId,
      quantity,
      productName: product.name,
      color: variant.color,
      size: variant.size,
      unitPrice: variant.price,
      unitCost: variant.cost,
    };
  });
  return {
    items,
    total:
      items.reduce(
        (sum, i) => sum + Math.round(i.unitPrice * 100) * i.quantity,
        0,
      ) / 100,
    units: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}
export function reduceDemoBusiness(
  previous: DemoBusiness,
  action: DemoAction,
  now = new Date().toISOString(),
): DemoBusiness {
  const state = structuredClone(previous);
  if (action.type === "save-product") {
    const product = demoProductSchema.parse(action.product);
    const old = state.products.find((p) => p.id === product.id);
    if (
      state.products.some((p) => p.id !== product.id && p.slug === product.slug)
    )
      throw new Error("Ya existe ese identificador de URL.");
    const otherVariants = state.products
      .filter((p) => p.id !== product.id)
      .flatMap((p) => p.variants);
    if (
      new Set(product.variants.map((v) => v.sku)).size !==
        product.variants.length ||
      product.variants.some((v) =>
        otherVariants.some((o) => o.id === v.id || o.sku === v.sku),
      )
    )
      throw new Error(
        "El SKU y el identificador de cada variante deben ser únicos.",
      );
    for (const v of product.variants) {
      const existing = old?.variants.find((o) => o.id === v.id);
      v.stock = existing?.stock ?? 0;
      if (!existing || existing.price !== v.price || existing.cost !== v.cost)
        state.priceHistory.unshift({
          id: `price-${state.priceHistory.length}-${v.id}`,
          variantId: v.id,
          price: v.price,
          cost: v.cost,
          at: now,
        });
    }
    // Retired variants remain in history and keep their stock.
    for (const retired of old?.variants ?? [])
      if (!product.variants.some((v) => v.id === retired.id))
        product.variants.push({ ...retired, active: false });
    if (old)
      state.products = state.products.map((p) =>
        p.id === product.id ? product : p,
      );
    else state.products.unshift(product);
  }
  if (action.type === "adjust-stock") {
    if (
      !Number.isInteger(action.quantity) ||
      action.quantity === 0 ||
      Math.abs(action.quantity) > 100000 ||
      action.reason.trim().length < 3 ||
      action.reason.length > 300
    )
      throw new Error(
        "Indicá una cantidad entera distinta de cero y un motivo de 3 a 300 caracteres.",
      );
    const { variant } = variantIn(state, action.variantId);
    if (variant.stock + action.quantity < 0)
      throw new Error("No hay stock suficiente para esa baja.");
    variant.stock += action.quantity;
    movement(state, variant.id, action.quantity, action.reason.trim(), now);
  }
  if (action.type === "create-order") {
    if (state.orders.some((o) => o.id === action.id)) return previous;
    const preview = demoOrderPreview(state, action.items);
    state.orders.unshift({
      id: action.id,
      customerName: "Cliente de prueba",
      customerEmail: "prueba@example.com",
      note: "Pedido simulado desde la tienda de este navegador.",
      currency: state.settings.currency,
      status: "PENDING",
      items: preview.items,
      total: preview.total,
      stockDeducted: false,
      createdAt: now,
      confirmedAt: null,
      history: [{ status: "PENDING", at: now }],
    });
  }
  if (action.type === "change-status") {
    const order = state.orders.find((o) => o.id === action.id);
    if (!order) throw new Error("Pedido de prueba inexistente.");
    if (order.status === action.status) return previous;
    if (!transitions[order.status].includes(action.status))
      throw new Error("Ese cambio de estado no está permitido.");
    if (action.status === "CONFIRMED") {
      for (const item of order.items) {
        const { product, variant } = variantIn(state, item.variantId);
        if (!product.active || !variant.active || variant.stock < item.quantity)
          throw new Error(
            `Stock insuficiente para ${item.productName}, ${item.color}/${item.size}.`,
          );
      }
      for (const item of order.items) {
        variantIn(state, item.variantId).variant.stock -= item.quantity;
        movement(
          state,
          item.variantId,
          -item.quantity,
          "VENTA DE PRUEBA",
          now,
          order.id,
        );
      }
      order.stockDeducted = true;
      order.confirmedAt = now;
    }
    if (action.status === "CANCELLED" && order.stockDeducted) {
      for (const item of order.items) {
        variantIn(state, item.variantId).variant.stock += item.quantity;
        movement(
          state,
          item.variantId,
          item.quantity,
          "CANCELACIÓN DE PRUEBA",
          now,
          order.id,
        );
      }
      order.stockDeducted = false;
    }
    order.status = action.status;
    order.history.push({ status: action.status, at: now });
  }
  if (action.type === "settings") {
    const settings = demoBusinessSettingsSchema.parse(action.settings);
    if (state.orders.length && settings.currency !== state.settings.currency)
      throw new Error(
        "La moneda queda fija al existir pedidos de prueba. Restablecé la demo para empezar con otra moneda.",
      );
    state.settings = settings;
  }
  return demoBusinessSchema.parse(state);
}
export function initialDemoBusiness(now = new Date()): DemoBusiness {
  let state: DemoBusiness = {
    version: 1,
    settings: {
      name: demoSettings.name,
      description: demoSettings.description,
      currency: "ARS",
      accent: demoSettings.accent,
    },
    orders: [],
    movements: [],
    priceHistory: [],
    products: demoProducts.map((p, i) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      active: true,
      featured: p.featured,
      image: p.images[0].url,
      variants: p.variants.map((v, j) => ({
        ...v,
        sku: `SANTOS-DEMO-${i + 1}-${j + 1}`,
        cost: [9900, 11900, 8900][i],
        minStock: 3,
        active: true,
      })),
    })),
  };
  const day = (days: number) =>
    new Date(now.getTime() - days * 86400000).toISOString();
  for (const v of demoVariants(state))
    movement(state, v.id, v.stock, "INGRESO INICIAL DE EJEMPLO", day(10));
  const seeds: [number, number, number, DemoStatus][] = [
    [0, 0, 2, "COMPLETED"],
    [1, 0, 1, "COMPLETED"],
    [2, 0, 3, "CONFIRMED"],
    [0, 1, 1, "PREPARING"],
    [1, 1, 2, "PENDING"],
    [0, 2, 2, "PENDING"],
  ];
  seeds.forEach(([p, v, quantity, status], i) => {
    const id = `EJEMPLO-${String(i + 1).padStart(3, "0")}`;
    state = reduceDemoBusiness(
      state,
      {
        type: "create-order",
        id,
        items: [{ variantId: state.products[p].variants[v].id, quantity }],
      },
      day(6 - i),
    );
    if (status !== "PENDING") {
      state = reduceDemoBusiness(
        state,
        { type: "change-status", id, status: "CONFIRMED" },
        day(6 - i),
      );
      if (status === "PREPARING" || status === "COMPLETED")
        state = reduceDemoBusiness(
          state,
          { type: "change-status", id, status: "PREPARING" },
          day(6 - i),
        );
      if (status === "COMPLETED")
        state = reduceDemoBusiness(
          state,
          { type: "change-status", id, status: "COMPLETED" },
          day(6 - i),
        );
    }
  });
  state = reduceDemoBusiness(
    state,
    {
      type: "adjust-stock",
      variantId: state.products[2].variants[2].id,
      quantity: -8,
      reason: "AJUSTE DE EJEMPLO: STOCK MÍNIMO",
    },
    day(1),
  );
  return state;
}
export function demoStatistics(state: DemoBusiness, from = "", to = "") {
  const format = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const orders = state.orders.filter(
    (o) =>
      o.status !== "PENDING" &&
      o.status !== "CANCELLED" &&
      o.confirmedAt &&
      (!from || format.format(new Date(o.confirmedAt)) >= from) &&
      (!to || format.format(new Date(o.confirmedAt)) <= to),
  );
  const days = new Map<
    string,
    { date: string; revenue: number; cost: number }
  >();
  const products = new Map<
    string,
    { name: string; units: number; revenue: number; cost: number }
  >();
  let revenue = 0,
    cost = 0,
    units = 0;
  for (const order of orders) {
    const key = format.format(new Date(order.confirmedAt!)),
      day = days.get(key) ?? { date: key, revenue: 0, cost: 0 };
    for (const i of order.items) {
      const r = Math.round(i.unitPrice * 100) * i.quantity,
        c = Math.round(i.unitCost * 100) * i.quantity;
      revenue += r;
      cost += c;
      units += i.quantity;
      day.revenue += r / 100;
      day.cost += c / 100;
      const p = products.get(i.variantId) ?? {
        name: `${i.productName} · ${i.color}/${i.size}`,
        units: 0,
        revenue: 0,
        cost: 0,
      };
      p.units += i.quantity;
      p.revenue += r / 100;
      p.cost += c / 100;
      products.set(i.variantId, p);
    }
    days.set(key, day);
  }
  return {
    revenue: revenue / 100,
    cost: cost / 100,
    profit: (revenue - cost) / 100,
    units,
    orders: orders.length,
    daily: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
    products: [...products.values()].sort((a, b) => b.units - a.units),
    margin: margins(revenue, cost).margin,
  };
}
export function demoPublicProducts(
  state: DemoBusiness,
  q: Record<string, string | undefined> = {},
  featured = false,
) {
  const min =
      q.min && Number.isFinite(Number(q.min))
        ? Math.max(0, Number(q.min))
        : undefined,
    max =
      q.max && Number.isFinite(Number(q.max))
        ? Math.max(0, Number(q.max))
        : undefined;
  return state.products
    .filter(
      (p) =>
        p.active &&
        (!featured || p.featured) &&
        (!q.q ||
          `${p.name} ${p.description}`
            .toLocaleLowerCase("es")
            .includes(q.q.slice(0, 150).toLocaleLowerCase("es"))) &&
        p.variants.some(
          (v) =>
            v.active &&
            (!q.color || v.color === q.color) &&
            (!q.size || v.size === q.size) &&
            (!q.stock || v.stock > 0) &&
            (min === undefined || v.price >= min) &&
            (max === undefined || v.price <= max),
        ),
    )
    .map((p) => ({
      ...p,
      images: [{ url: p.image, alt: p.name }],
      variants: p.variants.filter((v) => v.active),
    }));
}
