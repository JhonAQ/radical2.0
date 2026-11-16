"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Mic } from "lucide-react";
import { AnimatedSeabird } from "@/components/common/AnimatedSeabird";
import { SPEAKERS, type Speaker } from "@/config/speakers";
import "./Speakers.css";

const SLIDE_MS = 7000;
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const UI = "/assets/ponentes/ui";

export function Speakers() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealed = useInView(sectionRef, { once: true, amount: 0.2, margin: "0px 0px -15% 0px" });
  const visible = useInView(sectionRef, { amount: 0.35 });
  const reduceMotion = Boolean(useReducedMotion());
  const [{ active, dir }, setState] = useState({ active: 0, dir: 1 });
  const [paused, setPaused] = useState(false);
  const total = SPEAKERS.length;
  const speaker = SPEAKERS[active];
  const running = visible && !paused && !reduceMotion && total > 1;

  const go = (index: number, direction?: number) =>
    setState((prev) => {
      const next = (index + total) % total;
      return { active: next, dir: direction ?? (next >= prev.active ? 1 : -1) };
    });
  const next = () => go(active + 1, 1);
  const prev = () => go(active - 1, -1);

  // Avance automático; cualquier cambio de ponente reinicia el tiempo.
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setState((s) => ({ active: (s.active + 1) % total, dir: 1 })), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [running, active, total]);

  const show = revealed || reduceMotion;
  const reveal = (delay: number, distance = 16) => ({
    initial: reduceMotion ? false : { opacity: 0, y: distance },
    animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    transition: { duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : delay, ease },
  });

  return (
    <section
      ref={sectionRef}
      id="ponentes"
      aria-labelledby="speakers-heading"
      className="speakers relative isolate overflow-hidden text-azul-profundo lg:z-10 lg:-mt-[110px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Decor show={show} reduceMotion={reduceMotion} />
      <AnimatedSeabird src="/assets/elements/elem-flying-bird-single-2.webp" seed={3} revealed={show} active={visible} width={170} height={81} className="z-0 hidden lg:block" style={{ left: "38%", top: "7%", width: 46 }} />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-6 lg:px-10 lg:pb-6 lg:pt-[150px]">
        {/* ── Encabezado + selector ── */}
        <div className="flex flex-col items-start lg:pl-4">
          <motion.h2 id="speakers-heading" {...reveal(0)} className="w-[82%] max-w-[360px] lg:w-[400px] lg:max-w-none">
            <Image src={`${UI}/titulo.webp`} alt="Ellos nos acompañan: Ponentes" width={1000} height={470} sizes="(min-width: 1024px) 400px, 82vw" className="h-auto w-full" />
          </motion.h2>

          <motion.p {...reveal(0.2)} className="mt-4 max-w-md text-[15px] font-bold leading-relaxed text-azul-profundo/85">
            Conoce a quienes compartirán la palabra, su experiencia y una visión radical para nuestra generación.
          </motion.p>

          <motion.ol {...reveal(0.35)} aria-label="Ponentes" className="mt-7 hidden w-full max-w-[340px] flex-col gap-1.5 lg:flex">
            {SPEAKERS.map((item, index) => (
              <li key={item.slug}>
                <SelectorButton speaker={item} active={index === active} onClick={() => go(index)} />
              </li>
            ))}
          </motion.ol>
        </div>

        {/* ── Escenario ── */}
        <div className="relative">
          <Stage speaker={speaker} dir={dir} show={show} reduceMotion={reduceMotion} onPrev={prev} onNext={next} setPaused={setPaused} total={total} />

          <MobileTopic speaker={speaker} />

          {total > 1 && (
            <div className="mt-3 flex justify-center gap-2 lg:mt-1" aria-hidden="true">
              {SPEAKERS.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  tabIndex={-1}
                  onClick={() => go(index)}
                  className={`h-3 w-3 rounded-full border-2 transition-colors ${index === active ? "border-[#0b7893] bg-[#0b7893]" : "border-[#0b7893]/45 bg-transparent"}`}
                />
              ))}
            </div>
          )}

          {/* Selector en móvil */}
          <ol aria-label="Ponentes" className="mt-5 flex flex-col gap-2 lg:hidden">
            {SPEAKERS.map((item, index) => (
              <li key={item.slug}>
                <SelectorButton speaker={item} active={index === active} onClick={() => go(index)} compact />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Flecha del ponente activo: trazo de pincel, no un triángulo geométrico. */
function BrushArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 32" aria-hidden="true" className={className}>
      <path
        d="M4.2 3.1c1.6-.9 3.4.1 5 .9 4.6 2.5 9.4 5.6 14.2 8.6 1.6 1 3.9 2.1 3.7 3.8-.2 1.5-2.1 2.4-3.5 3.3-4.7 2.8-9.1 6.1-13.9 8.6-1.6.8-3.7 1.6-5 .4-1-.9-.9-2.5-.9-3.8.1-5.6-.3-11.2.1-16.8.1-1.8-.6-4 .3-5Z"
        fill="currentColor"
      />
      <path d="M7 7.5c3.4 2 7 4 10.5 6.3" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SelectorButton({ speaker, active, onClick, compact = false }: { speaker: Speaker; active: boolean; onClick: () => void; compact?: boolean }) {
  // Flecha fuera; la foto y el nombre van dentro del brochazo, como en la referencia.
  const thumb = compact ? 58 : 64;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`group relative flex w-full max-w-[330px] items-center text-left outline-none transition-transform focus-visible:-translate-y-0.5 ${compact ? "h-[66px] pl-[42px]" : "h-[72px] pl-[46px]"} ${active ? "" : "hover:-translate-y-0.5"}`}
    >
      <BrushArrow className={`absolute left-0 top-1/2 h-[26px] w-[22px] -translate-y-1/2 text-[#0b8fa0] transition-all duration-300 ${active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`} />
      <span className="absolute inset-y-[3px] left-[28px] right-0 -z-10">
        <Image src={`${UI}/selector-inactivo.webp`} alt="" fill sizes="300px" className={`object-fill transition-opacity duration-300 ${active ? "opacity-0" : "opacity-100"}`} />
        <Image src={`${UI}/selector-activo.webp`} alt="" fill sizes="300px" className={`object-fill transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`} />
      </span>
      <span className={`speakers-thumb speakers-thumb--${speaker.accent} shrink-0`} style={{ width: thumb, height: thumb }}>
        <Image src={speaker.image.src} alt="" width={speaker.image.width} height={speaker.image.height} sizes="72px" className="h-[135%] w-full object-cover object-top" />
      </span>
      <span className="ml-3.5 min-w-0 leading-none">
        <span className="block font-marker text-xs text-[#0b3b47]/70">{speaker.title}</span>
        <span className={`block whitespace-nowrap font-blowbrush uppercase text-[#0b3b47] ${compact ? "text-[1.1rem]" : "text-[1.2rem]"}`}>{speaker.name}</span>
      </span>
    </button>
  );
}

function Decor({ show, reduceMotion }: { show: boolean; reduceMotion: boolean }) {
  const fade = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0 },
    animate: show ? { opacity: 1 } : { opacity: 0 },
    transition: { duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : delay },
  });
  const slide = (from: number, rotate: number, delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, x: `${from}%`, rotate },
    animate: show ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: `${from}%`, rotate },
    transition: { duration: reduceMotion ? 0 : 1.3, delay: reduceMotion ? 0 : delay, ease },
  });
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <motion.div {...slide(-60, -25, 0.1)} className="speakers-sway absolute left-[-4%] top-[-2%] w-[34%] max-w-[260px] sm:w-[24%]">
        <Image src="/assets/elements/elem-palm-frond-leaf.webp" alt="" width={294} height={250} className="h-auto w-full rotate-[200deg] -scale-x-100" />
      </motion.div>
      <motion.div {...slide(60, 25, 0.2)} className="speakers-sway speakers-sway--late absolute right-[-3%] top-[-3%] hidden w-[22%] max-w-[300px] lg:block">
        <Image src="/assets/footer/palma-superior-derecha.webp" alt="" width={1400} height={933} className="h-auto w-full" />
      </motion.div>
      <motion.div {...fade(0.3)} className="absolute left-[-3%] top-[30%] hidden w-[12%] lg:block">
        <Image src="/assets/textures/t1-12-orange-short.webp" alt="" width={375} height={230} className="h-auto w-full rotate-[20deg]" />
      </motion.div>
      <motion.div {...fade(0.35)} className="absolute bottom-[3%] right-[-2%] w-[42%] max-w-[360px] sm:w-[26%]">
        <Image src="/assets/textures/t1-11-teal-diagonal.webp" alt="" width={502} height={267} className="h-auto w-full -rotate-[8deg] opacity-90" />
      </motion.div>
      <motion.div {...fade(0.4)} className="absolute bottom-[12%] right-[10%] hidden w-[14%] lg:block">
        <Image src="/assets/textures/t1-12-orange-short.webp" alt="" width={375} height={230} className="h-auto w-full rotate-[-12deg]" />
      </motion.div>
    </div>
  );
}

