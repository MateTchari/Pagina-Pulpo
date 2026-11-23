"use client";
import Link from "next/link";
import { useDemoBusiness } from "./demo-business-provider";
import { demoPublicProducts } from "@/lib/demo-business";
import { demoSettings } from "@/lib/demo-products";
import { ProductCard } from "./product-card";
import { ProductDetail } from "./product-detail";
import { Empty } from "./ui";
import { Header } from "./header";
import { Brand } from "./brand";
export function DemoStoreFrame({ children }: { children: React.ReactNode }) {
  const demo = useDemoBusiness(),
    s = demo?.state?.settings ?? demoSettings;
  return (
    <div style={{ "--accent": s.accent } as React.CSSProperties}>
      <div className="demo-banner" role="note">
        <strong>Vista de demostración</strong>
        <span>
          Productos, precios y stock de ejemplo. Podés probar la tienda y su
          administración; no se realizan compras.
        </span>
        <Link href="/admin/demo" className="text-link">
          Abrir panel de prueba ↗
        </Link>
      </div>
      <Header name={s.name} logo="/brand/santos-logo-black.png" />
      <main>{children}</main>
      <footer>
        <div>
          <span className="eyebrow">HECHO PARA EXPRESARTE</span>
          <Link
            href="/"
            className="footer-brand"
            aria-label={`${s.name} · Inicio`}
          >
            <Brand name={s.name} light />
          </Link>
          <p>{s.description}</p>
        </div>
        <div>
          <Link href="/tienda">Explorar colección ↗</Link>
          <Link href="/carrito">Mi carrito</Link>
          <Link href="/admin/demo">Panel administrativo de prueba ↗</Link>
          <small>
            © {new Date().getFullYear()} {s.name}
          </small>
        </div>
      </footer>
    </div>
  );
}
export function DemoBusinessDescription() {
  const demo = useDemoBusiness();
  return <>{demo?.state?.settings.description ?? demoSettings.description}</>;
}
export function DemoProductGrid({
  filters = {},
  featured = false,
}: {
  filters?: Record<string, string | undefined>;
  featured?: boolean;
}) {
  const demo = useDemoBusiness();
  if (!demo?.state)
    return (
      <p className="muted" role="status">
        Cargando colección de prueba…
      </p>
    );
  const products = demoPublicProducts(demo.state, filters, featured);
  return products.length ? (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          currency={demo.state!.settings.currency}
        />
      ))}
    </div>
  ) : (
    <Empty title="No hay diseños para estos filtros">
      Probá otros filtros o creá un producto desde el panel de prueba.
    </Empty>
  );
}
export function DemoCatalog({
  filters: q,
}: {
  filters: Record<string, string | undefined>;
}) {
  const demo = useDemoBusiness(),
    variants =
      demo?.state?.products
        .filter((p) => p.active)
        .flatMap((p) => p.variants.filter((v) => v.active)) ?? [],
    count = demo?.state ? demoPublicProducts(demo.state, q).length : null;
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
        <div>
          <label htmlFor="demo-catalog-color">Color</label>
          <select id="demo-catalog-color" name="color" defaultValue={q.color}>
            <option value="">Todos</option>
            {[...new Set(variants.map((v) => v.color))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="demo-catalog-size">Talle</label>
          <select id="demo-catalog-size" name="size" defaultValue={q.size}>
            <option value="">Todos</option>
            {[...new Set(variants.map((v) => v.size))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <label>
          Precio mínimo
          <input name="min" type="number" min="0" defaultValue={q.min} />
        </label>
        <label>
          Precio máximo
          <input name="max" type="number" min="0" defaultValue={q.max} />
        </label>
        <label className="check">
          <input name="stock" type="checkbox" defaultChecked={!!q.stock} />
          En stock
        </label>
        <button className="button">Filtrar</button>
        <Link href="/tienda">Limpiar</Link>
      </form>
      {count !== null && (
        <p className="result-count">{count} diseños encontrados</p>
      )}
      <DemoProductGrid filters={q} />
    </section>
  );
}
export function DemoProductPage({ slug }: { slug: string }) {
  const demo = useDemoBusiness();
  if (!demo?.state)
    return (
      <section className="section" role="status">
        Cargando diseño de prueba…
      </section>
    );
  const p = demoPublicProducts(demo.state).find((p) => p.slug === slug);
  return (
    <section className="section">
      <Link href="/tienda" className="back">
        ← Volver a la colección
      </Link>
      {p ? (
        <ProductDetail
          name={p.name}
          description={p.description}
          images={p.images}
          variants={p.variants}
          currency={demo.state.settings.currency}
          demo
        />
      ) : (
        <Empty title="Este diseño no está publicado en la prueba">
          <Link href="/tienda">Volver a la colección</Link>
        </Empty>
      )}
    </section>
  );
}
