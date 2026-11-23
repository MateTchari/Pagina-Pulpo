import Link from "next/link";
import { requireAdminPage } from "@/lib/security";
import { db } from "@/lib/db";
import { AdminTitle } from "@/components/admin-shared";
import { StockForm } from "@/components/admin-forms";
import { Badge, Empty } from "@/components/ui";
export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();
  const q = await searchParams;
  const variants = await db.variant.findMany({
    where: {
      ...(q.q
        ? {
            product: {
              name: { contains: q.q.slice(0, 150), mode: "insensitive" },
            },
          }
        : {}),
    },
    include: { product: true },
    orderBy: { product: { name: "asc" } },
    take: 1000,
  });
  const filtered = q.low
    ? variants.filter((v) => v.stock <= v.minStock)
    : variants;
  const movements = await db.stockMovement.findMany({
    where: q.variant ? { variantId: q.variant } : {},
    include: { variant: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <AdminTitle eyebrow="CADA UNIDAD CUENTA" title="Inventario conectado." />
      <StockForm
        variants={variants.map((v) => ({
          id: v.id,
          label: `${v.product.name} · ${v.color} / ${v.size} · ${v.stock} uds.`,
        }))}
      />
      <form className="filters">
        <label>
          Producto
          <input name="q" defaultValue={q.q} />
        </label>
        <label className="check">
          <input name="low" type="checkbox" defaultChecked={!!q.low} />
          Solo stock mínimo
        </label>
        <button className="button secondary">Filtrar</button>
      </form>
      <section className="panel">
        <h2>Stock por variante</h2>
        <p className="muted">
          Total mostrado: {filtered.reduce((sum, v) => sum + v.stock, 0)}{" "}
          unidades
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Color / talle</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td>{v.product.name}</td>
                  <td>
                    {v.color} / {v.size}
                  </td>
                  <td>{v.sku}</td>
                  <td>
                    <strong>{v.stock}</strong>
                  </td>
                  <td>{v.minStock}</td>
                  <td>
                    <Badge>
                      {!v.active
                        ? "Inactiva"
                        : !v.stock
                          ? "Agotada"
                          : v.stock <= v.minStock
                            ? "Stock bajo"
                            : "Disponible"}
                    </Badge>
                  </td>
                  <td>
                    <Link href={`/admin/inventario?variant=${v.id}`}>
                      Movimientos ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <Empty title="Sin variantes para mostrar" />}
        <p className="fine-print">
          Hasta 1000 variantes. Usá el filtro de producto.
        </p>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Últimos movimientos</h2>
          {q.variant && <Link href="/admin/inventario">Ver todos</Link>}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto / variante</th>
                <th>Unidades</th>
                <th>Motivo</th>
                <th>Referencia</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.createdAt.toLocaleString("es-AR", {
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                  </td>
                  <td>
                    {m.variant.product.name}
                    <small>
                      {m.variant.color} / {m.variant.size}
                    </small>
                  </td>
                  <td className={m.quantity > 0 ? "positive" : "negative"}>
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </td>
                  <td>{m.reason}</td>
                  <td>
                    {m.orderId ? (
                      <Link href={`/admin/ventas/${m.orderId}`}>Pedido ↗</Link>
                    ) : (
                      "Ajuste manual"
                    )}
                  </td>
                  <td>{m.actorId?.slice(-8) ?? "Sistema"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!movements.length && <Empty title="Sin movimientos registrados" />}
        <p className="fine-print">Se muestran los últimos 100 movimientos.</p>
      </section>
    </>
  );
}
