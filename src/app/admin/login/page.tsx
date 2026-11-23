import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { Brand } from "@/components/brand";
import { isDemoMode } from "@/lib/mode";
export default function Login() {
  return (
    <main className="login-page">
      <div className="login-art">
        <Brand className="login-wordmark" />
        <span className="eyebrow">EL DETRÁS DE ESCENA</span>
        <h1>
          Tus ideas.
          <br />
          Tu negocio.
          <br />
          <em>Todo conectado.</em>
        </h1>
        <Brand mark className="login-emblem" />
      </div>
      <div className="login-panel">
        <Brand className="login-mobile-brand" />
        <Link href="/" className="back">
          ← Volver a la tienda
        </Link>
        <span className="eyebrow">ACCESO PRIVADO</span>
        <h2>Hola de nuevo.</h2>
        <p className="muted">Ingresá para gestionar tu estudio.</p>
        {isDemoMode() ? (
          <div className="notice">
            <strong>Versión de demostración</strong>
            <p>
              La tienda se puede recorrer sin iniciar sesión. La administración
              estará disponible cuando conectemos la base de datos.
            </p>
            <Link href="/tienda" className="button">
              Probar la tienda ↗
            </Link>
          </div>
        ) : (
          <LoginForm />
        )}
        {!isDemoMode() && (
          <p className="fine-print">
            Solo administradores autorizados. El alta de usuarios se realiza
            desde la terminal del proyecto.
          </p>
        )}
      </div>
    </main>
  );
}
