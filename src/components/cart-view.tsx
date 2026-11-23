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
import { demoOrderPreview } from "@/lib/demo-business";
import { useDemoBusiness } from "./demo-business-provider";
export function CartView({
  currency: initialCurrency,
  checkout = false,
  enabled = false,
  demo = false,
}: {
  currency: string;
  checkout?: boolean;
  enabled?: boolean;
  demo?: boolean;
}) {
  const { lines: storedLines, quantity, clear, ready } = useCart(),
    router = useRouter();
  const business = useDemoBusiness();
  const currency = business?.state
    ? business.state.settings.currency
    : initialCurrency;
  const lines = business?.state
    ? storedLines.map((line) => {
        for (const p of business.state!.products) {
          const v = p.variants.find((v) => v.id === line.variantId);
          if (v)
            return {
              ...line,
              name: p.name,
              color: v.color,
              size: v.size,
              price: v.price,
              image: p.image,
            };
        }
        return line;
      })
    : storedLines;
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [demoDone, setDemoDone] = useState<{
    total: number;
    units: number;
    orderId: string;
  } | null>(null);
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  if (!ready) return <p role="status">Cargando tu carrito…</p>;
  if (demoDone)
    return (
      <section className="panel demo-complete" role="status">
        <span className="eyebrow">DEMOSTRACIÓN SANTOS</span>
        <h2>Prueba completada.</h2>
        <p>
          Recorriste la experiencia con {demoDone.units} unidades de ejemplo y
          un total de muestra de {money(demoDone.total, currency)}.
        </p>
        <p className="notice">
          No se creó ningún pedido real, no se realizó un pago y no se enviaron
          tus datos. El pedido simulado quedó en el panel de prueba de este
          navegador.
        </p>
        <Link className="button" href="/tienda">
          Volver a probar la colección ↗
        </Link>
        <Link
          className="button secondary"
          href={`/admin/demo/ventas/${demoDone.orderId}`}
        >
          Ver pedido en el panel de prueba ↗
        </Link>
      </section>
    );
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
      if (demo) {
        if (!business?.state)
          throw new Error("Esperá a que termine de cargar la prueba.");
        const preview = demoOrderPreview(business.state, lines),
          orderId = `PRUEBA-${crypto.randomUUID()}`;
        business.act({
          type: "create-order",
          id: orderId,
          items: lines.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
          })),
        });
        setDemoDone({ total: preview.total, units: preview.units, orderId });
        clear();
        return;
      }
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
            <h2>{demo ? "Probá el último paso." : "Coordinemos tu pedido."}</h2>
            {demo && (
              <p className="notice">
                Usá datos inventados. No se envía la información ingresada. El
                panel guardará un pedido simulado con el nombre genérico
                “Cliente de prueba”, solo en este navegador.
              </p>
            )}
            <label>
              Nombre y apellido
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                defaultValue={demo ? "Cliente de prueba" : undefined}
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
                defaultValue={demo ? "prueba@example.com" : undefined}
              />
            </label>
            <label>
              Notas o idea de personalización{" "}
              <span className="muted">(opcional)</span>
              <textarea name="note" maxLength={2000} rows={3} />
            </label>
            <p className="notice">
              {demo
                ? "Al finalizar verás una confirmación de prueba. No se registran ventas ni se reserva stock."
                : "El pedido queda pendiente. El estudio coordinará con vos la confirmación, el pago y la entrega. No estás realizando un pago en esta página."}
            </p>
            <label className="check">
              <input type="checkbox" required />
              {demo
                ? "Entiendo que estoy probando una demostración sin compras reales."
                : "Entiendo que el pedido requiere confirmación y no reserva stock."}
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
          {demo
            ? "Importes de ejemplo para revisar la experiencia. No representan precios comerciales definitivos."
            : "Precio definitivo de productos calculado por el servidor al crear el pedido. Pago y entrega a coordinar; envío no incluido."}
        </p>
        {checkout ? (
          <button
            form="checkout-form"
            disabled={busy || (!enabled && !demo)}
            className="button wide"
          >
            {busy
              ? "Procesando…"
              : demo
                ? "Finalizar prueba"
                : "Crear pedido pendiente"}
            <ArrowUpRight size={18} />
          </button>
        ) : (
          <Link href="/checkout" className="button wide">
            Continuar con el pedido
            <ArrowUpRight size={18} />
          </Link>
        )}
        {checkout && !enabled && !demo && (
          <p className="error">La tienda aún no habilitó los pedidos.</p>
        )}
      </aside>
    </div>
  );
}
