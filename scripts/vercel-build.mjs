import "dotenv/config";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { isDemoMode } from "../config/app-mode.mjs";
const run = (file, ...args) =>
  execFileSync(process.execPath, [path.resolve(file), ...args], {
    stdio: "inherit",
    env: process.env,
  });
if (isDemoMode()) {
  console.log(
    "SANTOS DEMO: sin conexión PostgreSQL, sin migraciones y sin credenciales.",
  );
} else {
  run("scripts/check-deploy-env.mjs");
}
run("node_modules/prisma/build/index.js", "generate");
if (!isDemoMode())
  run("node_modules/prisma/build/index.js", "migrate", "deploy");
run("node_modules/next/dist/bin/next", "build");
