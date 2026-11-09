"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { CAMP_CONFIG } from "@/config/site";
import {
  CrownIcon,
  UsersGroupIcon,
  WavesIcon,
  FireIcon,
} from "@/components/common/Icons";

interface TimeUnits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const emptySubscribe = () => () => {};

export function CampAbout() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [timeLeft, setTimeLeft] = useState<TimeUnits>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const getTargetTime = () => {
      const now = Date.now();
      let target = new Date(CAMP_CONFIG.targetCountdownDate).getTime();
      if (isNaN(target) || target <= now) {
        const currentYear = new Date().getFullYear();
        const candidate = new Date(`${currentYear}-12-30T09:00:00-05:00`).getTime();
        target = candidate > now ? candidate : new Date(`${currentYear + 1}-12-30T09:00:00-05:00`).getTime();
      }
      return target;
    };

    const targetTime = getTargetTime();

    const calculateTime = () => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeUnits = [
    { label: "DÍAS", value: timeLeft.days },
    { label: "HORAS", value: timeLeft.hours },
    { label: "MIN", value: timeLeft.minutes },
    { label: "SEG", value: timeLeft.seconds },
  ];

  const pillars = [
    {
      id: "dios",
      label: "DIOS",
      icon: <CrownIcon className="w-8 h-8 text-[#fcc408]" />,
    },
    {
      id: "comunidad",
      label: "COMUNIDAD REAL",
      icon: <UsersGroupIcon className="w-8 h-8 text-azul-profundo" />,
    },
    {
      id: "naturaleza",
      label: "NATURALEZA Y PLAYA",
      icon: <WavesIcon className="w-8 h-8 text-turquesa" />,
    },
    {
      id: "proposito",
      label: "PROPÓSITO DE VIDA",
      icon: <FireIcon className="w-8 h-8 text-naranja" />,
    },
  ];

  return (
    <section id="campamento" className="w-full bg-white text-azul-profundo">
      {/* ── 02: COUNTDOWN TIMER (Fiel al Moodboard 02-countdown-timer.png) ── */}
      <div className="relative w-full pt-8 pb-8 sm:pt-14 sm:pb-12 px-4 flex flex-col items-center justify-center overflow-hidden">
        {/* Bloque del Título con el fondo de brocha centrado a la altura del texto */}
        <div className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl flex items-center justify-center min-h-[110px] sm:min-h-[140px] px-4 py-5 sm:py-7">
          {/* Fondo de brocha centrado con el texto */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
            <div className="relative w-[120%] sm:w-[115%] h-[180%] sm:h-[210%] -translate-y-2 sm:-translate-y-3">
              <Image
                src="/assets/textures/countdown-brush-banner.webp"
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 672px"
                className="object-contain object-center pointer-events-none select-none"
                priority
              />
            </div>
          </div>

          {/* Título: ahora queda 100% contenido sobre el cuerpo azul de la brocha */}
          <h2 className="relative z-10 font-edosz text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-wider text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] px-4">
            <span className="block">¡EL SIGUIENTE NIVEL</span>
            <span className="block">TE ESPERA!</span>
          </h2>
        </div>

        {/* Pastilla del Timer: centrada justo abajo, con su propio fondo oscuro */}
        <div className="relative z-10 -mt-1 sm:mt-1 bg-[#061e25]/90 backdrop-blur-md rounded-2xl py-3 sm:py-3.5 px-4 sm:px-8 shadow-2xl border border-white/10 flex items-center justify-center divide-x divide-white/15">
          {timeUnits.map((unit) => (
            <div
              key={unit.label}
              className="px-3 sm:px-5 flex flex-col items-center text-center first:pl-1 last:pr-1 min-w-[56px] sm:min-w-[68px]"
            >
              <span className="font-bebas text-3xl sm:text-4xl md:text-5xl text-white font-normal leading-none tracking-wider tabular-nums">
                {mounted ? String(unit.value).padStart(2, "0") : "--"}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-widest mt-1">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 03: EL CAMPAMENTO (Fiel al Moodboard 03-que-es-campamento.png) ── */}
      <div className="w-full max-w-2xl mx-auto px-5 sm:px-6 pt-4 pb-16 sm:pb-24 flex flex-col">
        {/* Título Principal */}
        <h3 className="font-edosz text-4xl sm:text-5xl md:text-6xl text-azul-profundo uppercase tracking-wide -rotate-1 mb-4">
          EL CAMPAMENTO
        </h3>

        {/* Párrafo Explicativo */}
        <p className="font-sans text-sm sm:text-base md:text-lg text-azul-profundo/90 leading-relaxed font-normal mb-8">
          Radikal 2.0 es un campamento cristiano de jóvenes donde vivirás días
          inolvidables de playa, amistad, enseñanza y propósito. Un espacio para
          desconectarte de la rutina, conectar con Dios y dar el siguiente nivel
          en tu vida.
        </p>

        {/* Asset completo de experiencias reales: fotografía, brochas y tipografía integradas */}
        <div className="relative w-full aspect-[1698/926] mb-10 select-none">
          <Image
            src="/assets/about/radical-worship-transforming-experiences.png"
            alt="Experiencias reales que transforman en Radical 2.0"
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            className="object-contain object-center"
          />
        </div>

        {/* Fila Horizontal de 4 Pilares con Separadores Sutiles */}
        <div className="w-full grid grid-cols-4 divide-x divide-azul-profundo/20 py-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="flex flex-col items-center justify-start text-center px-1 sm:px-3"
            >
              <div className="mb-2 flex items-center justify-center">
                {pillar.icon}
              </div>
              <span className="font-bebas text-xs sm:text-sm md:text-base text-azul-profundo tracking-wider uppercase leading-tight font-normal">
                {pillar.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
