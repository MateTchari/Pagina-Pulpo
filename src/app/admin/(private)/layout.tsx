import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  ShoppingBag,
  ChartNoAxesCombined,
  Settings,
  Calculator,
  ArrowUpRight,
} from "lucide-react";
import { requireAdmin, AppError } from "@/lib/security";
import { Logout } from "@/components/login-form";
import { Brand } from "@/components/brand";
import { settings } from "@/lib/services";
import { isDemoMode } from "@/lib/mode";
export const dynamic = "force-dynamic";
const nav = [
  { href: "/admin", name: "Resumen", icon: LayoutDashboard },
  { href: "/admin/productos", name: "Productos", icon: Shirt },
  { href: "/admin/inventario", name: "Inventario", icon: Boxes },
  { href: "/admin/ventas", name: "Pedidos y ventas", icon: ShoppingBag },
  {
    href: "/admin/estadisticas",
    name: "Estadísticas",
    icon: ChartNoAxesCombined,
  },
  { href: "/admin/costos", name: "Costos y márgenes", icon: Calculator },
  { href: "/admin/configuracion", name: "Configuración", icon: Settings },
];
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isDemoMode()) redirect("/admin/demo");
  let name = "";
  try {
    name = (await requireAdmin()).name;
  } catch (e) {
    if (e instanceof AppError) redirect("/admin/login");
    throw e;
  }
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="admin-brand" href="/admin">
          <Brand name={(await settings()).name} />
          <small>GESTIÓN DEL NEGOCIO</small>
        </Link>
        <span className="nav-label">ESPACIO DE TRABAJO</span>
        <nav aria-label="Administración">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              <n.icon size={19} />
              {n.name}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            Abrir tienda <ArrowUpRight size={16} />
          </Link>
          <Logout />
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <span>
            SANTOS <span className="muted">/ Administración</span>
          </span>
          <div>
            <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
            {name}
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
