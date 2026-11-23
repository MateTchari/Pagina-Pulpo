import "dotenv/config";
import { createDb } from "../src/lib/db";
const db = createDb();
async function main() {
  if (!process.argv.includes("--demo"))
    throw new Error("Seed opcional: npm run seed:demo -- --demo");
  await db.product.upsert({
    where: { slug: "remera-demostracion" },
    update: {},
    create: {
      name: "Remera de demostración",
      slug: "remera-demostracion",
      description:
        "Producto de ejemplo. Eliminá o desactivá este producto antes de abrir la tienda.",
      active: true,
      featured: true,
      variants: {
        create: {
          color: "Negro",
          size: "M",
          sku: "DEMO-NEGRO-M",
          price: 15000,
          cost: 6000,
          stock: 10,
          movements: { create: { quantity: 10, reason: "SEED_DEMOSTRACION" } },
        },
      },
    },
  });
  console.log(
    "Producto DEMO creado; no se habilitaron pedidos ni se crearon ventas ficticias.",
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
