import { settings, statistics } from "@/lib/services";
import { requireAdminPage } from "@/lib/security";
import { money, margins } from "@/lib/money";
import { AdminTitle, DateFilter, dateRange } from "@/components/admin-shared";
import { SalesChart } from "@/components/charts";
export default async function Stats({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();
  const r = dateRange(await searchParams),
    s = await settings(),
    stats = await statistics(r.start, r.end);
  return (
    <>
      <AdminTitle
        eyebrow="DATOS PARA DECIDIR"
        title="La evolución de tu estudio."
      />
      <DateFilter from={r.from} to={r.to} />
      <div className="metrics">
        {[
          {
            label: "Ingresos por ventas",
            value: money(stats.revenue, s.currency),
          },
          {
            label: "Costo de mercadería",
            value: money(stats.cost, s.currency),
          },
          {
            label: "Ganancia bruta estimada",
            value: money(stats.profit, s.currency),
          },
          {
            label: "Unidades / ventas",
            value: `${stats.units} / ${stats.orders}`,
          },
        ].map((m) => (
          <div className="metric" key={m.label}>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Ventas diarias</h2>
          <SalesChart data={stats.daily} currency={s.currency} />
        </section>
        <section className="panel">
          <h2>Ventas mensuales</h2>
          <SalesChart data={stats.monthly} currency={s.currency} />
        </section>
      </div>
      <section className="panel">
        <h2>Productos más vendidos y márgenes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto / variante</th>
                <th>Unidades</th>
                <th>Ingresos</th>
                <th>Costos</th>
                <th>Ganancia bruta</th>
                <th>Margen</th>
              </tr>
            </thead>
            <tbody>
              {stats.products.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.units}</td>
                  <td>{money(p.revenue, s.currency)}</td>
                  <td>{money(p.cost, s.currency)}</td>
                  <td>{money(p.revenue - p.cost, s.currency)}</td>
                  <td>
                    {margins(p.revenue, p.cost).margin?.toFixed(1) ?? "—"} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>Valores diarios del gráfico</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha de confirmación</th>
                <th>Ingresos</th>
                <th>Costo de mercadería</th>
                <th>Ganancia bruta</th>
              </tr>
            </thead>
            <tbody>
              {stats.daily.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{money(d.revenue, s.currency)}</td>
                  <td>{money(d.cost, s.currency)}</td>
                  <td>{money(d.revenue - d.cost, s.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="notice">
        Solo ventas confirmadas, en preparación o completadas, según su fecha de
        confirmación (Argentina, UTC−3). Los cancelados y pendientes se
        excluyen. Los cobros no están implementados. No se calcula ganancia
        neta: faltan gastos operativos, impuestos, comisiones y envíos. Las
        cancelaciones de períodos anteriores reexpresan esos períodos.
      </p>
    </>
  );
}
