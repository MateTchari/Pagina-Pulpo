import { db } from "./db";
import { isDemoMode } from "./mode";
import { demoProducts } from "./demo-products";

export async function storeProducts(
  q: Record<string, string | undefined> = {},
  featured = false,
) {
  const min =
    q.min && Number.isFinite(Number(q.min))
      ? Math.max(0, Number(q.min))
      : undefined;
  const max =
    q.max && Number.isFinite(Number(q.max))
      ? Math.max(0, Number(q.max))
      : undefined;
  if (isDemoMode())
    return demoProducts.filter(
      (p) =>
        (!featured || p.featured) &&
        (!q.q ||
          `${p.name} ${p.description}`
            .toLocaleLowerCase("es")
            .includes(q.q.slice(0, 150).toLocaleLowerCase("es"))) &&
        p.variants.some(
          (v) =>
            (!q.color || v.color === q.color) &&
            (!q.size || v.size === q.size) &&
            (!q.stock || v.stock > 0) &&
            (min === undefined || v.price >= min) &&
            (max === undefined || v.price <= max),
        ),
    );
  const products = await db.product.findMany({
    where: {
      active: true,
      ...(featured ? { featured: true } : {}),
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q.slice(0, 150), mode: "insensitive" } },
              {
                description: {
                  contains: q.q.slice(0, 150),
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      variants: {
        some: {
          active: true,
          ...(q.color ? { color: q.color } : {}),
          ...(q.size ? { size: q.size } : {}),
          ...(q.stock ? { stock: { gt: 0 } } : {}),
          price: { gte: min, lte: max },
        },
      },
    },
    include: {
      variants: { where: { active: true } },
      images: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: featured ? 4 : 200,
  });
  return products.map((p) => ({
    ...p,
    variants: p.variants.map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      price: Number(v.price),
      stock: v.stock,
    })),
  }));
}
export async function storeOptions() {
  if (isDemoMode()) return demoProducts.flatMap((p) => p.variants);
  return db.variant.findMany({
    where: { active: true, product: { active: true } },
    select: { color: true, size: true },
    distinct: ["color", "size"],
  });
}
export async function storeProduct(slug: string) {
  if (isDemoMode()) return demoProducts.find((p) => p.slug === slug) ?? null;
  const p = await db.product.findUnique({
    where: { slug, active: true },
    include: {
      variants: { where: { active: true }, orderBy: { size: "asc" } },
      images: { orderBy: { position: "asc" } },
    },
  });
  return p
    ? {
        ...p,
        variants: p.variants.map((v) => ({
          id: v.id,
          color: v.color,
          size: v.size,
          price: Number(v.price),
          stock: v.stock,
        })),
      }
    : null;
}
