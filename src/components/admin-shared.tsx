import type { ReactNode } from "react";
export function AdminTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="admin-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
export function DateFilter({ from, to }: { from: string; to: string }) {
  return (
    <form className="date-filter">
      <label>
        Desde
        <input type="date" name="from" defaultValue={from} required />
      </label>
      <label>
        Hasta
        <input type="date" name="to" defaultValue={to} required />
      </label>
      <button className="button secondary">Aplicar período</button>
    </form>
  );
}
export function dateRange(q: Record<string, string | undefined>) {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
  let from = /^\d{4}-\d{2}-\d{2}$/.test(q.from ?? "")
    ? q.from!
    : `${today.slice(0, 7)}-01`;
  let to = /^\d{4}-\d{2}-\d{2}$/.test(q.to ?? "") ? q.to! : today;
  if (Number.isNaN(Date.parse(from))) from = `${today.slice(0, 7)}-01`;
  if (Number.isNaN(Date.parse(to))) to = today;
  if (from > to) [from, to] = [to, from];
  return {
    from,
    to,
    start: new Date(`${from}T00:00:00-03:00`),
    end: new Date(`${to}T23:59:59.999-03:00`),
  };
}
