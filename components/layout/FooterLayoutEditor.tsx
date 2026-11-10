"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Item = { id: string; label: string; src: string; x: number; y: number; width: number; rotation: number; z: number };

const initialItems: Item[] = [
  { id: "sand", label: "Arena", src: "/assets/footer/arena-footer.webp", x: 0, y: 69, width: 100, rotation: 0, z: 0 },
  { id: "leftBush", label: "Arbusto izquierdo", src: "/assets/footer/arbustos-izquierda.webp", x: 0, y: 48, width: 25, rotation: 0, z: 2 },
  { id: "leftRocks", label: "Rocas izquierdas", src: "/assets/footer/rocas-izquierda.webp", x: 0, y: 69, width: 21, rotation: 0, z: 5 },
  { id: "leftFoliage", label: "Follaje lateral", src: "/assets/footer/follaje-lateral-izquierdo.webp", x: 0, y: 31, width: 16, rotation: 0, z: 4 },
  { id: "rightBush", label: "Arbusto derecho", src: "/assets/footer/arbustos-inferiores-derechos.webp", x: 77, y: 49, width: 25, rotation: 0, z: 2 },
  { id: "rightRocks", label: "Rocas derechas", src: "/assets/footer/rocas-extremo-derecho.webp", x: 77, y: 70, width: 27, rotation: 0, z: 5 },
  { id: "palm", label: "Palma superior", src: "/assets/footer/palma-superior-derecha.webp", x: 84, y: 0, width: 22, rotation: 0, z: 7 },
  { id: "surfboard", label: "Tabla de surf", src: "/assets/footer/tabla-surf.webp", x: 79, y: 36, width: 9, rotation: 0, z: 3 },
  { id: "backpack", label: "Mochila", src: "/assets/footer/mochila-radical.webp", x: 88, y: 51, width: 8, rotation: 0, z: 6 },
  { id: "lantern", label: "Lámpara", src: "/assets/footer/lampara-radical.webp", x: 76, y: 58, width: 4, rotation: 0, z: 6 },
];

export function FooterLayoutEditor() {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0].id);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);

  useEffect(() => {
    const saved = localStorage.getItem("radical-footer-layout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Item[];
        if (Array.isArray(parsed) && parsed.length === initialItems.length) setItems(parsed);
      } catch { localStorage.removeItem("radical-footer-layout"); }
    }
  }, []);
  useEffect(() => { localStorage.setItem("radical-footer-layout", JSON.stringify(items)); }, [items]);

  function update(id: string, patch: Partial<Item>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }
  function beginDrag(event: React.PointerEvent<HTMLImageElement>, item: Item) {
    if (!stageRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(item.id);
    dragRef.current = { id: item.id, startX: event.clientX, startY: event.clientY, x: item.x, y: item.y };
  }
  function drag(event: React.PointerEvent<HTMLImageElement>) {
    const current = dragRef.current;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!current || !bounds) return;
    update(current.id, {
      x: Math.round((current.x + (event.clientX - current.startX) / bounds.width * 100) * 10) / 10,
      y: Math.round((current.y + (event.clientY - current.startY) / bounds.height * 100) * 10) / 10,
    });
  }
  async function exportConfig() {
    const stage = stageRef.current?.getBoundingClientRect();
    const payload = {
      canvas: { width: Math.round(stage?.width ?? 0), height: Math.round(stage?.height ?? 0) },
      elements: items.map(({ id, src, x, y, width, rotation, z }) => ({ id, src, xPct: x, yPct: y, widthPct: width, rotationDeg: rotation, zIndex: z })),
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen bg-[#edf0ef] p-4 text-[#0b2d36] md:p-6">
      <header className="mx-auto mb-4 flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-extrabold">Ajuste de la escena del footer</h1><p className="text-sm text-[#0b2d36]/65">Arrastra los assets. Selecciona uno para cambiar su escala, giro y capa.</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setItems(initialItems); setSelectedId(initialItems[0].id); }} className="rounded-lg border border-[#0b2d36]/20 bg-white px-4 py-2 text-sm font-bold">Restablecer</button>
          <button type="button" onClick={() => void exportConfig()} className="rounded-lg bg-[#0b2d36] px-4 py-2 text-sm font-bold text-white">{copied ? "Copiado" : "Copiar configuración"}</button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section ref={stageRef} className="relative h-[min(72vh,760px)] min-h-[500px] overflow-hidden border border-[#0b2d36]/15 bg-white shadow-lg" aria-label="Lienzo de composición">
          <div className="pointer-events-none absolute inset-x-[14%] top-[12%] bottom-[18%] grid grid-cols-2 gap-8 opacity-35">
            <div className="rounded-xl border-2 border-dashed border-[#0b2d36]/40 p-5 text-center text-sm font-bold">UBICACIÓN<br/><span className="mt-5 block h-36 rounded-lg bg-[#e7ecea]"/>FOTO + MAPA</div>
            <div className="space-y-3 rounded-xl border-2 border-dashed border-[#0b2d36]/40 p-5 text-sm font-bold">PREGUNTAS FRECUENTES{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-11 rounded-lg bg-[#f8f1e3]" />)}</div>
          </div>
          {items.map((item) => (
            <div key={item.id} className="absolute" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, zIndex: item.z, transform: `rotate(${item.rotation}deg)`, transformOrigin: "center" }}>
              <Image src={item.src} alt="" width={1400} height={933} draggable={false} onPointerDown={(event) => beginDrag(event, item)} onPointerMove={drag} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onClick={() => setSelectedId(item.id)} className={`block h-auto w-full cursor-grab select-none active:cursor-grabbing ${selectedId === item.id ? "outline outline-2 outline-dashed outline-[#00aeb8]" : ""}`} />
              <span className="pointer-events-none absolute left-1 top-1 rounded bg-[#0b2d36]/80 px-1.5 py-0.5 text-[10px] font-bold text-white">{item.label}</span>
            </div>
          ))}
        </section>
        <aside className="rounded-xl bg-white p-4 shadow-sm">
          <label className="mb-4 block text-sm font-bold">Elemento<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#0b2d36]/20 bg-white p-2">{items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="mb-4 block text-sm font-bold">Tamaño: {selected.width.toFixed(1)}%<input type="range" min="2" max="110" step="0.5" value={selected.width} onChange={(event) => update(selected.id, { width: Number(event.target.value) })} className="mt-2 block w-full" /></label>
          <label className="mb-4 block text-sm font-bold">Giro: {selected.rotation}°<input type="range" min="-45" max="45" step="1" value={selected.rotation} onChange={(event) => update(selected.id, { rotation: Number(event.target.value) })} className="mt-2 block w-full" /></label>
          <label className="mb-4 block text-sm font-bold">Profundidad: {selected.z}<input type="range" min="0" max="9" step="1" value={selected.z} onChange={(event) => update(selected.id, { z: Number(event.target.value) })} className="mt-2 block w-full" /></label>
          <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded bg-[#edf0ef] p-2">X: {selected.x.toFixed(1)}%</div><div className="rounded bg-[#edf0ef] p-2">Y: {selected.y.toFixed(1)}%</div></div>
          <p className="mt-4 text-xs leading-relaxed text-[#0b2d36]/65">La configuración se guarda en este navegador mientras ajustas. Al terminar, copia el JSON completo y pégalo aquí.</p>
        </aside>
      </div>
    </main>
  );
}
