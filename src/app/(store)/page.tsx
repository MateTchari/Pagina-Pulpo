import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDown,
  Shirt,
  Sparkles,
  PackageCheck,
} from "lucide-react";
import { storeProducts } from "@/lib/store-data";
import { settings } from "@/lib/services";
import { ProductCard } from "@/components/product-card";
import { Empty } from "@/components/ui";
import { Brand } from "@/components/brand";
import { isDemoMode } from "@/lib/mode";
import {
  DemoProductGrid,
  DemoBusinessDescription,
} from "@/components/demo-store";
export default async function Home() {
  const s = await settings();
  const products = await storeProducts({}, true);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="dot" /> TU ESTILO. TUS REGLAS.
          </span>
          <h1>
            Una remera.
            <br />
            Mil formas de
            <br />
            <em>ser vos.</em>
          </h1>
          <p>
            Diseños que te representan, colores que te acompañan. Encontrá esa
            remera que dice todo sin decir nada.
          </p>
          <Link className="button" href="/tienda">
            Explorar la colección <ArrowUpRight size={20} />
          </Link>
          <div className="hero-caption">
            <span>DISEÑOS CON IDENTIDAD</span>
            <ArrowDown size={17} />
            <span>PARA TODOS LOS DÍAS</span>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Vista provisoria de remeras SANTOS"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-index">SANTOS / ESTUDIO</span>
          <img
            className="santos-hero-photo"
            src="/brand/santos-shirts-v2.webp"
            alt="Mockup provisorio de remeras SANTOS negra y blanca con el logo de la marca"
          />
          <div className="art-note">
            Diseñá tu forma
            <br />
            de estar en el mundo. <Sparkles size={18} />
          </div>
          <span className="art-label">
            VISTA DE REFERENCIA · IMAGEN PROVISORIA
          </span>
        </div>
      </section>
      <div className="ticker">
        <span>DISEÑOS PROPIOS</span>
        <Brand mark light />
        <span>EXPRESÁ TU ESTILO</span>
        <Brand mark light />
        <span>ENCONTRÁ TU FAVORITA</span>
        <Brand mark light />
        <span>HECHO PARA VOS</span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LA SELECCIÓN DEL ESTUDIO</span>
            <h2>Tus próximos favoritos.</h2>
          </div>
          <Link href="/tienda">
            Ver toda la colección <ArrowUpRight size={18} />
          </Link>
        </div>
        {isDemoMode() ? (
          <DemoProductGrid featured />
        ) : products.length ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} currency={s.currency} />
            ))}
          </div>
        ) : (
          <Empty title="La colección está en camino">
            Pronto vas a encontrar nuestros diseños acá.
          </Empty>
        )}
      </section>
      <section id="nosotros" className="about">
        <span className="eyebrow">MÁS QUE UNA REMERA</span>
        <h2>
          Lo que llevás puesto
          <br />
          también cuenta <em>tu historia.</em>
        </h2>
        <p>{isDemoMode() ? <DemoBusinessDescription /> : s.description}</p>
        <div className="values">
          <div>
            <Shirt />
            <h3>Elegí a tu manera</h3>
            <p>Explorá los colores y talles de cada diseño.</p>
          </div>
          <div>
            <Sparkles />
            <h3>Un toque personal</h3>
            <p>Contanos tu idea en las notas del pedido.</p>
          </div>
          <div>
            <PackageCheck />
            <h3>Coordinación directa</h3>
            <p>
              La confirmación, el pago y la entrega se coordinan con el estudio.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
