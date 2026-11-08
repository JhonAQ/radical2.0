import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HeroCountdown } from "@/components/hero/HeroCountdown";
import {
  WavesIcon,
  FireIcon,
  UsersGroupIcon,
  LightningIcon,
  ArrowRightIcon,
} from "@/components/common/Icons";
import { CAMP_CONFIG } from "@/config/site";

interface Pillar {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  bgGradient: string;
}

const PILLARS: Pillar[] = [
  {
    id: "playa",
    title: "Playa & Desafíos",
    subtitle: "Arena, olas y adrenalina",
    description:
      "Competencias por tribus, retos físicos en la orilla del mar de Mejía y dinámicas que pondrán a prueba tu espíritu de equipo.",
    icon: <WavesIcon className="w-7 h-7 text-turquesa" />,
    accentColor: "text-turquesa",
    bgGradient: "from-turquesa/15 to-transparent",
  },
  {
    id: "fogatas",
    title: "Noches Radikales",
    subtitle: "Música, plenarias y fuego",
    description:
      "Bajo el cielo costero, viviremos noches intensas de música en vivo, fogatas gigantes y mensajes directos al corazón que marcarán un antes y un después.",
    icon: <FireIcon className="w-7 h-7 text-[#fcc408]" />,
    accentColor: "text-[#fcc408]",
    bgGradient: "from-[#fcc408]/15 to-transparent",
  },
  {
    id: "comunidad",
    title: "Hermandad Real",
    subtitle: "Conexiones sin pantallas",
    description:
      "5 días para desconectarte del celular y reconectar con personas reales. Amistades de toda la vida forjadas en risas, carpas y experiencias compartidas.",
    icon: <UsersGroupIcon className="w-7 h-7 text-naranja" />,
    accentColor: "text-naranja",
    bgGradient: "from-naranja/15 to-transparent",
  },
  {
    id: "nextlevel",
    title: "Next Level",
    subtitle: "Crecimiento y propósito",
    description:
      "No regresas siendo el mismo. Sal de tu zona de confort, descubre tu verdadero potencial y prepárate para arrancar el año viviendo radikalmente.",
    icon: <LightningIcon className="w-7 h-7 text-turquesa" />,
    accentColor: "text-turquesa",
    bgGradient: "from-turquesa/15 to-transparent",
  },
];

export function CampAbout() {
  return (
    <section
      id="campamento"
      className="relative w-full bg-azul-profundo text-white py-16 sm:py-24 lg:py-28 overflow-hidden"
    >
      {/* ── Background Tropical Textures & Moodboard Accents ── */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        {/* Palm Frond Accent - Top Right */}
        <div className="absolute -top-10 -right-16 w-64 sm:w-96 h-64 sm:h-96 opacity-15 rotate-45">
          <Image
            src="/assets/elements/elem-palm-frond-leaf.webp"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Monstera Leaf - Bottom Left */}
        <div className="absolute -bottom-16 -left-16 w-72 sm:w-[420px] h-72 sm:h-[420px] opacity-15 -rotate-12">
          <Image
            src="/assets/elements/elem-monstera-leaf-painted.webp"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Paint Swipe Glow Accent - Center */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 199, 199, 0.25) 0%, rgba(11, 45, 54, 0) 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* ── Transición 1: Countdown Bar ── */}
        <div className="mb-14 sm:mb-20 flex justify-center">
          <div className="w-full max-w-2xl bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <HeroCountdown />
          </div>
        </div>

        {/* ── Encabezado & Manifiesto ── */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          {/* Subtítulo Script estilo Kit de Marca */}
          <span className="font-yellowtail text-2xl sm:text-3xl md:text-4xl text-[#fcc408] tracking-wide block mb-2 drop-shadow-sm">
            Una experiencia que no se repite
          </span>

          {/* Título Principal */}
          <h2 className="font-bebas text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-wider text-white leading-none mb-6">
            ¿QUÉ ES <span className="text-turquesa">RADICAL 2.0</span>?
          </h2>

          {/* Párrafo Manifiesto */}
          <p className="text-crema/90 text-sm sm:text-base md:text-lg leading-relaxed font-sans font-medium">
            Radical 2.0 es el campamento de verano más esperado del sur del Perú.
            Durante <span className="text-white font-bold">5 días y 4 noches</span> en
            las playas de <span className="text-[#fcc408] font-bold">Campel Mejía</span>,
            cientos de jóvenes nos reunimos para desconectar de la rutina, superar
            desafíos extremos, forjar amistades sinceras y encender una pasión que
            llevará tu vida al siguiente nivel.
          </p>
        </div>

        {/* ── Grid de 4 Pilares (Cards sin bordes duros, con soft elevation) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 mb-14 sm:mb-16">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.id}
              className="group relative bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-md rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_14px_45px_rgba(0,0,0,0.4)] hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Soft subtle corner glow on hover */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${pillar.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
              />

              <div className="relative z-10">
                {/* Header Card: Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-white/[0.06] backdrop-blur-md flex items-center justify-center mb-5 shadow-inner">
                  {pillar.icon}
                </div>

                {/* Subtitle / Micro Tag */}
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-crema/60 block mb-1">
                  {pillar.subtitle}
                </span>

                {/* Title */}
                <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wide uppercase mb-3">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-crema/80 text-sm sm:text-base leading-relaxed font-sans">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom Section CTA ── */}
        <div className="text-center pt-2">
          <Link
            href={CAMP_CONFIG.registrationUrl}
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-[#fcc408] hover:bg-[#e6b007] text-azul-profundo font-sans font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(252,196,8,0.45)] hover:shadow-[0_0_30px_rgba(252,196,8,0.75)] hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fcc408]/50"
          >
            <span>Quiero Vivir la Experiencia</span>
            <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
