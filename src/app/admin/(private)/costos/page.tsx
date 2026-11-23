import Link from "next/link";
import { requireAdminPage } from "@/lib/security";
import { db } from "@/lib/db";
import { settings } from "@/lib/services";
import { money, margins } from "@/lib/money";
import { AdminTitle } from "@/components/admin-shared";
const percent = (v: number | null) =>
  v === null ? "No definido" : `${v.toFixed(1)} %`;
export default async function Costs() {
  await requireAdminPage();
  const s = await settings(),
    variants = await db.variant.findMany({
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    });
  const history = await db.priceHistory.findMany({
    include: { variant: { include: { product: true } } },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <AdminTitle
        eyebrow="NÚMEROS CON CONTEXTO"
        title="Costos y rentabilidad."
      />
      <p className="notice">
        Ganancia bruta = precio − costo. Margen = ganancia / precio. Recargo =
        ganancia / costo. No incluyen impuestos, comisiones, envío ni gastos
        operativos.
      </p>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto / variante</th>
                <th>Costo</th>
                <th>Precio</th>
                <th>Ganancia bruta</th>
                <th>Margen</th>
                <th>Recargo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const m = margins(Number(v.price), Number(v.cost));
                return (
                  <tr key={v.id}>
                    <td>
                      {v.product.name}
                      <small>
                        {v.color} / {v.size}
                      </small>
                    </td>
                    <td>{money(v.cost, s.currency)}</td>
                    <td>{money(v.price, s.currency)}</td>
                    <td>{money(m.profit, s.currency)}</td>
                    <td>{percent(m.margin)}</td>
                    <td>{percent(m.markup)}</td>
                    <td>
                      <Link href={`/admin/productos/${v.productId}`}>
                        Editar ↗
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>Últimos cambios de precio y costo</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Variante</th>
                <th>Precio registrado</th>
                <th>Costo registrado</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>
                    {h.createdAt.toLocaleString("es-AR", {
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                  </td>
                  <td>
                    {h.variant.product.name} · {h.variant.color}/
                    {h.variant.size}
                  </td>
                  <td>{money(h.price, s.currency)}</td>
                  <td>{money(h.cost, s.currency)}</td>
                  <td>{h.actorId.slice(-8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine-print">
          Los cambios no modifican las instantáneas de pedidos ya creados. Se
          muestran hasta 50 cambios.
        </p>
      </section>
    </>
  );
}
