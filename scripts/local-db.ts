import "dotenv/config";
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";
async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  if (!["127.0.0.1", "localhost"].includes(url.hostname))
    throw new Error("Este script es solo para PostgreSQL local.");
  const directory = path.resolve(".local/postgres");
  const pg = new EmbeddedPostgres({
    databaseDir: directory,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    port: Number(url.port),
    persistent: true,
    authMethod: "scram-sha-256",
    postgresFlags: ["-c", "listen_addresses=127.0.0.1"],
    onLog: () => {},
    onError: () => {},
  });
  if (!existsSync(path.join(directory, "PG_VERSION"))) await pg.initialise();
  await pg.start();
  const client = pg.getPgClient();
  await client.connect();
  for (const name of ["tienda", "tienda_test"]) {
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname=$1",
      [name],
    );
    if (!result.rowCount) await pg.createDatabase(name);
  }
  await client.end();
  console.log(
    `PostgreSQL local activo en 127.0.0.1:${url.port}. Datos persistentes en .local/postgres. Ctrl+C para detener.`,
  );
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 60000);
}
main().catch((e) => {
  console.error("No se pudo iniciar PostgreSQL:", e.message);
  process.exit(1);
});
