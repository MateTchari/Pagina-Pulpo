import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/security";
import { db } from "@/lib/db";
import { AdminTitle } from "@/components/admin-shared";
import { OrderActions } from "@/components/admin-forms";
import { labels } from "@/lib/order-state";
import { money } from "@/lib/money";
import { Badge } from "@/components/ui";
export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const o = await db.order.findUnique({
    where: { id: (await params).id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!o) notFound();
  return (
    <>
      <AdminTitle
        eyebrow="PEDIDOS / DETALLE"
        title={`Pedido #${o.id.slice(-8).toUpperCase()}`}
      >
        <Badge>{labels[o.status]}</Badge>
      </AdminTitle>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>{o.customerName}</h2>
          <a href={`mailto:${o.customerEmail}`}>{o.customerEmail}</a>
          <p className="description">{o.note || "Sin notas del comprador."}</p>
          <p className="muted">
            Creado{" "}
            {o.createdAt.toLocaleString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
            })}
          </p>
          <OrderActions id={o.id} status={o.status} />
          <p className="fine-print">
            Confirmar registra una venta y descuenta stock; no registra un cobro
            ni acredita un pago.
          </p>
        </section>
        <section className="panel">
          <h2>Historial de estados</h2>
          <ol className="timeline">
            {o.history.map((h) => (
              <li key={h.id}>
                <strong>{labels[h.status]}</strong>
                <span>
                  {h.createdAt.toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                  })}{" "}
                  · {h.actorId ? `Admin ${h.actorId.slice(-8)}` : "Cliente"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className="panel">
        <h2>Detalle e importes históricos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th>Unidades</th>
                <th>Precio unitario</th>
                <th>Costo unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.productName}</td>
                  <td>
                    {i.color} / {i.size}
                  </td>
                  <td>{i.quantity}</td>
                  <td>{money(i.unitPrice, o.currency)}</td>
                  <td>{money(i.unitCost, o.currency)}</td>
                  <td>{money(i.unitPrice.mul(i.quantity), o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="summary-row">
          <strong>Total de productos</strong>
          <strong>{money(o.total, o.currency)}</strong>
        </div>
        <p>Inventario descontado: {o.stockDeducted ? "Sí" : "No"}</p>
      </section>
    </>
  );
}
