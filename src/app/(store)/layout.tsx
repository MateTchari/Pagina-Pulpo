import { settings } from "@/lib/services";
import { Header } from "@/components/header";
import Link from "next/link";
import { Brand } from "@/components/brand";
export const dynamic = "force-dynamic";
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await settings();
  return (
    <div style={{ "--accent": s.accent } as React.CSSProperties}>
      <Header name={s.name} logo={s.logoUrl} />
      <main>{children}</main>
      <footer>
        <div>
          <span className="eyebrow">HECHO PARA EXPRESARTE</span>
          <Link
            href="/"
            className="footer-brand"
            aria-label={`${s.name} · Inicio`}
          >
            <Brand name={s.name} logo={s.logoUrl} light />
          </Link>
          <p>{s.description}</p>
        </div>
        <div>
          <Link href="/tienda">Explorar colección ↗</Link>
          <Link href="/carrito">Mi carrito</Link>
          <Link href="/admin">Administración</Link>
          <small>
            © {new Date().getFullYear()} {s.name}
          </small>
        </div>
      </footer>
    </div>
  );
}
