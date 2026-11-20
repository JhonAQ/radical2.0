import { redirect } from "next/navigation";
import { ExportPanel } from "../../components/ExportPanel";
import { PageHeader } from "../../components/PageHeader";

export const metadata = { title: "Reportes | Radical 2.0" };

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Enlaces antiguos a /admin/reportes?type=… abrían directamente el documento imprimible.
  const params = await searchParams;
  if (params.type) {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    redirect(`/admin/imprimir?${qs.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 lg:space-y-6">
      <PageHeader
        title="Reportes"
        description="Documentos para imprimir o guardar en PDF y datos para Excel. Los filtros aplican a todos."
        mobileDescription="Listas para imprimir o guardar en PDF y datos para Excel."
      />
      <ExportPanel />
    </div>
  );
}
