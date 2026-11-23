import { CartView } from "@/components/cart-view";
import { settings } from "@/lib/services";
export default async function Checkout() {
  const s = await settings();
  return (
    <section className="section">
      <span className="eyebrow">COORDINACIÓN CON EL ESTUDIO</span>
      <h1 className="page-title">Hacé tu pedido.</h1>
      <CartView currency={s.currency} checkout enabled={s.ordersEnabled} />
    </section>
  );
}
