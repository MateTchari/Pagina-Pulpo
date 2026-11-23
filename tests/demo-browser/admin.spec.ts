import { test, expect } from "@playwright/test";
test("panel demo integrado: producto, fotografía, stock, pedido, venta y cancelación", async ({
  page,
}) => {
  let posts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST") posts++;
  });
  await page.goto("/admin/login");
  await page.getByRole("link", { name: "Entrar al panel de prueba" }).click();
  await expect(page).toHaveURL("/admin/demo");
  await expect(
    page.getByRole("heading", { name: "Tu estudio, en un vistazo." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/demo-admin-dashboard.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Productos", exact: true }).click();
  await page
    .getByRole("link", { name: "Nuevo producto", exact: false })
    .click();
  await page
    .getByLabel("Nombre", { exact: true })
    .fill("Remera de prueba nueva");
  await page.getByLabel("Identificador de URL").fill("remera-prueba-nueva");
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Creada en el panel de demostración.");
  await page.getByLabel("color variante 1", { exact: true }).fill("Negro");
  await page.getByLabel("size variante 1", { exact: true }).fill("M");
  await page.getByLabel("sku variante 1", { exact: true }).fill("DEMO-NUEVA-M");
  await page.getByLabel("price variante 1", { exact: true }).fill("10000");
  await page.getByLabel("cost variante 1", { exact: true }).fill("4000");
  await page
    .getByLabel("Elegir imagen de prueba")
    .setInputFiles("public/brand/santos-logo-black.png");
  await page
    .getByRole("button", { name: "Guardar producto de prueba" })
    .click();
  await expect(page).toHaveURL("/admin/demo/productos");
  const product = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("santos-demo-business-v1")!).products.find(
      (p: { slug: string }) => p.slug === "remera-prueba-nueva",
    ),
  );
  expect(product.variants[0].stock).toBe(0);
  expect(product.image.startsWith("data:image/png;base64,")).toBe(true);
  await page.getByRole("link", { name: "Inventario", exact: true }).click();
  await page
    .getByLabel("Variante", { exact: true })
    .selectOption(product.variants[0].id);
  await page.getByLabel("Unidades (+ ingreso / − baja)").fill("10");
  await page
    .getByLabel("Motivo", { exact: true })
    .fill("Ingreso inicial de prueba");
  await page
    .getByRole("button", { name: "Registrar movimiento", exact: true })
    .click();
  await expect(
    page.getByText("Movimiento de prueba registrado.", { exact: false }),
  ).toBeVisible();
  await page.goto("/producto/remera-prueba-nueva");
  await expect(
    page.getByRole("heading", { name: "Remera de prueba nueva", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await expect(page.getByText("10 unidades de ejemplo")).toBeVisible();
  await page.getByLabel("Cantidad", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Carrito (2)" }).click();
  await page.getByRole("link", { name: "Continuar con el pedido" }).click();
  await page.getByLabel("Entiendo que estoy probando").check();
  await page.getByRole("button", { name: "Finalizar prueba" }).click();
  await page
    .getByRole("link", { name: "Ver pedido en el panel de prueba" })
    .click();
  await expect(page).toHaveURL(/\/admin\/demo\/ventas\/PRUEBA-/);
  const orderUrl = page.url();
  await page
    .getByRole("button", { name: "Confirmar y descontar stock" })
    .click();
  await expect(page.getByText("Inventario descontado: Sí")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("santos-demo-business-v1")!,
        ).products.find(
          (p: { slug: string }) => p.slug === "remera-prueba-nueva",
        ).variants[0].stock,
    ),
  ).toBe(8);
  await page.goto(`/admin/demo/productos/${product.id}`);
  await page.getByLabel("price variante 1", { exact: true }).fill("15000");
  await page
    .getByRole("button", { name: "Guardar producto de prueba" })
    .click();
  await expect(page).toHaveURL("/admin/demo/productos");
  await page.goto(orderUrl);
  await expect(
    page.getByRole("cell", { name: "$ 10.000,00", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/demo/estadisticas");
  await expect(
    page.getByRole("row").filter({ hasText: "Remera de prueba nueva" }),
  ).toContainText("20.000");
  await page.goto(orderUrl);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Cancelar pedido", exact: true })
    .click();
  await expect(page.getByText("Inventario descontado: No")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Inventario descontado: No")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("santos-demo-business-v1")!,
        ).products.find(
          (p: { slug: string }) => p.slug === "remera-prueba-nueva",
        ).variants[0].stock,
    ),
  ).toBe(10);
  await page.goto("/admin/demo/configuracion");
  await page.getByLabel("Nombre comercial").fill("SANTOS Prueba");
  await page
    .getByRole("button", { name: "Guardar configuración de prueba" })
    .click();
  await expect(
    page.getByText("Configuración de prueba guardada.", { exact: false }),
  ).toBeVisible();
  await page.goto("/admin/demo");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Restablecer demo" }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("santos-demo-business-v1")!,
      ).products.some(
        (p: { slug: string }) => p.slug === "remera-prueba-nueva",
      ),
    ),
  ).toBe(false);
  expect(posts).toBe(0);
});
test("todas las secciones administrativas se pueden recorrer desde el celular", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "",
    "productos",
    "inventario",
    "ventas",
    "estadisticas",
    "costos",
    "configuracion",
  ]) {
    await page.goto("/admin/demo" + (path ? `/${path}` : ""));
    await expect(
      page.getByText("Demostración interactiva", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/admin/demo");
  await page.screenshot({
    path: "test-results/demo-admin-mobile.png",
    fullPage: true,
  });
});
