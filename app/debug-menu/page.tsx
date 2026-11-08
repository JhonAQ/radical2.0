"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MenuIcon, CloseIcon } from "@/components/common/Icons";

export default function DebugMenuPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [reactModalOpen, setReactModalOpen] = useState(false);
  const [reactDrawerOpen, setReactDrawerOpen] = useState(false);
  const [dialogSupported, setDialogSupported] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    setLogs((prev) => [formatted, ...prev.slice(0, 49)]);

    // Mandar al servidor en background para que salga en consola de la terminal
    try {
      fetch("/api/debug-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, time: timestamp }),
      }).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    // Detectar soporte
    setDialogSupported(typeof HTMLDialogElement !== "undefined");
    const info = `UA: ${navigator.userAgent.slice(0, 60)}... | Touch: ${navigator.maxTouchPoints > 0 ? "YES (" + navigator.maxTouchPoints + " pts)" : "NO"} | Screen: ${window.innerWidth}x${window.innerHeight}`;
    setDeviceInfo(info);

    addLog(`INIT: Página montada exitosamente. ${info}`);

    // Capturar cualquier error no controlado
    const errorHandler = (event: ErrorEvent) => {
      addLog(`❌ JS ERROR: ${event.message} at ${event.filename}:${event.lineno}`);
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      addLog(`❌ PROMISE ERROR: ${String(event.reason)}`);
    };

    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#071d23] text-white p-4 pb-32 font-sans">
      <h1 className="text-xl font-black uppercase text-amarillo mb-2">
        🧪 Laboratorio de Diagnóstico Móvil
      </h1>
      <p className="text-xs text-white/70 mb-4">
        Prueba cada botón en tu celular. Todos los eventos se muestran aquí abajo y se envían a la terminal del servidor.
      </p>

      {/* ── CONSOLA EN VIVO EN PANTALLA ── */}
      <div className="bg-black/80 border border-turquesa/40 rounded-xl p-3 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10 text-xs">
          <span className="font-mono text-turquesa font-bold">Consola en Vivo ({logs.length} logs)</span>
          <button
            onClick={() => {
              setLogs([]);
              addLog("Consola limpiada");
            }}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px]"
          >
            Limpiar
          </button>
        </div>
        <div className="text-[11px] font-mono text-white/50 mb-2 break-words">
          {deviceInfo || "Cargando info de dispositivo..."}
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
          {logs.length === 0 ? (
            <div className="text-white/40 italic">Aún no hay eventos. Toca algún botón abajo.</div>
          ) : (
            logs.map((l, i) => (
              <div
                key={i}
                className={`p-1 rounded ${
                  l.includes("❌")
                    ? "bg-red-950/80 text-red-200 font-bold"
                    : l.includes("CLICK") || l.includes("TOUCH")
                    ? "bg-emerald-950/60 text-emerald-200"
                    : "text-white/80"
                }`}
              >
                {l}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* ── EXPERIMENTO 1: PURE CSS (CHECKBOX HACK - CERO JAVASCRIPT) ── */}
        <div className="p-4 rounded-xl bg-azul-profundo border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm text-turquesa">Exp 1: Menú 100% Puro CSS (Sin JS)</h2>
            <span className="text-[10px] bg-turquesa/20 text-turquesa px-2 py-0.5 rounded">Cero React / Cero JS</span>
          </div>
          <p className="text-xs text-white/70 mb-3">
            Usa un <code>&lt;input type="checkbox"&gt;</code> nativo. Si esto abre, el motor CSS y layout del celular están perfectos.
          </p>

          <div className="relative">
            <input
              type="checkbox"
              id="css-menu-toggle"
              className="peer hidden"
              onChange={(e) => addLog(`CSS Checkbox cambio a: ${e.target.checked}`)}
            />
            <label
              htmlFor="css-menu-toggle"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amarillo text-azul-profundo font-bold rounded-lg cursor-pointer active:scale-95 transition-transform"
            >
              <span>Abrir / Cerrar con CSS Puro</span>
            </label>

            <div className="hidden peer-checked:block mt-3 p-4 bg-black/60 border border-amarillo rounded-lg animate-in">
              <p className="text-xs font-bold text-amarillo mb-2">¡MENÚ CSS ABIERTO EXITOSAMENTE!</p>
              <ul className="text-xs space-y-1 text-white/80">
                <li>• Enlace 1: Inicio</li>
                <li>• Enlace 2: Campamento</li>
                <li>• Enlace 3: Contacto</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── EXPERIMENTO 2: REACT USESTATE CLÁSICO ── */}
        <div className="p-4 rounded-xl bg-azul-profundo border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm text-amarillo">Exp 2: React useState (onClick)</h2>
            <span className="text-[10px] bg-amarillo/20 text-amarillo px-2 py-0.5 rounded">React Standard</span>
          </div>
          <p className="text-xs text-white/70 mb-3">
            El patrón estándar de React con botón normal y evento <code>onClick</code>.
          </p>

          <button
            type="button"
            onClick={() => {
              addLog(`React useState: botón clickeado. Estado previo: ${reactDrawerOpen}`);
              setReactDrawerOpen((prev) => !prev);
            }}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg font-bold text-sm text-left flex items-center justify-between border border-white/20"
          >
            <span>Estado: {reactDrawerOpen ? "ABIERTO" : "CERRADO"}</span>
            <span className="px-2 py-1 bg-turquesa text-azul-profundo text-xs font-black rounded">
              Tocar aquí
            </span>
          </button>

          {reactDrawerOpen && (
            <div className="mt-3 p-4 bg-azul-profundo/90 border border-white/30 rounded-lg">
              <p className="text-xs font-bold text-emerald-400 mb-2">✓ React Drawer Abierto!</p>
              <p className="text-xs text-white/80 mb-3">
                Si ves esto, React SÍ reacciona a los clicks de tu celular normalmente.
              </p>
              <button
                onClick={() => {
                  addLog("React useState: botón cerrar clickeado");
                  setReactDrawerOpen(false);
                }}
                className="px-3 py-1 bg-red-500/80 text-white rounded text-xs font-bold"
              >
                Cerrar Drawer
              </button>
            </div>
          )}
        </div>

        {/* ── EXPERIMENTO 3: TEST DE EVENTOS TÁCTILES ESPECÍFICOS ── */}
        <div className="p-4 rounded-xl bg-azul-profundo border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm text-white">Exp 3: Comparativa de Eventos Touch</h2>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Event Diagnostics</span>
          </div>
          <p className="text-xs text-white/70 mb-3">
            Toca cada botón para ver cuál evento exacto captura tu pantalla táctil:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => addLog("EVENTO: onClick disparado")}
              className="p-3 bg-white/5 active:bg-white/20 border border-white/10 rounded-lg text-center font-bold"
            >
              1. Solo onClick
            </button>
            <button
              onTouchStart={() => addLog("EVENTO: onTouchStart disparado")}
              className="p-3 bg-white/5 active:bg-white/20 border border-white/10 rounded-lg text-center font-bold"
            >
              2. onTouchStart
            </button>
            <button
              onTouchEnd={() => addLog("EVENTO: onTouchEnd disparado")}
              className="p-3 bg-white/5 active:bg-white/20 border border-white/10 rounded-lg text-center font-bold"
            >
              3. onTouchEnd
            </button>
            <button
              onPointerDown={() => addLog("EVENTO: onPointerDown disparado")}
              className="p-3 bg-white/5 active:bg-white/20 border border-white/10 rounded-lg text-center font-bold"
            >
              4. onPointerDown
            </button>
          </div>
        </div>

        {/* ── EXPERIMENTO 4: HTML5 NATIVO <details> / <summary> ── */}
        <div className="p-4 rounded-xl bg-azul-profundo border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm text-turquesa">Exp 4: Nativo &lt;details&gt; HTML5</h2>
            <span className="text-[10px] bg-turquesa/20 text-turquesa px-2 py-0.5 rounded">Nativo Browser</span>
          </div>
          <details
            className="cursor-pointer group"
            onToggle={(e: any) => addLog(`HTML details toggle: ${e.target.open ? "ABIERTO" : "CERRADO"}`)}
          >
            <summary className="p-3 bg-white/10 rounded-lg font-bold text-xs select-none list-none flex items-center justify-between">
              <span>Toca aquí para desplegar menú nativo</span>
              <span className="text-amarillo font-mono">▼</span>
            </summary>
            <div className="p-3 mt-2 bg-black/40 rounded-lg text-xs space-y-2 border border-white/10">
              <p className="text-turquesa font-bold">Menú nativo desplegado sin scripts.</p>
              <div>• Opción A</div>
              <div>• Opción B</div>
            </div>
          </details>
        </div>

        {/* ── EXPERIMENTO 5: EL NAVBAR REAL CON INTERCEPTOR DE TOUCH ── */}
        <div className="p-4 rounded-xl bg-azul-profundo border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm text-red-400">Exp 5: Navbar Real del Sitio</h2>
            <span className="text-[10px] bg-red-400/20 text-red-400 px-2 py-0.5 rounded">Componente Real</span>
          </div>
          <p className="text-xs text-white/70 mb-3">
            El Navbar real está fijo arriba en esta página. Toca el botón de hamburguesa arriba a la derecha para ver si dispara o qué evento recibe.
          </p>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              addLog("Scroll hasta arriba para ver el Navbar");
            }}
            className="w-full py-2 bg-turquesa text-azul-profundo font-bold rounded-lg text-xs"
          >
            Subir al Navbar
          </button>
        </div>
      </div>

      {/* Embedded Navbar para probar directamente */}
      <Navbar />
    </div>
  );
}
