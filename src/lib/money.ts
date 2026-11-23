export function margins(price: number, cost: number) {
  if (
    !Number.isFinite(price) ||
    !Number.isFinite(cost) ||
    price < 0 ||
    cost < 0
  )
    throw new Error("Importes inválidos");
  return {
    profit: price - cost,
    margin: price === 0 ? null : ((price - cost) / price) * 100,
    markup: cost === 0 ? null : ((price - cost) / cost) * 100,
  };
}
export function money(
  value: number | string | { toString(): string },
  currency = "ARS",
) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(
    Number(value),
  );
}
