import { z } from "zod";
const money = z.coerce
  .number()
  .finite()
  .min(0)
  .max(999999999)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
    "Usá hasta dos decimales.",
  );
export const variantSchema = z.object({
  id: z.string().optional(),
  color: z.string().trim().min(1).max(60),
  size: z.string().trim().min(1).max(20),
  sku: z.string().trim().min(1).max(80),
  price: money,
  cost: money,
  minStock: z.coerce.number().int().min(0).max(100000),
  active: z.boolean().default(true),
});
export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(160),
    description: z.string().trim().min(1).max(5000),
    active: z.boolean(),
    featured: z.boolean(),
    variants: z.array(variantSchema).min(1).max(100),
    images: z
      .array(
        z.object({
          url: z.string().regex(/^\/api\/media\/[a-f0-9-]+\.webp$/),
          alt: z.string().max(200),
        }),
      )
      .max(10),
  })
  .superRefine((v, ctx) => {
    if (
      new Set(v.variants.map((x) => `${x.color}|${x.size}`)).size !==
      v.variants.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Hay combinaciones de color y talle repetidas.",
        path: ["variants"],
      });
    if (new Set(v.variants.map((x) => x.sku)).size !== v.variants.length)
      ctx.addIssue({
        code: "custom",
        message: "Los SKU deben ser únicos.",
        path: ["variants"],
      });
  });
export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.email().max(200),
  note: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(50),
});
export const settingsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .refine((v) => {
      try {
        return Intl.supportedValuesOf("currency").includes(v);
      } catch {
        return false;
      }
    }, "Moneda no válida."),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z.union([
    z.literal(""),
    z.literal("/brand/santos-logo-black.png"),
    z.literal("/brand/santos-logo-white.png"),
    z.string().regex(/^\/api\/media\/[a-f0-9-]+\.webp$/),
  ]),
  ordersEnabled: z.boolean(),
});
