import { test } from "node:test";
import assert from "node:assert/strict";
import {
  demoBusinessSchema,
  initialDemoBusiness,
  reduceDemoBusiness,
  demoStatistics,
  demoPublicProducts,
  demoOrderPreview,
} from "../src/lib/demo-business";
const time = "2026-11-23T15:00:00.000Z";
const seed = () => initialDemoBusiness(new Date(time));
test("panel de muestra tiene datos coherentes y excluye pendientes de estadísticas", () => {
  const state = seed();
  assert.equal(demoBusinessSchema.safeParse(state).success, true);
  assert.equal(state.orders.length, 6);
  assert.equal(state.orders.filter((o) => o.status === "PENDING").length, 2);
  assert.equal(demoStatistics(state).orders, 4);
  assert.ok(demoStatistics(state).revenue > 0);
  assert.equal(demoStatistics(state, "2030-01-01").orders, 0);
});
test("alta con stock auditado: 10 → pedido de 2 → 8 → cancelación única → 10", () => {
  let state = seed();
  const initial = demoStatistics(state);
  const template = state.products[0];
  state = reduceDemoBusiness(
    state,
    {
      type: "save-product",
      product: {
        ...template,
        id: "custom",
        name: "Prueba nueva",
        slug: "prueba-nueva",
        variants: [
          {
            ...template.variants[0],
            id: "custom-m",
            sku: "CUSTOM-M",
            stock: 999,
            price: 100,
            cost: 60,
          },
        ],
      },
    },
    time,
  );
  assert.equal(state.products[0].variants[0].stock, 0);
  state = reduceDemoBusiness(
    state,
    {
      type: "adjust-stock",
      variantId: "custom-m",
      quantity: 10,
      reason: "Ingreso de prueba",
    },
    time,
  );
  state = reduceDemoBusiness(
    state,
    {
      type: "create-order",
      id: "order-test",
      items: [{ variantId: "custom-m", quantity: 2 }],
    },
    time,
  );
  assert.equal(state.products[0].variants[0].stock, 10);
  state = reduceDemoBusiness(
    state,
    { type: "change-status", id: "order-test", status: "CONFIRMED" },
    time,
  );
  assert.equal(state.products[0].variants[0].stock, 8);
  const repeated = reduceDemoBusiness(
    state,
    { type: "change-status", id: "order-test", status: "CONFIRMED" },
    time,
  );
  assert.strictEqual(repeated, state);
  assert.equal(demoStatistics(state).revenue, initial.revenue + 200);
  assert.equal(demoStatistics(state).cost, initial.cost + 120);
  state = reduceDemoBusiness(
    state,
    { type: "change-status", id: "order-test", status: "CANCELLED" },
    time,
  );
  assert.equal(state.products[0].variants[0].stock, 10);
  state = reduceDemoBusiness(
    state,
    { type: "change-status", id: "order-test", status: "CANCELLED" },
    time,
  );
  assert.equal(
    state.movements.filter((m) => m.orderId === "order-test").length,
    2,
  );
  assert.equal(demoStatistics(state).revenue, initial.revenue);
  assert.throws(() =>
    reduceDemoBusiness(
      state,
      { type: "change-status", id: "order-test", status: "CONFIRMED" },
      time,
    ),
  );
});
test("precios históricos y stock se conservan al editar un producto", () => {
  let state = seed();
  const original = structuredClone(state.products[0]),
    v = original.variants[0];
  state = reduceDemoBusiness(
    state,
    {
      type: "create-order",
      id: "historic",
      items: [{ variantId: v.id, quantity: 1 }],
    },
    time,
  );
  state = reduceDemoBusiness(
    state,
    {
      type: "save-product",
      product: {
        ...original,
        variants: original.variants.map((x) => ({
          ...x,
          price: 35000,
          cost: 15000,
          stock: 500,
        })),
      },
    },
    time,
  );
  assert.equal(state.products[0].variants[0].stock, v.stock);
  const order = state.orders.find((o) => o.id === "historic")!;
  assert.equal(order.items[0].unitPrice, v.price);
  assert.equal(order.items[0].unitCost, v.cost);
  assert.ok(state.priceHistory.length > 0);
  const publicProduct = demoPublicProducts(state).find(
    (p) => p.id === original.id,
  )!;
  assert.equal(publicProduct.variants[0].price, 35000);
  state = reduceDemoBusiness(
    state,
    { type: "save-product", product: { ...state.products[0], active: false } },
    time,
  );
  assert.equal(
    demoPublicProducts(state).some((p) => p.id === original.id),
    false,
  );
});
test("stock insuficiente revierte todas las líneas y nunca permite cantidades negativas", () => {
  let state = seed();
  const [a, b] = state.products[0].variants;
  state = reduceDemoBusiness(
    state,
    {
      type: "create-order",
      id: "atomic",
      items: [
        { variantId: a.id, quantity: 1 },
        { variantId: b.id, quantity: 1 },
      ],
    },
    time,
  );
  state = reduceDemoBusiness(
    state,
    {
      type: "adjust-stock",
      variantId: b.id,
      quantity: -b.stock,
      reason: "Merma de prueba",
    },
    time,
  );
  const snapshot = JSON.stringify(state);
  assert.throws(() =>
    reduceDemoBusiness(
      state,
      { type: "change-status", id: "atomic", status: "CONFIRMED" },
      time,
    ),
  );
  assert.equal(JSON.stringify(state), snapshot);
  assert.throws(() =>
    reduceDemoBusiness(
      state,
      {
        type: "adjust-stock",
        variantId: b.id,
        quantity: -1,
        reason: "Baja inválida",
      },
      time,
    ),
  );
  assert.throws(() =>
    demoOrderPreview(state, [
      { variantId: a.id, quantity: a.stock },
      { variantId: a.id, quantity: 1 },
    ]),
  );
});
test("validación de catálogo, idempotencia de pedidos y separación de ajustes históricos", () => {
  let state = seed(),
    p = state.products[0];
  assert.throws(() =>
    reduceDemoBusiness(
      state,
      { type: "save-product", product: { ...p, id: "duplicate" } },
      time,
    ),
  );
  const action = {
    type: "create-order" as const,
    id: "same-id",
    items: [{ variantId: p.variants[0].id, quantity: 1 }],
  };
  state = reduceDemoBusiness(state, action, time);
  assert.strictEqual(reduceDemoBusiness(state, action, time), state);
  assert.throws(() =>
    reduceDemoBusiness(
      state,
      { type: "settings", settings: { ...state.settings, currency: "USD" } },
      time,
    ),
  );
  state = reduceDemoBusiness(
    state,
    {
      type: "settings",
      settings: { ...state.settings, name: "SANTOS Prueba" },
    },
    time,
  );
  assert.equal(state.settings.name, "SANTOS Prueba");
});
