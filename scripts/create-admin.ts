import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hashPassword } from "better-auth/crypto";
import { createDb } from "../src/lib/db";
import { z } from "zod";
async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const email = z
    .email()
    .parse(
      (await rl.question("Email del administrador: ")).trim().toLowerCase(),
    );
  const name = (await rl.question("Nombre: ")).trim() || "Administrador";
  rl.close();
  if (!stdin.isTTY)
    throw new Error(
      "Usá una terminal interactiva para ingresar la contraseña.",
    );
  stdout.write("Contraseña (12 a 128 caracteres, oculta): ");
  const password = await new Promise<string>((resolve) => {
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk: Buffer) => {
      for (const c of chunk.toString()) {
        if (c === "\u0003") process.exit(1);
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false);
          stdin.off("data", onData);
          stdin.pause();
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
  z.string().min(12).max(128).parse(password);
  const db = createDb();
  try {
    const id = crypto.randomUUID();
    await db.user.create({
      data: {
        id,
        email,
        name,
        role: "admin",
        emailVerified: true,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            providerId: "credential",
            accountId: id,
            password: await hashPassword(password),
          },
        },
      },
    });
    console.log("Administrador creado. Ingresá en /admin/login.");
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e.code === "P2002" ? "Ya existe ese email." : e.message);
  process.exit(1);
});
