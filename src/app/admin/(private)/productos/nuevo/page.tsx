import { AdminTitle } from "@/components/admin-shared";
import { ProductForm } from "@/components/admin-forms";
import { requireAdminPage } from "@/lib/security";
export default async function NewProduct() {
  await requireAdminPage();
  return (
    <>
      <AdminTitle eyebrow="CATÁLOGO / NUEVO" title="Una nueva idea." />
      <ProductForm />
    </>
  );
}
