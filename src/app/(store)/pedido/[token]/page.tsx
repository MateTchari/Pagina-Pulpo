import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { labels } from "@/lib/order-state";
import { money } from "@/lib/money";
import { Badge } from "@/components/ui";
export const metadata = { robots: { index: false, follow: false } };
export default async function OrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const o = await db.order.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      status: true,
      total: true,
      currency: true,
      createdAt: true,
      items: {
        select: {
          productName: true,
          color: true,
          size: true,
          quantity: true,
          unitPrice: true,
        },
      },
      history: {
        select: { status: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!o) notFound();
  return (
    <section className="section narrow">
      <span className="eyebrow">SEGUIMIENTO DEL PEDIDO</span>
      <h1 className="page-title">Tu idea, en marcha.</h1>
      <Badge>{labels[o.status]}</Badge>
      <p className="muted">
        Pedido {o.id.slice(-8).toUpperCase()} ·{" "}
        {o.createdAt.toLocaleDateString("es-AR")}
      </p>
      <div className="panel">
        {o.items.map((i, idx) => (
          <div className="summary-row" key={idx}>
            <span>
              {i.quantity} × {i.productName}
              <small>
                {i.color} / {i.size}
              </small>
            </span>
            <strong>{money(i.unitPrice.mul(i.quantity), o.currency)}</strong>
          </div>
        ))}
        <div className="summary-row">
          <strong>Total de productos</strong>
          <strong>{money(o.total, o.currency)}</strong>
        </div>
      </div>
      <p className="notice">
        Conservá este enlace privado para consultar el estado. El pedido no
        acredita un pago. El pago y la entrega se coordinan directamente con el
        estudio.
      </p>
      <h2>Historial</h2>
      <ol className="timeline">
        {o.history.map((h, i) => (
          <li key={i}>
            <strong>{labels[h.status]}</strong>
            <span>
              {h.createdAt.toLocaleString("es-AR", {
                timeZone: "America/Argentina/Buenos_Aires",
              })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
