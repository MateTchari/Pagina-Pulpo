"use client";
import Link from "next/link";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { useCart } from "./cart-provider";
import { Brand } from "./brand";
export function Header({ name, logo }: { name: string; logo: string | null }) {
  const { lines } = useCart();
  return (
    <>
      <div className="announcement">
        Diseños que hablan de vos. Encontrá tu próxima remera.
      </div>
      <header className="store-header">
        <Link href="/" className="brand">
          <Brand name={name} logo={logo} />
          <small>ESTUDIO DE REMERAS</small>
        </Link>
        <nav aria-label="Navegación principal">
          <Link href="/tienda">
            Colección <ArrowUpRight size={14} />
          </Link>
          <Link href="/#nosotros" className="hide-mobile">
            El estudio
          </Link>
          <Link href="/carrito" className="bag">
            <ShoppingBag size={19} />
            <span>Carrito ({lines.reduce((s, l) => s + l.quantity, 0)})</span>
          </Link>
        </nav>
      </header>
    </>
  );
}
