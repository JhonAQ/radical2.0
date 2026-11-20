import Link from "next/link";
import QRCode from "qrcode";
import { Download, ExternalLink } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { CAMP_CONFIG } from "@/config/site";
import { TICKET_BASE_URL } from "@/utils/ticket";
import { PrintButton } from "../../components/PrintButton";

export const metadata = { title: "QR para abonar | Radical 2.0" };

const ABONAR_URL = `${TICKET_BASE_URL}/abonar`;
const yapePhone = process.env.NEXT_PUBLIC_YAPE_PHONE || "";
const yapeHolder = process.env.NEXT_PUBLIC_YAPE_HOLDER || "";

const steps = [
  { n: "1", title: "Escanea", text: "Con la cámara de tu celular." },
  { n: "2", title: "Entra", text: "Con la cuenta de Google con la que te inscribiste." },
  { n: "3", title: "Abona", text: "Yapea tu saldo y sube la captura del pago." },
];

export default async function QrAbonosPage() {
  const opts = { errorCorrectionLevel: "H" as const, margin: 0, color: { dark: "#0b2d36", light: "#ffffff" } };
  const [svg, png] = await Promise.all([
    QRCode.toString(ABONAR_URL, { ...opts, type: "svg" }),
    QRCode.toDataURL(ABONAR_URL, { ...opts, margin: 2, width: 1200 }),
  ]);
  const svgHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <div className="space-y-6">
      <style>{`@page { size: A4 portrait; margin: 0; }`}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a3039] sm:text-3xl">QR para abonar</h1>
          <p className="mt-1 max-w-xl text-sm text-[#5f7a75]">
            Para pegar en las puertas de las cabañas y afiches. Lleva a{" "}
            <span className="font-mono text-xs">{ABONAR_URL.replace("https://", "")}</span>: cada campista entra con su
            cuenta y llega directo a registrar su abono (o a corregir su comprobante, si está observado).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <a
            href={png}
            download="qr-abonar-radical.png"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d2ded8] bg-white px-3.5 py-2 text-xs font-bold text-[#0a3039] shadow-sm hover:bg-[#f8faf8]"
          >
            <Download size={14} aria-hidden /> PNG
          </a>
          <a
            href={svgHref}
            download="qr-abonar-radical.svg"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d2ded8] bg-white px-3.5 py-2 text-xs font-bold text-[#0a3039] shadow-sm hover:bg-[#f8faf8]"
          >
            <Download size={14} aria-hidden /> SVG
          </a>
          <Link
            href="/abonar"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-[#008e95] hover:text-[#006e74]"
          >
            Probar enlace <ExternalLink size={13} aria-hidden />
          </Link>
        </div>
      </div>

      {/* Afiche A4: en pantalla se ve como vista previa; al imprimir ocupa la hoja completa */}
      <div className="mx-auto w-full max-w-[560px] print:!mt-0 print:max-w-none">
        <article className="relative flex aspect-[210/297] flex-col overflow-hidden rounded-2xl bg-[#f8f4e9] text-[#0b2d36] shadow-[0_18px_40px_-20px_rgba(11,45,54,.45)] [container-type:inline-size] print:h-[297mm] print:w-[210mm] print:rounded-none print:shadow-none print:[print-color-adjust:exact]">
          <header className="bg-[#0b2d36] px-[7cqw] pb-[4.5cqw] pt-[4.5cqw] text-[#f8f4e9]">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo variant="secundario" width={420} className="w-[25cqw]" />
              <span className="rounded-[1.2cqw] border border-[#ffc629]/60 px-[2.2cqw] py-[1cqw] text-[2.6cqw] tracking-[.16em] text-[#ffc629] [font-family:var(--font-bebas)]">
                {CAMP_CONFIG.dates.range}
              </span>
            </div>
            {/* BlowBrush no trae "¿": ese signo va en Bebas */}
            <h2 className="mt-[3.5cqw] text-[10cqw] leading-[.92] text-white [font-family:var(--font-blowbrush)]">
              <span className="mr-[0.6cqw] [font-family:var(--font-bebas)]">¿</span>Te falta abonar?
            </h2>
            <p className="mt-[2cqw] text-[3.4cqw] font-semibold leading-snug text-[#f8f4e9]/85">
              Regulariza tu pago aquí mismo, en un par de minutos.
            </p>
          </header>

          <div className="flex flex-col items-center px-[7cqw] pb-[3cqw] pt-[4cqw]">
            <div className="rounded-[3cqw] bg-white p-[3cqw] shadow-[inset_0_0_0_1px_rgba(11,45,54,.12)]">
              <div className="size-[34cqw] [&_svg]:size-full" role="img" aria-label="Código QR para abonar" dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
            <p className="mt-[2.4cqw] font-mono text-[2.8cqw] font-bold tracking-wide text-[#0b2d36]/70">
              {ABONAR_URL.replace("https://", "")}
            </p>

            <ol className="mt-[3cqw] grid w-full grid-cols-3 gap-[3cqw]">
              {steps.map((s) => (
                <li key={s.n} className="border-t-[0.5cqw] border-[#ffc629] pt-[2cqw]">
                  <span className="block text-[5cqw] leading-none text-[#00aeb8] [font-family:var(--font-bebas)]">{s.n}</span>
                  <strong className="mt-[1cqw] block text-[3.4cqw] font-extrabold">{s.title}</strong>
                  <span className="mt-[0.4cqw] block text-[2.5cqw] leading-snug text-[#0b2d36]/75">{s.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <footer className="mx-[7cqw] mb-[5cqw] mt-auto rounded-[2cqw] bg-[#0b2d36]/[.06] px-[4cqw] py-[3cqw] text-[2.7cqw] leading-snug">
            {yapePhone && (
              <p>
                <strong className="font-extrabold">Yape:</strong> {yapePhone}
                {yapeHolder && ` · ${yapeHolder}`}
              </p>
            )}
            <p className={yapePhone ? "mt-[0.8cqw]" : ""}>
              <strong className="font-extrabold">¿Prefieres efectivo?</strong> Acércate al equipo de tesorería.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
