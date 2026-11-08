"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function DebugMenuPage() {
  const [reactOpen, setReactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#071d23] text-white p-4 pb-32 font-sans">
      <h1 className="text-xl font-black uppercase text-[#ffc629] mb-1">
        🧪 Laboratorio de Diagnóstico Móvil v2
      </h1>
      <p className="text-xs text-white/70 mb-4">
        Esta consola abajo usa <strong>JavaScript Nativo Puro</strong> (sin depender de React).
      </p>

      {/* ── CONSOLA NATIVA PURA (CERO DEPENDENCIAS DE REACT) ── */}
      <div className="bg-black border-2 border-[#00c7c7] rounded-xl p-3 mb-6 shadow-2xl">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/20">
          <span className="font-mono text-xs font-bold text-[#00c7c7]">
            📟 CONSOLA NATIVA (DOM DIRECTO)
          </span>
          <button
            id="btn-clear-logs"
            type="button"
            className="px-2 py-1 bg-white/20 active:bg-white/40 text-[10px] rounded font-bold"
          >
            Limpiar
          </button>
        </div>

        {/* Info del dispositivo */}
        <div id="raw-device-info" className="font-mono text-[11px] text-[#ffc629] mb-2 break-all">
          Detectando dispositivo...
        </div>

        {/* Lista de logs directa en DOM */}
        <div
          id="raw-log-container"
          className="font-mono text-[11px] max-h-56 overflow-y-auto space-y-1.5 p-2 bg-[#051114] rounded border border-white/10"
        >
          <div className="text-white/40 italic">Iniciando capturador nativo...</div>
        </div>
      </div>

      {/* ── SCRIPT NATIVO INYECTADO DIRECTAMENTE ── */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var logContainer = document.getElementById('raw-log-container');
  var devInfo = document.getElementById('raw-device-info');
  var clearBtn = document.getElementById('btn-clear-logs');

  function rawLog(msg, color) {
    if (!logContainer) logContainer = document.getElementById('raw-log-container');
    if (!logContainer) return;
    var d = new Date();
    var time = d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
    var div = document.createElement('div');
    div.style.padding = '3px 6px';
    div.style.borderRadius = '4px';
    div.style.fontSize = '11px';
    div.style.wordBreak = 'break-all';
    div.style.background = color === 'red' ? 'rgba(200,0,0,0.3)' : (color === 'green' ? 'rgba(0,200,100,0.2)' : 'rgba(255,255,255,0.05)');
    div.style.color = color === 'red' ? '#ff6b6b' : (color === 'green' ? '#4ade80' : '#ffffff');
    div.innerText = '[' + time + '] ' + msg;
    logContainer.insertBefore(div, logContainer.firstChild);

    // Enviar también al servidor
    try {
      fetch('/api/debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawLog: msg, time: time })
      }).catch(function(){});
    } catch(e){}
  }

  // 1. Mostrar info del dispositivo
  if (devInfo) {
    devInfo.innerText = 'Touch: ' + (('ontouchstart' in window) ? 'SÍ (' + navigator.maxTouchPoints + ' pts)' : 'NO') +
      ' | Screen: ' + window.innerWidth + 'x' + window.innerHeight +
      ' | UA: ' + navigator.userAgent.slice(0, 50) + '...';
  }

  // 2. Capturar errores globales
  window.addEventListener('error', function(e) {
    rawLog('❌ JS ERROR: ' + e.message + ' en ' + e.filename + ':' + e.lineno, 'red');
  });
  window.addEventListener('unhandledrejection', function(e) {
    rawLog('❌ PROMISE ERROR: ' + e.reason, 'red');
  });

  // 3. Capturar TODOS los toques en la pantalla (Fase de captura)
  document.addEventListener('touchstart', function(e) {
    var tag = e.target.tagName;
    var id = e.target.id ? '#' + e.target.id : '';
    var cls = e.target.className ? '.' + String(e.target.className).slice(0, 25) : '';
    rawLog('👆 TOUCHSTART en: <' + tag + id + cls + '>', 'green');
  }, true);

  document.addEventListener('click', function(e) {
    var tag = e.target.tagName;
    var id = e.target.id ? '#' + e.target.id : '';
    rawLog('🖱️ CLICK en: <' + tag + id + '>', 'green');
  }, true);

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (logContainer) logContainer.innerHTML = '';
      rawLog('Consola limpiada.', 'white');
    });
  }

  rawLog('✓ Capturador nativo listo. Toca cualquier parte de la pantalla.', 'green');
})();
          `,
        }}
      />

      <div className="space-y-4">
        {/* BOTÓN DE ALERTA NATIVA */}
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl">
          <p className="text-xs text-red-200 mb-2 font-bold">Prueba de Fuego 0: Alert del Sistema</p>
          <button
            type="button"
            id="btn-test-alert"
            onClick={() => alert("¡EL BOTÓN RESPONDE AL TOUCH EXITOSAMENTE!")}
            className="w-full py-3 bg-red-600 active:bg-red-700 text-white font-black text-sm uppercase rounded-lg shadow-lg tracking-wider"
          >
            🔥 TOCAR AQUÍ PARA MOSTRAR ALERT NATIVO
          </button>
        </div>

        {/* EXPERIMENTO 1: CSS PURO */}
        <div className="p-4 rounded-xl bg-azul-profundo border border-white/10">
          <h2 className="font-bold text-sm text-[#00c7c7] mb-1">Exp 1: Menú 100% Puro CSS (Sin JS)</h2>
          <p className="text-xs text-white/70 mb-3">
            Checkbox nativo + CSS. Cero JavaScript.
          </p>
          <input type="checkbox" id="css-menu-toggle" className="peer hidden" />
          <label
            htmlFor="css-menu-toggle"
            id="label-css-toggle"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ffc629] text-azul-profundo font-bold rounded-lg cursor-pointer active:scale-95 text-xs uppercase"
          >
            Abrir / Cerrar con CSS Puro
          </label>
          <div className="hidden peer-checked:block mt-3 p-4 bg-black/60 border border-[#ffc629] rounded-lg">
            <p className="text-xs font-bold text-[#ffc629] mb-2">¡MENÚ CSS ABIERTO!</p>
            <p className="text-xs text-white/80">Este menú funciona sin una sola gota de JavaScript.</p>
          </div>
        </div>

        {/* EXPERIMENTO 2: REACT USESTATE */}
        <div className="p-4 rounded-xl bg-azul-profundo border border-white/10">
          <h2 className="font-bold text-sm text-[#ffc629] mb-1">Exp 2: React useState (onClick)</h2>
          <p className="text-xs text-white/70 mb-3">
            El método clásico de React.
          </p>
          <button
            id="btn-react-toggle"
            type="button"
            onClick={() => setReactOpen(!reactOpen)}
            className="w-full py-2.5 px-4 bg-white/10 active:bg-white/20 border border-white/20 rounded-lg text-xs font-bold flex justify-between items-center"
          >
            <span>Estado: {reactOpen ? "ABIERTO" : "CERRADO"}</span>
            <span className="px-2 py-1 bg-[#00c7c7] text-azul-profundo rounded font-black text-[10px]">
              TOCAR AQUÍ
            </span>
          </button>
          {reactOpen && (
            <div className="mt-3 p-3 bg-black/50 border border-emerald-400 rounded-lg text-xs text-emerald-300">
              ✓ React re-renderizó el componente correctamente.
            </div>
          )}
        </div>

        {/* EXPERIMENTO 4: HTML5 DETAILS NATIVO */}
        <div className="p-4 rounded-xl bg-azul-profundo border border-white/10">
          <h2 className="font-bold text-sm text-white mb-1">Exp 4: HTML5 Nativo &lt;details&gt;</h2>
          <details className="cursor-pointer" id="details-native">
            <summary className="p-3 bg-white/10 rounded-lg font-bold text-xs select-none">
              Desplegar Menú Nativo del Navegador ▼
            </summary>
            <div className="p-3 mt-2 bg-black/40 rounded-lg text-xs border border-white/10">
              Menú nativo desplegado por el navegador del celular.
            </div>
          </details>
        </div>
      </div>

      {/* Navbar Real arriba para probar el botón */}
      <Navbar />
    </div>
  );
}
