import { test } from "node:test";
import assert from "node:assert/strict";
import { margins } from "../src/lib/money";
import { addLine, type CartLine } from "../src/lib/cart";
import { checkoutSchema, productSchema } from "../src/lib/validation";
import { transitions } from "../src/lib/order-state";
test("margen y recargo son distintos y contemplan división por cero", () => {
  assert.deepEqual(margins(100, 60), {
    profit: 40,
    margin: 40,
    markup: (40 / 60) * 100,
  });
  assert.equal(margins(0, 0).margin, null);
  assert.equal(margins(10, 0).markup, null);
  assert.equal(margins(20, 30).profit, -10);
  assert.throws(() => margins(NaN, 1));
  assert.throws(() => margins(1, -1));
});
test("carrito agrupa variantes y conserva otras combinaciones", () => {
  const line: CartLine = {
    variantId: "a",
    name: "Remera",
    color: "Negro",
    size: "M",
    quantity: 1,
    price: 100,
  };
  const cart = addLine(addLine([], line), { ...line, quantity: 2 });
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 3);
  assert.equal(addLine(cart, { ...line, variantId: "b" }).length, 2);
  assert.equal(addLine(cart, { ...line, quantity: 100 }).length, 1);
  assert.throws(() => addLine(cart, { ...line, quantity: -1 }));
});
test("checkout rechaza cantidades fraccionarias, negativas y datos inválidos; ignora precios del cliente", () => {
  const body = {
    idempotencyKey: crypto.randomUUID(),
    customerName: "Persona",
    customerEmail: "cliente@example.com",
    items: [{ variantId: "a", quantity: 2, price: 0.01 }],
  };
  assert.equal("price" in checkoutSchema.parse(body).items[0], false);
  for (const quantity of [0, -1, 1.5, 101])
    assert.equal(
      checkoutSchema.safeParse({
        ...body,
        items: [{ variantId: "a", quantity }],
      }).success,
      false,
    );
});
test("producto valida variantes, unicidad y precisión monetaria", () => {
  const variant = {
    color: "Negro",
    size: "M",
    sku: "A-M",
    price: 100,
    cost: 60,
    minStock: 3,
  };
  const product = {
    name: "Remera",
    slug: "remera",
    description: "Diseño",
    active: true,
    featured: true,
    variants: [variant],
    images: [],
  };
  assert.equal(productSchema.safeParse(product).success, true);
  assert.equal(
    productSchema.safeParse({ ...product, variants: [variant, variant] })
      .success,
    false,
  );
  assert.equal(
    productSchema.safeParse({
      ...product,
      variants: [{ ...variant, price: 1.001 }],
    }).success,
    false,
  );
  assert.equal(
    productSchema.safeParse({
      ...product,
      images: [{ url: "/../../secret", alt: "" }],
    }).success,
    false,
  );
});
test("estados terminales y transiciones válidas", () => {
  assert.deepEqual(transitions.COMPLETED, []);
  assert.deepEqual(transitions.CANCELLED, []);
  assert.equal(transitions.PENDING.includes("COMPLETED"), false);
  assert.equal(transitions.PENDING.includes("CONFIRMED"), true);
});
