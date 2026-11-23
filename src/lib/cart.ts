export type CartLine = {
  variantId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image?: string;
};
export function addLine(lines: CartLine[], line: CartLine) {
  const previous = lines.find((l) => l.variantId === line.variantId);
  if (!Number.isInteger(line.quantity) || line.quantity < 1)
    throw new Error("Cantidad inválida");
  return previous
    ? lines.map((l) =>
        l.variantId === line.variantId
          ? { ...l, quantity: Math.min(100, l.quantity + line.quantity) }
          : l,
      )
    : [...lines, { ...line, quantity: Math.min(100, line.quantity) }];
}
