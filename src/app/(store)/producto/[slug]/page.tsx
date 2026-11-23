import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { settings } from "@/lib/services";
import { ProductDetail } from "@/components/product-detail";
export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await db.product.findUnique({
    where: { slug, active: true },
    include: {
      variants: { where: { active: true }, orderBy: { size: "asc" } },
      images: { orderBy: { position: "asc" } },
    },
  });
  if (!p) notFound();
  const s = await settings();
  return (
    <section className="section">
      <Link className="back" href="/tienda">
        ← Volver a la colección
      </Link>
      <ProductDetail
        name={p.name}
        description={p.description}
        images={p.images}
        variants={p.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          price: Number(v.price),
          stock: v.stock,
        }))}
        currency={s.currency}
      />
    </section>
  );
}
