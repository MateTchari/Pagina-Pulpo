import Link from "next/link";
import { Brand } from "@/components/brand";
import { requireAdminPage } from "@/lib/security";
import { db } from "@/lib/db";
import { settings } from "@/lib/services";
import { money } from "@/lib/money";
import { AdminTitle } from "@/components/admin-shared";
import { Badge, Empty } from "@/components/ui";
import { ArchiveButton } from "@/components/admin-forms";
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();
  const q = (await searchParams).q,
    s = await settings();
  const products = await db.product.findMany({
    where: q
      ? { name: { contains: q.slice(0, 150), mode: "insensitive" } }
      : {},
    include: {
      variants: true,
      images: { take: 1, orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <AdminTitle eyebrow="TU CATÁLOGO" title="Diseños con identidad.">
        <Link className="button" href="/admin/productos/nuevo">
          ＋ Nuevo producto
        </Link>
      </AdminTitle>
      <form className="filters">
        <label>
          Buscar producto
          <input name="q" defaultValue={q} placeholder="Nombre del diseño" />
        </label>
        <button className="button secondary">Buscar</button>
      </form>
      <section className="panel">
        {products.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Estado</th>
                  <th>Variantes</th>
                  <th>Stock total</th>
                  <th>Desde</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        {p.images[0] ? (
                          <img src={p.images[0].url} alt="" />
                        ) : (
                          <span className="table-placeholder">
                            <Brand mark />
                          </span>
                        )}
                        <div>
                          <strong>{p.name}</strong>
                          <small>/{p.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge>
                        {p.active ? "Publicado" : "Borrador / inactivo"}
                      </Badge>
                    </td>
                    <td>{p.variants.filter((v) => v.active).length}</td>
                    <td>{p.variants.reduce((sum, v) => sum + v.stock, 0)}</td>
                    <td>
                      {money(
                        Math.min(...p.variants.map((v) => Number(v.price))),
                        s.currency,
                      )}
                    </td>
                    <td>
                      <div className="inline">
                        <Link href={`/admin/productos/${p.id}`}>Editar ↗</Link>
                        {p.active && <ArchiveButton id={p.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Dale lugar a tu primer diseño">
            <Link href="/admin/productos/nuevo">Crear producto ↗</Link>
          </Empty>
        )}
        <p className="fine-print">
          Hasta 200 productos; usá el buscador para acotar. Los productos se
          despublican para conservar la trazabilidad de ventas.
        </p>
      </section>
    </>
  );
}