function Stage({
  speaker,
  dir,
  show,
  reduceMotion,
  onPrev,
  onNext,
  setPaused,
  total,
}: {
  speaker: Speaker;
  dir: number;
  show: boolean;
  reduceMotion: boolean;
  onPrev: () => void;
  onNext: () => void;
  setPaused: (value: boolean) => void;
  total: number;
}) {
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const enter = (delay: number) => ({ duration: reduceMotion ? 0 : 0.9, delay: reduceMotion ? 0 : delay, ease });
  // En la primera entrada, texto y retrato esperan a que se pinten los brochazos.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!show || settled) return;
    const id = window.setTimeout(() => setSettled(true), 1700);
    return () => window.clearTimeout(id);
  }, [show, settled]);
  const swap = (delay = 0, firstDelay = delay) => ({
    initial: reduceMotion ? false : { opacity: 0, x: dir * 40 },
    animate: show ? { opacity: 1, x: 0 } : { opacity: 0, x: 0 },
    exit: reduceMotion ? undefined : { opacity: 0, x: dir * -30, transition: { duration: 0.25 } },
    transition: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : settled ? delay : firstDelay, ease },
  });

  return (
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Ponente: ${speaker.title} ${speaker.name}`}
      className="speakers-stage @container relative mx-auto aspect-[4/5] w-full max-w-[440px] touch-pan-y select-none sm:aspect-[5/4] sm:max-w-[640px] lg:aspect-[16/11] lg:max-w-[780px]"
      onPointerDown={(event) => { pointer.current = { x: event.clientX, y: event.clientY }; setPaused(true); }}
      onPointerUp={(event) => {
        const start = pointer.current;
        pointer.current = null;
        if (event.pointerType !== "mouse") setPaused(false);
        if (!start) return;
        const dx = event.clientX - start.x;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.2) (dx < 0 ? onNext : onPrev)();
      }}
      onPointerCancel={() => { pointer.current = null; setPaused(false); }}
    >
      {/* 1. Brochazos: la base de toda la composición; asoman a ambos lados del retrato */}
      <div className="pointer-events-none absolute left-[-14%] top-[16%] w-[128%] lg:left-[3%] lg:top-[-8%] lg:w-[101%]">
        <Image src={`${UI}/brushes-fondo.webp`} alt="" width={1300} height={865} sizes="(min-width: 1024px) 700px, 100vw" className={`h-auto w-full ${show ? "speakers-paint speakers-paint--slow" : "opacity-0"}`} style={{ animationDelay: "0.1s" }} />
      </div>

      {/* 2. Sol: detrás de la cabeza, cargado a la derecha; el ponente tapa su parte baja */}
      <div className="pointer-events-none absolute right-[-4%] top-[2%] w-[57.6%] -translate-x-[10px] translate-y-[30px] lg:translate-x-0 lg:translate-y-0 lg:left-[20%] lg:right-auto lg:top-[9%] lg:w-[46.5%]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: "60%", rotate: 50 }}
          animate={show ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: "60%", rotate: 50 }}
          transition={{ duration: reduceMotion ? 0 : 1.4, delay: reduceMotion ? 0 : 0.35, ease }}
        >
          <Image src={`${UI}/sol-rayos.webp`} alt="" width={800} height={783} className="speakers-sun h-auto w-full" />
        </motion.div>
      </div>

      {/* 3. Palmera inclinada; el tronco nace detrás del ponente */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: "-55%", rotate: -28 }}
        animate={show ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: "-55%", rotate: -28 }}
        transition={{ duration: reduceMotion ? 0 : 1.3, delay: reduceMotion ? 0 : 0.2, ease }}
        style={{ transformOrigin: "47% 100%" }}
        className="pointer-events-none absolute left-[12%] top-[7%] w-[56.7%] lg:left-[14%] lg:top-[-2%] lg:w-[36%]"
      >
        <div className="translate-x-[20px] -translate-y-[15px] -rotate-[30deg] lg:translate-y-[5px] lg:-rotate-[20deg]" style={{ transformOrigin: "47% 100%" }}>
          <div className="speakers-sway speakers-sway--slow" style={{ transformOrigin: "47% 100%" }}>
            <Image src="/assets/elements/elem-palm-tree-medium-straight.webp" alt="" width={313} height={398} className="h-auto w-full" />
          </div>
        </div>
      </motion.div>

      {/* 4. Retrato: al centro, cargado a la izquierda */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={speaker.slug}
          {...swap(0.05, 0.5)}
          className="speakers-portrait pointer-events-none absolute inset-x-0 bottom-[16%] z-10 flex justify-center lg:bottom-0 lg:left-[15%] lg:right-[33%] h-[var(--portrait-hm)] lg:h-[var(--portrait-h)]"
          style={{ "--portrait-h": `${speaker.fit * 90}%`, "--portrait-hm": `${(speaker.fit * 90 * (speaker.mobileScale ?? 1)) / 1.2}%` } as React.CSSProperties}
        >
          <Image
            src={speaker.image.src}
            alt={`${speaker.title} ${speaker.name}`}
            width={speaker.image.width}
            height={speaker.image.height}
            sizes="(min-width: 1024px) 460px, 90vw"
            className="h-full w-auto max-w-none"
          />
        </motion.div>
      </AnimatePresence>

      {/* 5. Mochila y farol en primer plano */}
      {/* Arbustos (los de la base de la tabla de surf): asientan la mochila y el farol */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: "-70%", rotate: -20 }}
        animate={show ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: "-70%", rotate: -20 }}
        transition={enter(0.5)}
        className="pointer-events-none absolute bottom-[22%] left-[-8%] z-[4] lg:z-[15] w-[36%] lg:bottom-[-7%] lg:left-[-1%] lg:w-[27%]"
      >
        <Image src="/assets/elements/elem-tropical-bush-large.webp" alt="" width={343} height={337} sizes="220px" className="h-auto w-full" />
      </motion.div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: "70%", rotate: 20 }}
        animate={show ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: "70%", rotate: 20 }}
        transition={enter(0.55)}
        className="pointer-events-none absolute bottom-[24%] right-[-6%] z-[4] lg:z-[15] w-[28%] lg:bottom-[-6%] lg:left-[15%] lg:right-auto lg:w-[22%]"
      >
        <Image src="/assets/elements/elem-tropical-bush-large.webp" alt="" width={343} height={337} sizes="180px" className="h-auto w-full -scale-x-100" />
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: "-120%", rotate: -35 }}
        animate={show ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: "-120%", rotate: -35 }}
        transition={{ type: "spring", stiffness: 70, damping: 13, delay: reduceMotion ? 0 : 0.7 }}
        className="pointer-events-none absolute bottom-[26%] left-[-2%] z-20 w-[32.3%] -translate-x-[20px] translate-y-[45px] lg:bottom-[-2%] lg:translate-x-0 lg:translate-y-0 lg:left-[3%] lg:w-[20.8%]"
      >
        <Image src="/assets/footer/mochila-radical.webp" alt="" width={1199} height={1312} sizes="200px" className="h-auto w-full -rotate-[8deg] drop-shadow-[0_14px_18px_rgba(11,45,54,0.25)]" />
      </motion.div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: "160%", rotate: 35 }}
        animate={show ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: "160%", rotate: 35 }}
        transition={{ type: "spring", stiffness: 70, damping: 13, delay: reduceMotion ? 0 : 0.85 }}
        className="pointer-events-none absolute bottom-[28%] right-[2%] z-20 w-[17.2%] lg:bottom-[0%] lg:left-[22%] lg:right-auto lg:w-[11%]"
      >
        <div className="speakers-glow">
          <Image src="/assets/footer/lampara-radical.webp" alt="" width={933} height={1400} sizes="100px" className="h-auto w-full rotate-[6deg] drop-shadow-[0_12px_16px_rgba(11,45,54,0.25)]" />
        </div>
      </motion.div>

      {/* 6. Corona, nombre y fecha */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={`info-${speaker.slug}`}
          {...swap(0.15, 1.1)}
          className="absolute inset-x-[-2%] bottom-[-3%] z-30 flex flex-col items-center lg:inset-x-auto lg:bottom-auto lg:left-[56%] lg:right-[4%] lg:top-[9%]"
        >
          <div className="relative w-full">
            {/* En móvil el nombre lleva su propio brochazo delante del torso */}
            <Image src={`${UI}/brushes-fondo.webp`} alt="" fill sizes="100vw" className="-z-10 scale-x-110 scale-y-[1.35] object-fill lg:hidden" />
            <div className="relative px-[8%] pb-2 pt-3 text-right lg:p-0 lg:text-center">
              <Image src="/assets/elements/elem-crown-painted-gold.webp" alt="" width={146} height={137} className="mx-auto mb-1 hidden h-auto w-[8cqw] -translate-x-[23px] -rotate-[4deg] lg:block" />
              <div className="-translate-x-[5px] -translate-y-[5px] -rotate-[5deg] lg:translate-x-0 lg:translate-y-0">
              <p className="-translate-x-[5px] -rotate-[3deg] font-marker text-[1.69rem] lg:translate-x-0 leading-none text-white/85 lg:text-[3.45cqw]">{speaker.title}</p>
              <p className="speakers-name whitespace-nowrap font-blowbrush text-[clamp(1.9rem,9.5vw,2.8rem)] uppercase leading-[0.9] text-white lg:whitespace-normal lg:text-[8.6cqw]">
                {speaker.display[0]}
                {speaker.display[1] && <span className="lg:block"> {speaker.display[1]}</span>}
              </p>
              </div>
            </div>
          </div>

          <div className="relative -mt-1 -rotate-[4deg] px-[13%] pb-[3.5%] pt-[4.5%] lg:mt-[2.5cqw] lg:px-[3.6cqw] lg:pb-[1.3cqw] lg:pt-[1.7cqw]">
            <Image src={`${UI}/brush-fecha.webp`} alt="" fill sizes="340px" className={`-z-10 object-fill ${!show ? "opacity-0" : settled ? "" : "speakers-paint"}`} style={{ animationDelay: "0.35s" }} />
            <p className="flex -rotate-[4deg] items-center gap-2 whitespace-nowrap font-marker text-lg leading-none text-[#0b3b47] lg:text-[3.1cqw]">
              <CalendarDays aria-hidden="true" className="h-[1em] w-[1em] shrink-0" strokeWidth={2.4} />
              {speaker.role}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 7. Tema (desktop) */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={`topic-${speaker.slug}`}
          {...swap(0.25, 1.3)}
          className="speakers-topic absolute bottom-[15%] left-[44%] right-[4%] z-30 hidden -rotate-[3deg] px-[5cqw] pb-[4.2cqw] pt-[3.6cqw] lg:block"
        >
          <Image src={`${UI}/brush-tema.webp`} alt="" fill sizes="460px" className={`-z-10 object-fill ${!show ? "opacity-0" : settled ? "" : "speakers-paint"}`} style={{ animationDelay: "0.45s" }} />
          <p className="flex translate-y-[5px] -rotate-[4deg] items-center gap-[1.2cqw] font-marker text-[2.9cqw] leading-tight text-[#0b3b47]">
            <Mic aria-hidden="true" className="h-[1.1em] w-[1.1em] shrink-0" strokeWidth={2.2} />
            {speaker.topic}
          </p>
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <>
          <button type="button" aria-label="Ponente anterior" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={onPrev} className="speakers-arrow left-[0%] lg:left-[-3%]">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" strokeWidth={2.6} />
          </button>
          <button type="button" aria-label="Siguiente ponente" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={onNext} className="speakers-arrow right-[0%] lg:right-[-3%]">
            <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </>
      )}

      <span className="sr-only" aria-live="polite">{`${speaker.title} ${speaker.name}, ${speaker.role}: ${speaker.topic}`}</span>
    </div>
  );
}

function MobileTopic({ speaker }: { speaker: Speaker }) {
  return (
    <div aria-hidden="true" className="mt-8 flex justify-center lg:hidden">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={speaker.slug}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease }}
          className="speakers-topic relative w-[94%] px-[8%] py-[5%]"
        >
          <Image src={`${UI}/brush-tema.webp`} alt="" fill sizes="94vw" className="-z-10 object-fill" />
          <p className="flex -rotate-[2deg] items-center justify-center gap-2 pb-[3%] text-center font-marker text-xl leading-tight text-[#0b3b47]">
            <Mic aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2.2} />
            {speaker.topic}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
