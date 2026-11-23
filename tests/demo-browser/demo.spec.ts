import { test, expect } from "@playwright/test";
test("navegación y checkout de prueba sin base ni envío de datos", async ({
  page,
}) => {
  let submitted = false;
  page.on("request", (r) => {
    if (r.method() === "POST") submitted = true;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByText("Vista de demostración", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SANTOS Original", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/demo-home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: /SANTOS Original/ }).click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByLabel("Cantidad", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Carrito (2)" }).click();
  await expect(page).toHaveURL("/carrito");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "SANTOS Original" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continuar con el pedido" }).click();
  await page.getByLabel("Entiendo que estoy probando").check();
  await page.getByRole("button", { name: "Finalizar prueba" }).click();
  await expect(
    page.getByRole("heading", { name: "Prueba completada." }),
  ).toBeVisible();
  await expect(
    page.getByText("No se creó ningún pedido", { exact: false }),
  ).toBeVisible();
  expect(submitted).toBe(false);
  await page.screenshot({
    path: "test-results/demo-checkout.png",
    fullPage: true,
  });
});
test("filtros, acceso administrativo y endpoints demo no requieren base", async ({
  page,
  request,
}) => {
  await page.goto("/tienda");
  await page.getByLabel("Buscar", { exact: true }).fill("Oversize");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(
    page.getByText("1 diseños encontrados", { exact: false }),
  ).toBeVisible();
  await page.goto("/admin/productos");
  await expect(page).toHaveURL("/admin/login");
  await expect(
    page.getByText("Versión de demostración", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("input[type=password]")).toHaveCount(0);
  for (const path of [
    "/api/orders",
    "/api/products",
    "/api/inventory",
    "/api/settings",
    "/api/upload",
    "/api/auth/sign-in/email",
  ]) {
    const response = await request.post(path, { data: {} });
    expect(response.status()).toBe(503);
  }
  expect((await request.get("/api/auth/get-session")).status()).toBe(503);
  await page.goto("/pedido/" + "a".repeat(64));
  await expect(
    page.getByRole("heading", { name: "No encontramos esta página." }),
  ).toBeVisible();
});
