import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { money } from "@/lib/money";
export type ProductCardData = {
  slug: string;
  name: string;
  images: { url: string; alt: string }[];
  variants: { price: { toString(): string }; color: string; stock: number }[];
};
export function ProductCard({
  product: p,
  currency,
}: {
  product: ProductCardData;
  currency: string;
}) {
  const price = Math.min(...p.variants.map((v) => Number(v.price)));
  return (
    <Link href={`/producto/${p.slug}`} className="product-card">
      <div className="product-photo">
        {p.images[0] ? (
          <img src={p.images[0].url} alt={p.images[0].alt || p.name} />
        ) : (
          <div className="photo-placeholder">
            <img
              className="provisional-product-photo"
              src="/brand/santos-shirts-v2.webp"
              alt={`Referencia provisoria SANTOS para ${p.name}`}
            />
            <small>Imagen de referencia</small>
          </div>
        )}
        <span className="product-tag">
          {p.variants.some((v) => v.stock > 0) ? "Disponible" : "Agotado"}
        </span>
        <span className="product-arrow">
          <ArrowUpRight size={21} />
        </span>
      </div>
      <div className="product-meta">
        <h3>{p.name}</h3>
        <span>
          {Number.isFinite(price) ? money(price, currency) : "Sin variantes"}
        </span>
      </div>
      <p>{[...new Set(p.variants.map((v) => v.color))].join(" · ")}</p>
    </Link>
  );
}
