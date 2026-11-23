import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env")) {
  console.log(".env ya existe; se conserva.");
  process.exit(0);
}
const password = randomBytes(24).toString("hex");
writeFileSync(
  ".env",
  `DATABASE_URL=postgresql://tienda:${password}@127.0.0.1:54329/tienda\nTEST_DATABASE_URL=postgresql://tienda:${password}@127.0.0.1:54329/tienda_test\nBETTER_AUTH_SECRET=${randomBytes(48).toString("hex")}\nBETTER_AUTH_URL=http://localhost:3000\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n`,
  { mode: 0o600 },
);
console.log(
  ".env creado con secretos aleatorios. Ejecutá npm run db:local en otra terminal.",
);
