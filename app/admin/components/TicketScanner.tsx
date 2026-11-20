"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraOff, Loader2, ScanLine, Search } from "lucide-react";
import { normalizeTicketCode } from "@/utils/ticket";
import { adminInputClass } from "../types";

type CameraState = "idle" | "starting" | "on" | "denied" | "unavailable";

/**
 * Lector de entradas: cámara (qr-scanner) + búsqueda manual por código, nombre o DNI.
 * Al leer un código válido navega a /admin/escaner?c=CODIGO, que muestra la ficha rápida.
 */
export function TicketScanner({ autoStart }: { autoStart: boolean }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import("qr-scanner").default | null>(null);
  const handledRef = useRef(false);
  const [camera, setCamera] = useState<CameraState>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [active, setActive] = useState(autoStart);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    handledRef.current = false;

    async function start() {
      setCamera("starting");
      const { default: QrScanner } = await import("qr-scanner");
      if (cancelled || !videoRef.current) return;
      if (!(await QrScanner.hasCamera())) {
        setCamera("unavailable");
        return;
      }
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (handledRef.current) return;
          const code = normalizeTicketCode(result.data);
          if (!code) {
            setNotice("Ese QR no es una entrada de Radical 2.0.");
            return;
          }
          handledRef.current = true;
          navigator.vibrate?.(60);
          scanner.stop();
          router.push(`/admin/escaner?c=${code}`);
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 8,
          returnDetailedScanResult: true,
        },
      );
      scannerRef.current = scanner;
      try {
        await scanner.start();
        if (!cancelled) setCamera("on");
      } catch {
        if (!cancelled) setCamera("denied");
      }
    }

    start().catch(() => !cancelled && setCamera("unavailable"));
    return () => {
      cancelled = true;
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [active, router]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  function onManual(form: FormData) {
    const value = String(form.get("q") || "").trim();
    if (!value) return;
    const code = normalizeTicketCode(value);
    router.push(code ? `/admin/escaner?c=${code}` : `/admin/escaner?q=${encodeURIComponent(value)}`);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe7e2] bg-white shadow-sm">
      {active ? (
        <div className="relative aspect-[4/3] max-h-[60svh] w-full bg-[#082f39] sm:aspect-video">
          <video ref={videoRef} className="size-full object-cover" muted playsInline />
          {camera === "starting" && (
            <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 text-sm font-semibold text-white/80">
              <Loader2 className="animate-spin" size={22} aria-hidden />
              Abriendo cámara…
            </div>
          )}
          {(camera === "denied" || camera === "unavailable") && (
            <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 px-6 text-center text-sm text-white/85">
              <CameraOff size={24} aria-hidden />
              <strong className="text-base text-white">
                {camera === "denied" ? "Sin permiso para usar la cámara" : "No se encontró una cámara"}
              </strong>
              <span>
                {camera === "denied"
                  ? "Permite el acceso a la cámara en el navegador o escribe el código abajo."
                  : "Escribe el código de la entrada o busca por nombre o DNI."}
              </span>
            </div>
          )}
          {notice && (
            <p role="status" className="absolute inset-x-4 bottom-4 rounded-lg bg-[#082f39]/90 px-3 py-2 text-center text-sm font-semibold text-white">
              {notice}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="flex w-full items-center justify-center gap-2 bg-[#082f39] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#0b4248]"
        >
          <ScanLine size={18} aria-hidden />
          Escanear siguiente entrada
        </button>
      )}

      <form action={onManual} className="flex gap-2 p-3">
        <label className="sr-only" htmlFor="scanner-q">Código, nombre o DNI</label>
        <input
          id="scanner-q"
          name="q"
          className={`${adminInputClass} py-2.5`}
          placeholder="Código, nombre o DNI"
          autoComplete="off"
          autoCapitalize="characters"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f0ed] px-4 text-[#07333d] transition hover:bg-[#d7e8e3]"
        >
          <Search size={18} aria-hidden />
        </button>
      </form>
    </section>
  );
}
