import { db } from "@/lib/db";
import { settings } from "@/lib/services";
import { ProductCard } from "@/components/product-card";
import { Empty } from "@/components/ui";
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams,
    s = await settings();
  const allVariants = await db.variant.findMany({
    where: { active: true, product: { active: true } },
    select: { color: true, size: true },
    distinct: ["color", "size"],
  });
  const min =
    q.min && Number.isFinite(Number(q.min))
      ? Math.max(0, Number(q.min))
      : undefined;
  const max =
    q.max && Number.isFinite(Number(q.max))
      ? Math.max(0, Number(q.max))
      : undefined;
  const products = await db.product.findMany({
    where: {
      active: true,
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
    take: 200,
  });
  return (
    <section className="section">
      <span className="eyebrow">EXPLORÁ EL ESTUDIO</span>
      <h1 className="page-title">
        La colección<span className="accent">.</span>
      </h1>
      <p className="muted">Tu próxima remera favorita empieza acá.</p>
      <form className="filters">
        <label>
          Buscar
          <input name="q" defaultValue={q.q} placeholder="Nombre o diseño" />
        </label>
        <label>
          Color
          <select name="color" defaultValue={q.color}>
            <option value="">Todos</option>
            {[...new Set(allVariants.map((v) => v.color))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Talle
          <select name="size" defaultValue={q.size}>
            <option value="">Todos</option>
            {[...new Set(allVariants.map((v) => v.size))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Precio mínimo
          <input name="min" type="number" min="0" defaultValue={q.min} />
        </label>
        <label>
          Precio máximo
          <input name="max" type="number" min="0" defaultValue={q.max} />
        </label>
        <label className="check">
          <input name="stock" type="checkbox" defaultChecked={!!q.stock} /> En
          stock
        </label>
        <button className="button">Filtrar</button>
        <a href="/tienda">Limpiar</a>
      </form>
      <p className="result-count">
        {products.length} diseños encontrados
        {products.length === 200
          ? " · Mostrando los primeros 200; usá los filtros."
          : ""}
      </p>
      {products.length ? (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} currency={s.currency} />
          ))}
        </div>
      ) : (
        <Empty title="Todavía no hay diseños para mostrar">
          Probá con otros filtros o volvé pronto.
        </Empty>
      )}
    </section>
  );
}
