import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminTitle } from "@/components/admin-shared";
import { ProductForm } from "@/components/admin-forms";
import { requireAdminPage } from "@/lib/security";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const p = await db.product.findUnique({
    where: { id: (await params).id },
    include: { variants: true, images: { orderBy: { position: "asc" } } },
  });
  if (!p) notFound();
  return (
    <>
      <AdminTitle eyebrow="CATÁLOGO / EDITAR" title={p.name} />
      <ProductForm
        initial={{
          ...p,
          variants: p.variants.map((v) => ({
            ...v,
            cost: Number(v.cost),
            price: Number(v.price),
          })),
        }}
      />
    </>
  );
}
