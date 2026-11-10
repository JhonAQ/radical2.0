"use client";

import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { BookOpen, Flame, Sun, UsersRound, Waves } from "lucide-react";
import { useRef } from "react";

const days = [
  {
    day: "DÍA 1",
    title: "Llegada y encuentro",
    description: "Bienvenida, juegos, comunidad",
    color: "bg-[#ffb900]",
    icon: Sun,
  },
  {
    day: "DÍA 2",
    title: "Enseñanzas que desafían",
    description: "Tiempos con Dios y talleres",
    color: "bg-[#009fb1]",
    icon: BookOpen,
  },
  {
    day: "DÍA 3",
    title: "Vida en comunidad",
    description: "Deportes, dinámicas y playa",
    color: "bg-azul-profundo",
    icon: UsersRound,
  },
  {
    day: "DÍA 4",
    title: "Naturaleza que renueva",
    description: "Salida, aventura y reflexión",
    color: "bg-[#00bdbb]",
    icon: Waves,
  },
  {
    day: "DÍA 5",
    title: "Un propósito más grande",
    description: "Cierre y envío",
    color: "bg-[#ff4a1f]",
    icon: Flame,
  },
] as const;

export function ProgramDays() {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionIsInView = useInView(sectionRef, { once: true, amount: 0.16, margin: "0px 0px -16% 0px" });
  const reduceMotion = Boolean(useReducedMotion());

  const reveal = (delay: number, distance = 12) => ({
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : distance },
    animate: sectionIsInView || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    transition: { duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });

  return (
    <section ref={sectionRef} id="programa" aria-labelledby="program-heading" className="relative z-20 isolate bg-white px-5 pt-16 pb-[12px] text-azul-profundo sm:px-8 sm:py-20 lg:min-w-0 lg:bg-transparent lg:px-0 lg:py-0">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={sectionIsInView || reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.28 }}
        className="pointer-events-none absolute right-[40px] top-[68px] z-0 w-28 sm:right-[-57px] sm:top-[18px] sm:w-36 lg:hidden"
      >
        <motion.div
          animate={sectionIsInView && !reduceMotion ? { y: [0, -4, 0], rotate: [0, 1, 0] } : { y: 0, rotate: 0 }}
          transition={{ duration: reduceMotion ? 0 : 6.5, delay: reduceMotion ? 0 : 1.1, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        >
          <Image src="/assets/elements/elem-crown-painted-gold.webp" alt="" width={145} height={137} className="h-auto w-full rotate-12 opacity-70" />
        </motion.div>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-6xl lg:max-w-[300px]">
        <motion.div
          initial={reduceMotion ? { opacity: 1, clipPath: "inset(0 0 0 0)" } : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={sectionIsInView || reduceMotion ? { opacity: 1, clipPath: "inset(0 0 0 0)" } : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          transition={{ duration: reduceMotion ? 0 : 0.78, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 lg:mb-8 lg:text-center"
        >
          <h2 id="program-heading" className="font-blowbrush text-4xl uppercase leading-none sm:text-5xl lg:text-5xl">Programa</h2>
          <p className="mt-4 max-w-[12rem] font-blowbrush text-[1.55rem] uppercase leading-[1.08] text-[#f0522d] sm:max-w-sm sm:text-3xl lg:mx-auto lg:mt-3 lg:max-w-none lg:text-xl">
            Cinco días<span className="hidden lg:inline"> </span><br className="lg:hidden" />que marcarán<span className="hidden lg:inline"> </span><br className="lg:hidden" />tu historia
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            aria-hidden="true"
            initial={{ scaleY: reduceMotion ? 1 : 0 }}
            animate={{ scaleY: sectionIsInView || reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.68, delay: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[83px] top-8 bottom-8 w-px origin-top bg-azul-profundo/25 sm:left-[99px] lg:left-[73px]"
          />
          <ol className="relative flex flex-col gap-3 sm:gap-5 lg:gap-3">
            {days.map((item, index) => {
              const Icon = item.icon;
              const markerDelay = 0.78 + index * 0.18;
              return (
                <li key={item.day} className="relative grid min-h-[76px] grid-cols-[64px_16px_minmax(0,1fr)] items-center gap-3 sm:min-h-[88px] sm:grid-cols-[80px_16px_minmax(0,1fr)] lg:min-h-[72px] lg:grid-cols-[56px_12px_minmax(0,1fr)] lg:gap-3">
                  <motion.div
                    initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.68 }}
                    animate={sectionIsInView || reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.68 }}
                    transition={{ type: "spring", stiffness: 240, damping: 19, delay: reduceMotion ? 0 : markerDelay }}
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_3px_0_rgba(11,45,54,0.18)] sm:h-16 sm:w-16 lg:h-12 lg:w-12 ${item.color}`}
                  >
                    <Icon aria-hidden="true" className="h-[25px] w-[25px] sm:h-7 sm:w-7" strokeWidth={2.2} />
                  </motion.div>
                  <motion.span
                    aria-hidden="true"
                    initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
                    animate={sectionIsInView || reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
                    transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : markerDelay }}
                    className={`z-10 h-2 w-2 justify-self-center rounded-full ${item.day === "DÍA 4" || item.day === "DÍA 5" ? "bg-[#ff5a2a]" : "bg-[#0b7893]"}`}
                  />
                  <motion.div
                    {...reveal(markerDelay + 0.1, 8)}
                    className="min-w-0 leading-tight"
                  >
                    <span className="font-bebas text-base tracking-wide sm:text-lg">{item.day}</span>
                    <h3 className="font-sans text-sm font-bold sm:text-base">{item.title}</h3>
                    <p className="mt-0.5 font-sans text-xs text-azul-profundo/75 sm:text-sm">{item.description}</p>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
