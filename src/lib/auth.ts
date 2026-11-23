import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { isDemoMode } from "./mode";
function createAuth() {
  return betterAuth({
    database: prismaAdapter(db, { provider: "postgresql" }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
    },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30 },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: { "/sign-in/email": { window: 60, max: 5 } },
    },
    advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  if (isDemoMode())
    throw new Error("La autenticación no está disponible en modo demo.");
  return (instance ??= createAuth());
}
