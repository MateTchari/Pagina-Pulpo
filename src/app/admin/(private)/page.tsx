import Link from "next/link";
import { requireAdminPage } from "@/lib/security";
import {
  ArrowUpRight,
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { settings, statistics } from "@/lib/services";
import { money } from "@/lib/money";
import { SalesChart } from "@/components/charts";
import { AdminTitle, DateFilter, dateRange } from "@/components/admin-shared";
import { Badge, Empty } from "@/components/ui";
import { labels } from "@/lib/order-state";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();
  const range = dateRange(await searchParams),
    current = dateRange({});
  const todayRange = dateRange({ from: current.to, to: current.to });
  const [s, stats, month, today, variants, orders, pending] = await Promise.all(
    [
      settings(),
      statistics(range.start, range.end),
      statistics(current.start, current.end),
      statistics(todayRange.start, todayRange.end),
      db.variant.findMany({
        where: { active: true },
        include: { product: true },
      }),
      db.order.findMany({ take: 6, orderBy: { createdAt: "desc" } }),
      db.order.count({ where: { status: "PENDING" } }),
    ],
  );
  const low = variants.filter((v) => v.stock <= v.minStock);
  const metrics = [
    {
      label: "Ingresos del período",
      value: money(stats.revenue, s.currency),
      icon: DollarSign,
      note: "Ventas confirmadas · sin cobros",
    },
    {
      label: "Ganancia bruta estimada",
      value: money(stats.profit, s.currency),
      icon: TrendingUp,
      note: "Ingresos menos mercadería vendida",
    },
    {
      label: "Ventas confirmadas",
      value: stats.orders,
      icon: ShoppingBag,
      note: `${stats.units} unidades vendidas`,
    },
    {
      label: "Stock disponible",
      value: variants.reduce((a, v) => a + v.stock, 0),
      icon: Package,
      note: `${low.length} variantes en stock mínimo`,
    },
  ];
  return (
    <>
      <AdminTitle
        eyebrow="UNA MIRADA A TU NEGOCIO"
        title="Todo empieza con una idea."
      >
        <Link href="/admin/productos/nuevo" className="button">
          Nuevo producto <ArrowUpRight size={17} />
        </Link>
      </AdminTitle>
      {!s.ordersEnabled && (
        <p className="notice">
          Tu tienda todavía no recibe pedidos. Revisá la moneda y aceptá el
          flujo manual en{" "}
          <Link href="/admin/configuracion">Configuración ↗</Link>.
        </p>
      )}
      <DateFilter from={range.from} to={range.to} />
      <div className="metrics">
        {metrics.map((m) => (
          <div className="metric" key={m.label}>
            <div>
              <span>{m.label}</span>
              <m.icon size={18} />
            </div>
            <strong>{m.value}</strong>
            <small>{m.note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Evolución del negocio</h2>
              <p className="muted">Ingresos y costo de mercadería</p>
            </div>
            <Badge>Período seleccionado</Badge>
          </div>
          <SalesChart data={stats.daily} currency={s.currency} />
          <div className="mini-metrics">
            <div>
              Ventas de hoy
              <strong>
                {today.orders} · {money(today.revenue, s.currency)}
              </strong>
            </div>
            <div>
              Ventas del mes
              <strong>
                {month.orders} · {money(month.revenue, s.currency)}
              </strong>
            </div>
            <div>
              Costo del período<strong>{money(stats.cost, s.currency)}</strong>
            </div>
          </div>
        </section>
        <section className="panel">
          <span className="eyebrow">PARA TENER EN CUENTA</span>
          <h2>Tu próxima acción</h2>
          <Link className="action-card" href="/admin/ventas?status=PENDING">
            <span className="action-number">{pending}</span>
            <div>
              <h3>Pedidos pendientes</h3>
              <p>Revisá y coordiná la confirmación.</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
          <Link className="action-card" href="/admin/inventario">
            <span className="action-number">{low.length}</span>
            <div>
              <h3>Variantes con bajo stock</h3>
              <p>Prepará la próxima reposición.</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
          <p className="fine-print">
            La ganancia bruta no incluye impuestos, comisiones, envíos ni gastos
            operativos. Los cobros no se registran aún.
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Últimos pedidos</h2>
          <Link href="/admin/ventas">Ver todos ↗</Link>
        </div>
        {orders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Importe</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/ventas/${o.id}`}>
                        #{o.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td>{o.customerName}</td>
                    <td>
                      {o.createdAt.toLocaleDateString("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                      })}
                    </td>
                    <td>{money(o.total, o.currency)}</td>
                    <td>
                      <Badge>{labels[o.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Tu primera venta empieza acá">
            Los pedidos de la tienda aparecerán automáticamente.
          </Empty>
        )}
      </section>
    </>
  );
}
