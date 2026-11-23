import { headers } from "next/headers";
import { getAuth } from "./auth";
import { db } from "./db";
import { redirect } from "next/navigation";
import { isDemoMode } from "./mode";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function requireAdmin() {
  if (isDemoMode())
    throw new AppError("La administración requiere el modo conectado.", 503);
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) throw new AppError("Iniciá sesión para continuar.", 401);
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "admin") throw new AppError("Acceso denegado.", 403);
  return user;
}
export async function requireAdminPage() {
  if (isDemoMode()) redirect("/admin/demo");
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AppError) redirect("/admin/login");
    throw error;
  }
}
export function sameOrigin(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.BETTER_AUTH_URL!).origin
  )
    throw new AppError("Origen no permitido.", 403);
}
export async function publicRateLimit(key: string, max = 10) {
  const now = Date.now();
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${crypto.randomUUID()}, ${key}, 1, ${BigInt(now)})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."lastRequest" < ${BigInt(now - 60000)} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "lastRequest" = CASE WHEN "RateLimit"."lastRequest" < ${BigInt(now - 60000)} THEN ${BigInt(now)} ELSE "RateLimit"."lastRequest" END
    RETURNING "count"`;
  if (rows[0].count > max)
    throw new AppError("Demasiados intentos. Esperá un minuto.", 429);
}
