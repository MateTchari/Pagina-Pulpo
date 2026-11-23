import { CartView } from "@/components/cart-view";
import { settings } from "@/lib/services";
import { isDemoMode } from "@/lib/mode";
export default async function Checkout() {
  const s = await settings();
  return (
    <section className="section">
      <span className="eyebrow">COORDINACIÓN CON EL ESTUDIO</span>
      <h1 className="page-title">
        {isDemoMode() ? "Probá la experiencia." : "Hacé tu pedido."}
      </h1>
      <CartView
        currency={s.currency}
        checkout
        enabled={s.ordersEnabled}
        demo={isDemoMode()}
      />
    </section>
  );
}
