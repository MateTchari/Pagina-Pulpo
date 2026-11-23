"use client";
import { useState } from "react";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
const client = createAuthClient();
export function LoginForm() {
  const router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        const form = new FormData(e.currentTarget);
        try {
          const result = await client.signIn.email({
            email: String(form.get("email")),
            password: String(form.get("password")),
          });
          if (result.error)
            setError(
              result.error.status === 429
                ? "Demasiados intentos. Esperá un minuto."
                : "Email o contraseña incorrectos.",
            );
          else {
            router.push("/admin");
            router.refresh();
          }
        } catch {
          setError("No se pudo conectar. Reintentá.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button wide" disabled={busy}>
        {busy ? "Ingresando…" : "Ingresar al panel ↗"}
      </button>
    </form>
  );
}
export function Logout() {
  return (
    <button
      className="logout"
      onClick={async () => {
        await client.signOut();
        window.location.href = "/admin/login";
      }}
    >
      Cerrar sesión ↗
    </button>
  );
}
