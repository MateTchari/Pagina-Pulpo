import { test } from "node:test";
import assert from "node:assert/strict";
process.env.APP_MODE = "demo";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unavailable";
process.env.BETTER_AUTH_SECRET = "";
process.env.BETTER_AUTH_URL = "";
const { storeProducts, storeOptions, storeProduct } = await import(
  "../src/lib/store-data"
);
const { settings } = await import("../src/lib/services");
const { summarizeDemoCart } = await import("../src/lib/demo-products");
test("catálogo, detalle y configuración demo funcionan con la base inaccesible", async () => {
  assert.equal((await storeProducts()).length, 3);
  assert.equal((await settings()).name, "SANTOS");
  assert.equal((await settings()).ordersEnabled, false);
  assert.equal(
    (await storeProduct("santos-original"))?.name,
    "SANTOS Original",
  );
  assert.equal(await storeProduct("inexistente"), null);
  assert.ok((await storeOptions()).length > 0);
});
test("filtros demo combinan nombre, color, talle y precio sobre la misma variante", async () => {
  assert.equal((await storeProducts({ q: "oversize" })).length, 1);
  assert.equal(
    (await storeProducts({ size: "XL", color: "Blanco", max: "25000" })).length,
    1,
  );
  assert.equal((await storeProducts({ min: "30000" })).length, 0);
  assert.equal((await storeProducts({ color: "Rojo" })).length, 0);
});
test("finalización de prueba calcula con el catálogo y rechaza variantes ajenas", () => {
  assert.deepEqual(
    summarizeDemoCart([{ variantId: "demo-original-0-1", quantity: 2 }]),
    { total: 49800, units: 2 },
  );
  assert.throws(() => summarizeDemoCart([]));
  assert.throws(() => summarizeDemoCart([{ variantId: "real", quantity: 1 }]));
  assert.throws(() =>
    summarizeDemoCart([{ variantId: "demo-original-0-1", quantity: 11 }]),
  );
});
