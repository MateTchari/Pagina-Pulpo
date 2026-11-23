export const demoSettings = {
  name: "SANTOS",
  description: "Remeras con identidad propia. Encontrá tu estilo con SANTOS.",
  currency: "ARS",
  accent: "#c45135",
  logoUrl: "/brand/santos-logo-black.png",
  ordersEnabled: false,
};
export const demoProducts = [
  {
    id: "demo-original",
    slug: "santos-original",
    name: "SANTOS Original",
    price: 24900,
    colors: ["Negro", "Blanco"],
    sizes: ["S", "M", "L", "XL"],
    featured: true,
  },
  {
    id: "demo-oversize",
    slug: "santos-oversize",
    name: "SANTOS Oversize",
    price: 28900,
    colors: ["Negro", "Blanco"],
    sizes: ["M", "L", "XL"],
    featured: true,
  },
  {
    id: "demo-esencial",
    slug: "santos-esencial",
    name: "SANTOS Esencial",
    price: 22900,
    colors: ["Blanco"],
    sizes: ["S", "M", "L"],
    featured: true,
  },
].map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  featured: p.featured,
  description:
    "Remera de muestra con la identidad SANTOS. Elegí color y talle para probar la experiencia de compra. Imagen, precio y disponibilidad de ejemplo; este diseño no se ofrece a la venta en la demostración.",
  images: [
    {
      url: "/brand/santos-shirts-v2.webp",
      alt: `Mockup provisorio de remeras SANTOS · ${p.name}`,
    },
  ],
  variants: p.colors.flatMap((color, c) =>
    p.sizes.map((size, s) => ({
      id: `${p.id}-${c}-${s}`,
      color,
      size,
      price: p.price,
      stock: 10,
    })),
  ),
}));

export function summarizeDemoCart(
  lines: { variantId: string; quantity: number }[],
) {
  if (!lines.length) throw new Error("El carrito está vacío.");
  const variants = demoProducts.flatMap((p) => p.variants);
  let total = 0,
    units = 0;
  for (const line of lines) {
    const variant = variants.find((v) => v.id === line.variantId);
    if (
      !variant ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > variant.stock
    )
      throw new Error(
        "Revisá la variante y la cantidad de muestra del carrito.",
      );
    total += variant.price * line.quantity;
    units += line.quantity;
  }
  return { total, units };
}
