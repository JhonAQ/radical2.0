"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CAMP_CONFIG } from "@/config/site";
import { AnimatedSeabird } from "@/components/common/AnimatedSeabird";
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
const subscribeToMobileQuery = (callback: () => void) => {
  const mediaQuery = window.matchMedia("(max-width: 639px)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};
const getMobileSnapshot = () => window.matchMedia("(max-width: 639px)").matches;

function ExperiencesArtwork({
  className,
  isVisible,
  reduceMotion,
  delay,
}: {
  className: string;
  isVisible: boolean;
  reduceMotion: boolean;
  delay: number;
}) {
  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : -96, scale: reduceMotion ? 1 : 0.94, rotate: reduceMotion ? 0 : -2 }}
        animate={isVisible || reduceMotion ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : { opacity: 0, y: -96, scale: 0.94, rotate: -2 }}
        transition={{ duration: reduceMotion ? 0 : 1.05, delay: reduceMotion ? 0 : delay, ease: [0.18, 0.82, 0.24, 1] }}
        className="relative mb-1 aspect-[1698/926] w-full select-none sm:mb-3"
      >
        <Image
          src="/assets/about/radical-worship-transforming-experiences.png"
          alt="Experiencias reales que transforman en Radical 2.0"
          fill
          sizes="(max-width: 672px) 100vw, (max-width: 1023px) 672px, 492px"
          className="object-contain object-center"
        />
      </motion.div>
    </div>
  );
}

