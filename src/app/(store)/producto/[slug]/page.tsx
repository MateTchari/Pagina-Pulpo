import { notFound } from "next/navigation";
import Link from "next/link";
import { storeProduct } from "@/lib/store-data";
import { isDemoMode } from "@/lib/mode";
import { DemoProductPage } from "@/components/demo-store";
import { settings } from "@/lib/services";
import { ProductDetail } from "@/components/product-detail";
export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isDemoMode()) return <DemoProductPage slug={slug} />;
  const p = await storeProduct(slug);
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
        demo={isDemoMode()}
      />
    </section>
  );
}
