"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ArrowUpRight } from "lucide-react";
import { useCart } from "./cart-provider";
import { money } from "@/lib/money";
import { checkoutSchema } from "@/lib/validation";
import { Empty } from "./ui";
import { Brand } from "./brand";
export function CartView({
  currency,
  checkout = false,
  enabled = false,
}: {
  currency: string;
  checkout?: boolean;
  enabled?: boolean;
}) {
  const { lines, quantity, clear, ready } = useCart(),
    router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  if (!ready) return <p role="status">Cargando tu carrito…</p>;
  if (!lines.length)
    return (
      <Empty title="Tu carrito está esperando una idea">
        <Link href="/tienda" className="text-link">
          Explorar la colección ↗
        </Link>
      </Empty>
    );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const content = {
        customerName: form.get("name"),
        customerEmail: form.get("email"),
        note: form.get("note"),
        items: lines.map((l) => ({
          variantId: l.variantId,
          quantity: l.quantity,
        })),
      };
      const fingerprint = JSON.stringify(content);
      let pending: { key: string; fingerprint: string } | undefined;
      try {
        pending =
          JSON.parse(sessionStorage.getItem("pending-order") || "null") ??
          undefined;
      } catch {}
      if (!pending || pending.fingerprint !== fingerprint) {
        pending = { key: crypto.randomUUID(), fingerprint };
        sessionStorage.setItem("pending-order", JSON.stringify(pending));
      }
      const body = checkoutSchema.parse({
        ...content,
        idempotencyKey: pending.key,
      });
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      sessionStorage.removeItem("pending-order");
      clear();
      router.push(`/pedido/${result.token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el pedido.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="cart-grid">
      <div>
        {lines.map((line) => (
          <div className="cart-line" key={line.variantId}>
            {line.image ? (
              <img src={line.image} alt={line.name} />
            ) : (
              <div className="cart-placeholder">
                <Brand mark />
              </div>
            )}
            <div>
              <h3>{line.name}</h3>
              <p>
                {line.color} / {line.size}
              </p>
              <span>{money(line.price, currency)}</span>
            </div>
            <label className="sr-only" htmlFor={line.variantId}>
              Cantidad de {line.name}
            </label>
            <input
              id={line.variantId}
              type="number"
              className="quantity"
              min="1"
              max="100"
              value={line.quantity}
              onChange={(e) => quantity(line.variantId, Number(e.target.value))}
            />
            <strong>{money(line.price * line.quantity, currency)}</strong>
            <button
              className="icon-button"
              aria-label={`Eliminar ${line.name}`}
              onClick={() => quantity(line.variantId, 0)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <Link href="/tienda" className="back">
          ← Seguir explorando
        </Link>
        {checkout && (
          <form
            id="checkout-form"
            onSubmit={submit}
            className="panel form-stack"
          >
            <h2>Coordinemos tu pedido.</h2>
            <label>
              Nombre y apellido
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
              />
            </label>
            <label>
              Email de contacto
              <input
                name="email"
                type="email"
                required
                maxLength={200}
                autoComplete="email"
              />
            </label>
            <label>
              Notas o idea de personalización{" "}
              <span className="muted">(opcional)</span>
              <textarea name="note" maxLength={2000} rows={3} />
            </label>
            <p className="notice">
              El pedido queda pendiente. El estudio coordinará con vos la
              confirmación, el pago y la entrega. No estás realizando un pago en
              esta página.
            </p>
            <label className="check">
              <input type="checkbox" required />
              Entiendo que el pedido requiere confirmación y no reserva stock.
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
      <aside className="order-summary">
        <span className="eyebrow">TU SELECCIÓN</span>
        <h2>Resumen del pedido</h2>
        <div className="summary-row">
          <span>Productos</span>
          <span>{lines.reduce((sum, l) => sum + l.quantity, 0)}</span>
        </div>
        <div className="summary-row">
          <span>Subtotal estimado</span>
          <strong>{money(total, currency)}</strong>
        </div>
        <p className="fine-print">
          Precio definitivo de productos calculado por el servidor al crear el
          pedido. Pago y entrega a coordinar; envío no incluido.
        </p>
        {checkout ? (
          <button
            form="checkout-form"
            disabled={busy || !enabled}
            className="button wide"
          >
            {busy ? "Registrando…" : "Crear pedido pendiente"}
            <ArrowUpRight size={18} />
          </button>
        ) : (
          <Link href="/checkout" className="button wide">
            Continuar con el pedido
            <ArrowUpRight size={18} />
          </Link>
        )}
        {checkout && !enabled && (
          <p className="error">La tienda aún no habilitó los pedidos.</p>
        )}
      </aside>
    </div>
  );
}