export function CampAbout() {
  const contentRef = useRef<HTMLDivElement>(null);
  const birdsRef = useRef<HTMLDivElement>(null);
  const birdsActive = useInView(birdsRef, { amount: 0.1 });
  const sectionIsInView = useInView(contentRef, { once: true, amount: 0.25, margin: "0px 0px -22% 0px" });
  const reduceMotion = useReducedMotion();
  const isMobile = useSyncExternalStore(subscribeToMobileQuery, getMobileSnapshot, () => false);
  const reveal = (desktopDelay: number, distance = 16, mobileDelay = desktopDelay) => ({
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : distance },
    animate: { opacity: sectionIsInView || reduceMotion ? 1 : 0, y: sectionIsInView || reduceMotion ? 0 : distance },
    transition: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : isMobile ? mobileDelay : desktopDelay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });
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
      id: "encuentro-con-dios",
      label: "ENCUENTRO CON DIOS",
      icon: <CrownIcon className="w-8 h-8 text-[#fcc408]" />,
    },
    {
      id: "amistades-cristianas",
      label: "AMISTADES CRISTIANAS",
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
    <section id="campamento" className="relative isolate z-10 w-full bg-white text-azul-profundo lg:pt-8">
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: 42, rotate: -5 }}
        animate={sectionIsInView ? { opacity: 0.65, y: 0, rotate: -12 } : { opacity: 0, y: 42, rotate: -5 }}
        transition={{ duration: reduceMotion ? 0 : 0.85, delay: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-[45px] top-[68.6%] z-0 hidden h-[390px] w-[140px] -translate-y-1/2 opacity-[0.65] lg:block"
      >
        <Image src="/assets/elements/elem-surfboard-tropical-stripes.webp" alt="" fill sizes="140px" className="object-contain" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, x: -58, y: 8, rotate: -16 }}
        animate={sectionIsInView ? { opacity: 0.65, x: 0, y: 0, rotate: 0 } : { opacity: 0, x: -58, y: 8, rotate: -16 }}
        transition={{ duration: reduceMotion ? 0 : 0.85, delay: 0, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute bottom-[-125px] left-[-14px] z-0 hidden h-[256px] w-[260px] opacity-[0.65] lg:block"
      >
        <Image src="/assets/elements/elem-tropical-bush-large.webp" alt="" fill sizes="260px" className="object-contain" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, x: 54, y: 8, rotate: 16 }}
        animate={sectionIsInView ? { opacity: 0.65, x: 0, y: 0, rotate: 0 } : { opacity: 0, x: 54, y: 8, rotate: 16 }}
        transition={{ duration: reduceMotion ? 0 : 0.85, delay: 0, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute bottom-[-115px] left-[62px] z-0 hidden h-[210px] w-[214px] scale-x-[-1] opacity-[0.65] lg:block"
      >
        <Image src="/assets/elements/elem-tropical-bush-large.webp" alt="" fill sizes="214px" className="object-contain" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: 34 }}
        animate={sectionIsInView ? { opacity: 0.65, y: 0 } : { opacity: 0, y: 34 }}
        transition={{ duration: reduceMotion ? 0 : 0.85, delay: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute right-[-64px] top-auto bottom-[-84px] z-0 hidden h-[384px] w-[245px] origin-bottom scale-x-[-1] rotate-[-10deg] lg:block"
      >
        <Image src="/assets/elements/elem-palm-tree-tall-curved.webp" alt="" fill sizes="245px" className="object-contain" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: 30 }}
        animate={sectionIsInView ? { opacity: 0.65, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.85, delay: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute right-[-64px] bottom-[-64px] z-0 hidden h-[330px] w-[260px] origin-bottom scale-x-[-1] rotate-[8deg] lg:block"
      >
        <Image src="/assets/elements/elem-palm-tree-medium-straight.webp" alt="" fill sizes="260px" className="object-contain" />
      </motion.div>
      {/* ── 02: COUNTDOWN TIMER (Fiel al Moodboard 02-countdown-timer.png) ── */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden px-4 pt-12 pb-8 sm:pt-14 sm:pb-12 lg:hidden">
        {/* Bloque del Título con el fondo de brocha centrado a la altura del texto */}
        <div className="relative flex min-h-[130px] w-full max-w-lg items-center justify-center px-2 py-5 sm:min-h-[140px] sm:max-w-xl sm:px-4 sm:py-7 md:max-w-2xl">
          {/* Fondo de brocha centrado con el texto */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
            <div className="relative w-[217%] sm:w-[115%] h-[313%] sm:h-[210%] translate-y-5 sm:translate-y-6">
              <Image
                src="/assets/textures/countdown-brush-banner.webp"
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 672px"
                className="object-contain object-center pointer-events-none select-none scale-[1.25] sm:scale-100"
              />
            </div>
          </div>

          {/* Título: ahora queda 100% contenido sobre el cuerpo azul de la brocha */}
          <motion.h2 initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: reduceMotion ? 0 : 0.55 }} className="relative z-10 font-edosz text-white text-[clamp(1.375rem,6vw,1.625rem)] sm:text-2xl md:text-3xl uppercase tracking-wider text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] px-2 sm:px-4">
            <span className="block">¡EL SIGUIENTE NIVEL</span>
            <span className="block">TE ESPERA!</span>
          </motion.h2>
        </div>

        {/* Cuenta regresiva sobre una banda translúcida integrada a la brocha */}
        <motion.div initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.12 }} className="relative z-10 -mt-5 rounded-lg bg-[#061e25]/75 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:-mt-4 sm:py-3.5">
          <div className="grid w-[min(288px,calc(100vw-2rem))] grid-cols-4 divide-x divide-white/35 sm:w-[320px]">
            {timeUnits.map((unit) => (
              <div key={unit.label} className="flex min-w-0 flex-col items-center text-center">
                <span className="font-bebas text-4xl leading-none tracking-wide text-white tabular-nums sm:text-5xl">
                  {mounted ? String(unit.value).padStart(2, "0") : "--"}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ── 03: EL CAMPAMENTO ── */}
      <div ref={contentRef} className="relative z-10 mx-auto flex w-full max-w-[800px] flex-col px-5 pt-4 pb-6 sm:px-6 sm:pb-24 lg:min-h-[300px] lg:max-w-[1116px] lg:justify-center lg:gap-y-3 lg:px-0 lg:pt-0 lg:pb-8 xl:max-w-[1200px] xl:px-[38px]">
        <div className="flex w-full max-w-[600px] flex-col lg:w-[calc(100%_-_524px)]">
          {/* Título Principal */}
          <div ref={birdsRef} className="relative">
            <motion.h3 {...reveal(0.2, 14, 0.1)} className="relative z-10 mb-4 -rotate-1 font-edosz text-4xl uppercase tracking-wide text-azul-profundo sm:text-5xl md:text-6xl lg:text-5xl">
              EL CAMPAMENTO
            </motion.h3>
            <AnimatedSeabird
              src="/assets/elements/elem-flying-bird-single-1.webp" style={{}} seed={0}
              revealed={sectionIsInView} active={birdsActive} width={170} height={81}
              sizes="(min-width: 1024px) 80px, (min-width: 640px) 64px, 44px"
              className="pointer-events-none -right-1 -top-7 z-0 w-11 sm:-right-2 sm:-top-9 sm:w-16 lg:right-[3rem] lg:-top-4 lg:w-20"
            />
            <AnimatedSeabird
              src="/assets/elements/elem-flying-bird-single-2.webp" style={{}} seed={1}
              revealed={sectionIsInView} active={birdsActive} width={137} height={62}
              sizes="(min-width: 1024px) 72px, (min-width: 640px) 56px, 36px"
              className="pointer-events-none right-9 -top-9 z-0 w-9 sm:right-12 sm:-top-11 sm:w-14 lg:right-[7rem] lg:-top-5 lg:w-[4.5rem]"
            />
            <AnimatedSeabird
              src="/assets/elements/elem-flying-bird-single-3.webp" style={{}} seed={2}
              revealed={sectionIsInView} active={birdsActive} width={151} height={64}
              sizes="(min-width: 1024px) 72px, (min-width: 640px) 56px, 40px"
              className="pointer-events-none right-[4.5rem] -top-6 z-0 w-10 sm:right-[5.5rem] sm:-top-7 sm:w-14 lg:right-[10rem] lg:-top-2 lg:w-[4.5rem]"
            />
          </div>

          {/* Párrafo Explicativo */}
          <motion.p {...reveal(0.28, 12, 0.42)} className="font-sans text-sm sm:text-base md:text-lg lg:text-base text-azul-profundo/90 leading-relaxed font-normal mb-2 sm:mb-5 lg:mb-0">
            Radikal 2.0 es un campamento cristiano de jóvenes donde vivirás cinco
            días inolvidables en la playa, con amistad, enseñanza y propósito.
            Además, <strong className="font-bold">¡Recibiremos juntos el Año Nuevo 2028!</strong>
            <span className="block">Un espacio para desconectarte de la rutina, conectar con Dios y dar el siguiente nivel
            en tu vida.</span>
          </motion.p>
        </div>

        <ExperiencesArtwork isVisible={sectionIsInView} reduceMotion={Boolean(reduceMotion)} delay={isMobile ? 0.8 : 0.22} className="w-full lg:absolute lg:right-0 lg:top-1/2 lg:w-[492px] lg:max-w-[calc(50%_-_16px)] lg:-translate-y-1/2 xl:right-[38px]" />

        {/* Fila Horizontal de 4 Pilares con Separadores Sutiles */}
        <div className="w-full max-w-[600px] grid grid-cols-4 divide-x divide-azul-profundo/20 py-1 sm:py-2 lg:w-[calc(100%_-_524px)] lg:max-w-[600px]">
          {pillars.map((pillar, index) => (
            <motion.div
              {...reveal(0.2 + index * 0.08, 12, 1.2 + index * 0.1)}
              key={pillar.id}
              className="flex flex-col items-center justify-start text-center px-1 sm:px-3"
            >
              <div key="icon" className="mb-2 flex items-center justify-center">
                {pillar.icon}
              </div>
              <span key="label" className="font-bebas text-xs sm:text-sm md:text-base text-azul-profundo tracking-wider uppercase leading-tight font-normal">
                {pillar.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
