"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { BrandLogo } from "@/components/common/BrandLogo";

type CornerItem = {
  id: string;
  label: string;
  src: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  rotationDeg: number;
  zIndex: number;
  opacity: number;
};

const storageKey = "radical-registration-corner-layout";
const defaultItems: CornerItem[] = [
  { id: "palm", label: "Palmera · arriba izquierda", src: "/assets/registration/corner-palm.webp", xPct: -0.2, yPct: -1.6, widthPct: 27.7, rotationDeg: 0, zIndex: 1, opacity: 0.45 },
  { id: "yellowBrush", label: "Brush amarillo · arriba derecha", src: "/assets/registration/corner-yellow-brush.webp", xPct: 67.7, yPct: -1.5, widthPct: 32.3, rotationDeg: 0, zIndex: 1, opacity: 0.68 },
  { id: "turquoiseBrush", label: "Brush turquesa · abajo derecha", src: "/assets/registration/corner-turquoise-brush.webp", xPct: 65.4, yPct: 90.8, widthPct: 38.5, rotationDeg: 0, zIndex: 1, opacity: 0.66 },
  { id: "surfboard", label: "Tabla y jardín · abajo izquierda", src: "/assets/registration/corner-surfboard-garden.webp", xPct: -5.3, yPct: 32.5, widthPct: 27.7, rotationDeg: 0, zIndex: 1, opacity: 0.9 },
];
let cachedStorageValue: string | null | undefined;
let cachedItems = defaultItems;
const subscribers = new Set<() => void>();

function getStoredItemsSnapshot() {
  const raw = localStorage.getItem(storageKey);
  if (raw === cachedStorageValue) return cachedItems;
  cachedStorageValue = raw;
  if (!raw) {
    cachedItems = defaultItems;
    return cachedItems;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    cachedItems = isCornerItems(parsed) ? parsed : defaultItems;
  } catch {
    cachedItems = defaultItems;
  }
  return cachedItems;
}

