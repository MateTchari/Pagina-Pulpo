import { CartView } from "@/components/cart-view";
import { settings } from "@/lib/services";
export default async function CartPage() {
  const s = await settings();
  return (
    <section className="section">
      <span className="eyebrow">UN PASO MÁS CERCA</span>
      <h1 className="page-title">Tu carrito.</h1>
      <CartView currency={s.currency} />
    </section>
  );
}
