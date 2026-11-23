import Link from "next/link";
import { requireAdminPage } from "@/lib/security";
import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { AdminTitle, dateRange } from "@/components/admin-shared";
import { labels } from "@/lib/order-state";
import { Badge, Empty } from "@/components/ui";
import { money } from "@/lib/money";
export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();
  const q = await searchParams,
    r = dateRange(q),
    status = Object.values(OrderStatus).includes(q.status as OrderStatus)
      ? (q.status as OrderStatus)
      : undefined;
  const orders = await db.order.findMany({
    where: { status, createdAt: { gte: r.start, lte: r.end } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <AdminTitle eyebrow="DE LA IDEA A LA ENTREGA" title="Pedidos y ventas." />
      <form className="filters">
        <label>
          Desde
          <input name="from" type="date" defaultValue={r.from} />
        </label>
        <label>
          Hasta
          <input name="to" type="date" defaultValue={r.to} />
        </label>
        <label>
          Estado
          <select name="status" defaultValue={status ?? ""}>
            <option value="">Todos</option>
            {Object.entries(labels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary">Filtrar</button>
      </form>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido / fecha</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>#{o.id.slice(-8).toUpperCase()}</strong>
                    <small>
                      {o.createdAt.toLocaleDateString("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                      })}
                    </small>
                  </td>
                  <td>
                    {o.customerName}
                    <small>{o.customerEmail}</small>
                  </td>
                  <td>
                    {o.items
                      .map(
                        (i) =>
                          `${i.quantity} × ${i.productName} (${i.color}/${i.size})`,
                      )
                      .join(", ")}
                  </td>
                  <td>{money(o.total, o.currency)}</td>
                  <td>
                    <Badge>{labels[o.status]}</Badge>
                  </td>
                  <td>
                    <Link href={`/admin/ventas/${o.id}`}>Ver detalle ↗</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length && <Empty title="No hay pedidos en este período" />}
        <p className="fine-print">
          Hasta 200 pedidos. Acotá las fechas para buscar pedidos anteriores.
        </p>
      </section>
    </>
  );
}
