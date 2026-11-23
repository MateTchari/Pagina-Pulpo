import Link from "next/link";
export default function NotFound() {
  return (
    <main className="section narrow">
      <h1 className="page-title">No encontramos esta página.</h1>
      <Link href="/" className="button">
        Volver al inicio
      </Link>
    </main>
  );
}
