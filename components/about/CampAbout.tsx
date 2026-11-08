"use client";

import React, { useEffect, useState } from "react";
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

export function CampAbout() {
  const [timeLeft, setTimeLeft] = useState<TimeUnits>({
    days: 45,
    hours: 12,
    minutes: 36,
    seconds: 20,
  });

  useEffect(() => {
    const target = new Date(CAMP_CONFIG.targetCountdownDate).getTime();

    const calculateTime = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
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
    <section id="campamento" className="w-full bg-[#f8f1e3] text-azul-profundo">
      {/* ── 02: COUNTDOWN TIMER (Fiel al Moodboard 02-countdown-timer.png) ── */}
      <div className="relative w-full pt-12 pb-8 sm:pt-16 sm:pb-12 px-4 flex justify-center overflow-hidden">
        {/* Banner de pincelada azul marino con salpicaduras */}
        <div className="relative w-full max-w-xl py-8 px-6 sm:px-10 flex flex-col items-center">
          {/* Fondo de brocha decorativo */}
          <div className="absolute inset-0 -z-0">
            <Image
              src="/assets/textures/t3-03-navy-splatter-banner.webp"
              alt=""
              fill
              className="object-cover object-center scale-105"
              priority
            />
          </div>

          {/* Título sobre el banner de brocha */}
          <h2 className="relative z-10 font-edosz text-white text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-center -rotate-1 drop-shadow-md mb-4">
            — EL SIGUIENTE NIVEL TE ESPERA —
          </h2>

          {/* Pastilla del Timer con separadores verticales */}
          <div className="relative z-10 bg-azul-profundo/85 backdrop-blur-sm rounded-xl py-3 px-4 sm:px-8 shadow-xl flex items-center justify-center divide-x divide-white/20">
            {timeUnits.map((unit) => (
              <div
                key={unit.label}
                className="px-3 sm:px-5 flex flex-col items-center text-center first:pl-1 last:pr-1"
              >
                <span className="font-bebas text-3xl sm:text-4xl md:text-5xl text-white font-normal leading-none tracking-wider">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-widest mt-0.5">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 03: EL CAMPAMENTO (Fiel al Moodboard 03-que-es-campamento.png) ── */}
      <div className="w-full max-w-2xl mx-auto px-5 sm:px-6 pt-4 pb-16 sm:pb-24 flex flex-col">
        {/* Título Principal */}
        <h3 className="font-edosz text-4xl sm:text-5xl md:text-6xl text-azul-profundo uppercase tracking-wider -rotate-1 mb-4">
          EL CAMPAMENTO
        </h3>

        {/* Párrafo Explicativo */}
        <p className="font-sans text-sm sm:text-base md:text-lg text-azul-profundo/90 leading-relaxed font-normal mb-8">
          Radikal 2.0 es un campamento cristiano de jóvenes donde vivirás días
          inolvidables de playa, amistad, enseñanza y propósito. Un espacio para
          desconectarte de la rutina, conectar con Dios y dar el siguiente nivel
          en tu vida.
        </p>

        {/* Imagen Mock / Placeholder con Máscara de Pincel Texturizada */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] mb-10 select-none">
          {/* Contenedor enmascarado con la silueta de brocha orgánica */}
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              maskImage: "url('/assets/textures/brush-mask-hero.png')",
              WebkitMaskImage: "url('/assets/textures/brush-mask-hero.png')",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
            }}
          >
            {/* Imagen de fondo (placeholder reemplazable) */}
            <Image
              src="/assets/hero/hero-desktop.webp"
              alt="Experiencia en el campamento"
              fill
              className="object-cover object-center"
            />

            {/* Sutil viñeta para contraste del texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-azul-profundo/70 via-transparent to-black/10" />
          </div>

          {/* Brocha de acento amarillo diagonal sobresaliendo por la derecha inferior */}
          <div className="absolute -bottom-5 right-0 w-[60%] h-14 sm:h-20 pointer-events-none rotate-2 opacity-95 z-10">
            <Image
              src="/assets/textures/t1-04-yellow-horizontal.webp"
              alt=""
              fill
              className="object-contain object-right-bottom"
            />
          </div>

          {/* Brocha de acento turquesa en la izquierda inferior */}
          <div className="absolute -bottom-4 left-6 sm:left-10 w-[45%] h-12 sm:h-16 pointer-events-none -rotate-2 opacity-90 z-10">
            <Image
              src="/assets/textures/t1-06-cyan-horizontal.webp"
              alt=""
              fill
              className="object-contain object-left-bottom"
            />
          </div>

          {/* Texto Brush superpuesto en la esquina inferior izquierda */}
          <div className="absolute bottom-5 left-4 sm:bottom-7 sm:left-7 z-20 max-w-[85%] pointer-events-none">
            <p className="font-edosz text-white text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider leading-none -rotate-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              EXPERIENCIAS REALES
            </p>
            <p className="font-edosz text-white text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider leading-none -rotate-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] mt-1">
              QUE TRANSFORMAN
            </p>
          </div>
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
