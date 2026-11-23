import { notFound } from "next/navigation";
import { isDemoMode } from "@/lib/mode";
import { DemoAdmin } from "@/components/demo-admin";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Panel de prueba",
  robots: { index: false, follow: false },
};
export default async function DemoAdminPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  if (!isDemoMode()) notFound();
  return <DemoAdmin section={(await params).section} />;
}
