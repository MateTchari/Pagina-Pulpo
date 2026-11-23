import { settings } from "@/lib/services";
import { AdminTitle } from "@/components/admin-shared";
import { SettingsForm } from "@/components/admin-forms";
import { requireAdminPage } from "@/lib/security";
export default async function Config() {
  await requireAdminPage();
  return (
    <>
      <AdminTitle eyebrow="A TU MANERA" title="La identidad de tu negocio." />
      <SettingsForm initial={await settings()} />
    </>
  );
}
