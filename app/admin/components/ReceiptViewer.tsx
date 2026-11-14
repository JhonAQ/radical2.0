"use client";

import { useState } from "react";
import Image from "next/image";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface ReceiptItem {
  id: string;
  label: string;
  url: string;
  amount?: number;
  kind?: string;
  status?: string;
}

interface ReceiptViewerProps {
  receipts: ReceiptItem[];
}

export function ReceiptViewer({ receipts }: ReceiptViewerProps) {
  const [activeReceiptId, setActiveReceiptId] = useState<string>(
    receipts[0]?.id || "",
  );
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);

  const activeReceipt =
    receipts.find((r) => r.id === activeReceiptId) || receipts[0];

  const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setRotation(0);
    setZoom(1);
  };

  if (!receipts || receipts.length === 0 || !activeReceipt) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        No se encontró ningún comprobante disponible.
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl bg-[#0c2830] text-white shadow-[0_8px_30px_rgba(11,45,54,0.15)]">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        {/* Receipt Tabs / Switcher if multiple */}
        <div className="flex flex-wrap gap-1.5">
          {receipts.map((r, index) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setActiveReceiptId(r.id);
                handleReset();
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                activeReceipt.id === r.id
                  ? "bg-[#ffc629] text-[#0b2d36]"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <span>{r.label}</span>
              {r.amount !== undefined && (
                <span className="ml-1 opacity-80">(S/ {r.amount})</span>
              )}
            </button>
          ))}
        </div>

        {/* Image Adjustment Controls */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <button
            type="button"
            title="Rotar a la izquierda (90°)"
            onClick={handleRotateLeft}
            className="grid size-8 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 hover:text-white"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            title="Rotar a la derecha (90°)"
            onClick={handleRotateRight}
            className="grid size-8 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 hover:text-white"
          >
            <RotateCw size={15} />
          </button>
          <span className="mx-1 h-4 w-px bg-white/15" />
          <button
            type="button"
            title="Acercar zoom"
            onClick={handleZoomIn}
            className="grid size-8 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 hover:text-white"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            title="Alejar zoom"
            onClick={handleZoomOut}
            className="grid size-8 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 hover:text-white"
          >
            <ZoomOut size={15} />
          </button>
          {(rotation !== 0 || zoom !== 1) && (
            <button
              type="button"
              title="Restablecer vista"
              onClick={handleReset}
              className="grid size-8 place-items-center rounded-lg bg-[#00aeb8]/20 text-[#00aeb8] transition hover:bg-[#00aeb8]/30 hover:text-white"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <span className="mx-1 h-4 w-px bg-white/15" />
          <a
            href={activeReceipt.url}
            target="_blank"
            rel="noreferrer"
            title="Abrir imagen en nueva pestaña"
            className="grid size-8 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 hover:text-white"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* ── Image Canvas Container ── */}
      <div className="relative flex min-h-[440px] max-h-[640px] items-center justify-center overflow-hidden p-6 sm:p-8">
        <div
          className="relative transition-transform duration-200 ease-out"
          style={{
            transform: `rotate(${rotation}deg) scale(${zoom})`,
          }}
        >
          <Image
            src={activeReceipt.url}
            alt={activeReceipt.label}
            width={700}
            height={900}
            unoptimized
            priority
            className="max-h-[520px] w-auto rounded-xl object-contain shadow-2xl"
          />
        </div>
      </div>

      {/* ── Footer Info ── */}
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>{activeReceipt.label}</span>
          {rotation !== 0 && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
              Rotación {rotation}°
            </span>
          )}
          {zoom !== 1 && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
              Zoom {Math.round(zoom * 100)}%
            </span>
          )}
        </div>
        <a
          href={activeReceipt.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-[#00c7c7] hover:underline"
        >
          <span>Ver tamaño completo</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