function subscribeToStoredItems(onChange: () => void) {
  subscribers.add(onChange);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey && event.key !== null) return;
    cachedStorageValue = undefined;
    onChange();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    subscribers.delete(onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveItems(items: CornerItem[]) {
  const raw = JSON.stringify(items);
  localStorage.setItem(storageKey, raw);
  cachedStorageValue = raw;
  cachedItems = items;
  subscribers.forEach((onChange) => onChange());
}

function isCornerItems(value: unknown): value is CornerItem[] {
  return Array.isArray(value) && value.length === defaultItems.length && defaultItems.every((item) => value.some((candidate) => candidate?.id === item.id));
}

export function RegistrationCornersEditor() {
  const items = useSyncExternalStore(subscribeToStoredItems, getStoredItemsSnapshot, () => defaultItems);
  const [selectedId, setSelectedId] = useState(defaultItems[0].id);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);

  function update(id: string, patch: Partial<CornerItem>) {
    saveItems(items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>, item: CornerItem) {
    if (!stageRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(item.id);
    dragRef.current = { id: item.id, startX: event.clientX, startY: event.clientY, x: item.xPct, y: item.yPct };
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    const current = dragRef.current;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!current || !bounds) return;
    update(current.id, {
      xPct: Math.round((current.x + (event.clientX - current.startX) / bounds.width * 100) * 10) / 10,
      yPct: Math.round((current.y + (event.clientY - current.startY) / bounds.height * 100) * 10) / 10,
    });
  }

  async function copyInstructions() {
    const bounds = stageRef.current?.getBoundingClientRect();
    const config = {
      canvas: { width: Math.round(bounds?.width ?? 0), height: Math.round(bounds?.height ?? 0) },
      elements: items.map(({ id, src, xPct, yPct, widthPct, rotationDeg, zIndex, opacity }) => ({ id, src, xPct, yPct, widthPct, rotationDeg, zIndex, opacity })),
    };
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function reset() {
    saveItems(defaultItems);
    setSelectedId(defaultItems[0].id);
  }

  return (
    <main className="min-h-screen bg-[#edf0ef] p-4 text-[#0b2d36] md:p-6">
      <header className="mx-auto mb-4 flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Ajuste de las esquinas de inscripción</h1>
          <p className="text-sm text-[#0b2d36]/65">Arrastra cada asset o selecciónalo para ajustar posición, tamaño y giro.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="rounded-lg border border-[#0b2d36]/20 bg-white px-4 py-2 text-sm font-bold">Restablecer</button>
          <button type="button" onClick={() => void copyInstructions()} className="rounded-lg bg-[#0b2d36] px-4 py-2 text-sm font-bold text-white">{copied ? "Copiado" : "Copiar configuración"}</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section ref={stageRef} className="relative aspect-[16/10] min-h-[480px] overflow-hidden rounded-xl border border-[#0b2d36]/15 bg-[#faf7ed] shadow-lg" aria-label="Vista previa desktop de inscripción">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_34%,rgba(0,199,199,.08),transparent_31%),radial-gradient(circle_at_82%_30%,rgba(255,198,41,.1),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex h-[12%] items-center justify-between border-b border-[#0b2d36]/10 bg-white/40 px-[4%]">
            <BrandLogo variant="secundario" width={120} />
            <span className="text-xs font-bold text-[#0b2d36]/70">← Volver</span>
          </div>
          <div className="pointer-events-none absolute left-[43%] right-[8%] top-[8%] z-[2] flex justify-between">
            {(["Plan", "Datos", "Contacto", "Abono", "Revisión", "Mi entrada"]).map((label, index) => <div key={label} className="flex flex-col items-center gap-1 text-[clamp(8px,.8vw,12px)] font-bold text-[#496368]"><span className={`grid h-[clamp(22px,3vw,42px)] w-[clamp(22px,3vw,42px)] place-items-center rounded-full ${index === 0 ? "bg-[#ff6b00] text-white" : "bg-[#dfe4e1]"}`}>{index + 1}</span>{label}</div>)}
          </div>

          <div className="pointer-events-none absolute left-[8%] top-[20%] z-[2] w-[31%]">
            <h2 className="font-[var(--font-blowbrush)] text-[clamp(26px,3.2vw,54px)] leading-[.98] text-[#0b2d36]">ELIGE TU PLAN<br />DE INSCRIPCIÓN</h2>
            <p className="mt-3 max-w-[330px] text-[clamp(10px,1vw,16px)] font-medium leading-relaxed text-[#0b2d36]/80">Asegura tu cupo y vive el siguiente nivel en Radical 2.0.</p>
          </div>

          <div className="pointer-events-none absolute bottom-[3%] left-[8%] top-[37%] z-[2] flex w-[30%] -rotate-[5deg] items-stretch gap-[2%] opacity-70">
            {["/assets/previous-camp/01-lugar-letrero-carretera-campel.jpg", "/assets/previous-camp/02-fogata-noche-tarjeta-2timoteo.jpg"].map((src) => <div key={src} className="relative min-w-0 flex-1 overflow-hidden border-[5px] border-[#101c1f] bg-[#101c1f] p-[2%] shadow-lg"><Image src={src} alt="" fill sizes="18vw" className="object-cover p-[2%]" /></div>)}
          </div>

          <div className="pointer-events-none absolute left-[43%] right-[8%] top-[17%] z-[2] grid h-[48%] grid-cols-2 gap-[3%]">
            {[{ name: "PREVENTA", price: "S/200", color: "#fffdf7" }, { name: "REGULAR", price: "S/250", color: "#fffdf7" }].map((plan) => <div key={plan.name} className="rounded-xl border border-[#0b2d36]/10 p-[6%] text-center shadow-lg" style={{ backgroundColor: plan.color }}><strong className="text-[clamp(13px,1.5vw,24px)]">{plan.name}</strong><p className="mt-3 font-[var(--font-bebas)] text-[clamp(29px,3vw,48px)]">{plan.price}</p><p className="mt-2 text-[clamp(8px,.8vw,12px)] font-bold">{plan.name === "PREVENTA" ? "Hasta el 15 de diciembre" : "Desde el 16 de diciembre"}</p><div className="mt-4 space-y-2 border-t border-[#0b2d36]/10 pt-3 text-left text-[clamp(8px,.8vw,12px)] font-semibold">{["Hospedaje", "Alimentación completa", "Programación y materiales", "Acceso a las actividades"].map((benefit) => <div key={benefit}>✓ &nbsp;{benefit}</div>)}</div></div>)}
          </div>
          <div className="pointer-events-none absolute bottom-[3%] right-[8%] z-[2] rounded-full bg-[#ffc629] px-8 py-3 font-[var(--font-bebas)] text-lg">CONTINUAR　→</div>

          {items.map((item) => <div key={item.id} className={`absolute touch-none ${selectedId === item.id ? "outline outline-2 outline-dashed outline-[#00aeb8]" : ""}`} style={{ left: `${item.xPct}%`, top: `${item.yPct}%`, width: `${item.widthPct}%`, zIndex: item.zIndex, opacity: item.opacity, transform: `rotate(${item.rotationDeg}deg)`, transformOrigin: "center" }} onPointerDown={(event) => beginDrag(event, item)} onPointerMove={drag} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onClick={() => setSelectedId(item.id)}>
            <Image src={item.src} alt="" width={1536} height={1024} draggable={false} className="block h-auto w-full cursor-grab select-none active:cursor-grabbing" />
            <span className="absolute left-1 top-1 whitespace-nowrap rounded bg-[#0b2d36]/85 px-1.5 py-0.5 text-[10px] font-bold text-white">{item.label}</span>
          </div>)}
        </section>

        <aside className="rounded-xl bg-white p-4 shadow-sm">
          <label className="mb-4 block text-sm font-bold">Asset<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#0b2d36]/20 bg-white p-2">{items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="mb-4 block text-sm font-bold">Posición X: {selected.xPct.toFixed(1)}%<input type="range" min="-35" max="115" step="0.5" value={selected.xPct} onChange={(event) => update(selected.id, { xPct: Number(event.target.value) })} className="mt-2 block w-full" /></label>
          <label className="mb-4 block text-sm font-bold">Posición Y: {selected.yPct.toFixed(1)}%<input type="range" min="-35" max="115" step="0.5" value={selected.yPct} onChange={(event) => update(selected.id, { yPct: Number(event.target.value) })} className="mt-2 block w-full" /></label>
          <label className="mb-4 block text-sm font-bold">Escala: {selected.widthPct.toFixed(1)}% del ancho<input type="range" min="8" max="90" step="0.5" value={selected.widthPct} onChange={(event) => update(selected.id, { widthPct: Number(event.target.value) })} className="mt-2 block w-full" /></label>
          <label className="mb-4 block text-sm font-bold">Rotación: {selected.rotationDeg}°<input type="range" min="-180" max="180" step="1" value={selected.rotationDeg} onChange={(event) => update(selected.id, { rotationDeg: Number(event.target.value) })} className="mt-2 block w-full" /></label>
          <label className="mb-4 block text-sm font-bold">Capa: {selected.zIndex}<input type="range" min="0" max="9" step="1" value={selected.zIndex} onChange={(event) => update(selected.id, { zIndex: Number(event.target.value) })} className="mt-2 block w-full" /></label>
          <p className="rounded-lg bg-[#edf0ef] p-3 text-xs leading-relaxed text-[#0b2d36]/70">Arrastra los assets sobre el lienzo. Al terminar, copia el JSON y pégalo aquí para aplicar exactamente las posiciones.</p>
          <button type="button" onClick={() => void copyInstructions()} className="mt-4 w-full rounded-lg bg-[#0b2d36] px-4 py-3 text-sm font-bold text-white">{copied ? "Configuración copiada" : "Copiar instrucciones JSON"}</button>
        </aside>
      </div>
    </main>
  );
}
