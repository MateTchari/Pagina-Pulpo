"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="section narrow">
      <h1>No se pudo cargar la página.</h1>
      <p>Verificá que la base de datos esté activa e intentá otra vez.</p>
      <button className="button" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
