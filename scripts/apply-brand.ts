import "dotenv/config";
import { createDb } from "../src/lib/db";
const db = createDb();
try {
  await db.settings.upsert({
    where: { id: "business" },
    create: {
      id: "business",
      name: "SANTOS",
      logoUrl: "/brand/santos-logo-black.png",
    },
    update: { name: "SANTOS", logoUrl: "/brand/santos-logo-black.png" },
  });
  console.log(
    "Identidad SANTOS aplicada. Se conservaron moneda, inventario, pedidos y configuración comercial.",
  );
} finally {
  await db.$disconnect();
}
