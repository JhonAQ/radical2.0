import { redirect } from "next/navigation";
import { ExportPanel } from "../../components/ExportPanel";

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a3039] sm:text-3xl">Reportes</h1>
        <p className="mt-1 text-sm text-[#5f7a75]">
          Documentos para imprimir o guardar en PDF y datos para Excel. Los filtros aplican a todos.
        </p>
      </div>
      <ExportPanel />
    </div>
  );
}
