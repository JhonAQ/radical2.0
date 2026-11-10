"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";

const MotionImage = motion.create(Image);

const activities = [
  { title: "PLAYA Y AVENTURA", image: "/assets/activities/beach.jpg", alt: "Jóvenes compartiendo en la playa al atardecer" },
  { title: "ENSEÑANZA Y TALLERES", image: "/assets/activities/workshop.jpg", alt: "Jóvenes participando en un taller en grupo" },
  { title: "ADORACIÓN Y NOCHES ESPECIALES", image: "/assets/activities/worship.jpg", alt: "Jóvenes adorando durante una reunión de Radical" },
  { title: "AMISTAD Y COMUNIDAD", image: "/assets/activities/community.jpg", alt: "Jóvenes compartiendo juntos durante el campamento" },
  { title: "JUEGOS Y DINÁMICAS", image: "/assets/activities/games.jpg", alt: "Jóvenes participando en juegos y dinámicas de grupo" },
  { title: "PLAYA AL ATARDECER", image: "/assets/activities/beach-evening.jpg", alt: "Jóvenes reunidos en la playa al atardecer" },
  { title: "TALLERES Y RETOS", image: "/assets/activities/workshop-activity.jpg", alt: "Jóvenes participando juntos en una actividad del campamento" },
  { title: "JUEGOS EN EQUIPO", image: "/assets/activities/group-games.jpg", alt: "Jóvenes jugando en equipo durante el campamento" },
  { title: "ADORACIÓN EN VIVO", image: "/assets/activities/live-worship.jpg", alt: "Banda juvenil tocando en una noche de adoración" },
  { title: "COMUNIDAD DE NOCHE", image: "/assets/activities/night-community.jpg", alt: "Jóvenes compartiendo al aire libre durante la noche" },
];

const MOBILE_CAROUSEL_QUERY = "(max-width: 639px)";

function subscribeToMobileCarousel(onChange: () => void) {
  const query = window.matchMedia(MOBILE_CAROUSEL_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getMobileCarouselSnapshot() {
  return window.matchMedia(MOBILE_CAROUSEL_QUERY).matches;
}

export function Activities() {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionIsInView = useInView(sectionRef, { once: true, amount: 0.2, margin: "0px 0px -20% 0px" });
  const reduceMotion = Boolean(useReducedMotion());
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressCardClickRef = useRef(false);
  const isMobileCarousel = useSyncExternalStore(subscribeToMobileCarousel, getMobileCarouselSnapshot, () => false);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(8);
  const [desktopActiveIndex, setDesktopActiveIndex] = useState(0);
  const activeIndex = isMobileCarousel ? mobileActiveIndex : desktopActiveIndex;
  const [isPaused, setIsPaused] = useState(false);
  const reveal = (delay: number, distance = 18) => ({
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : distance },
    animate: sectionIsInView || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    transition: { duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });

  useEffect(() => {
    if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      if (window.matchMedia("(max-width: 639px)").matches) {
        setMobileActiveIndex((index) => (index + 1) % activities.length);
        return;
      }
      if (window.matchMedia("(min-width: 768px) and (max-width: 1000px)").matches) return;

      const track = trackRef.current;
      const card = track?.children[0] as HTMLElement | undefined;
      if (track && card) track.scrollBy({ left: card.offsetWidth + 16, behavior: "smooth" });
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  const slideMobile = (direction: number) => {
    setMobileActiveIndex((index) => (index + direction + activities.length) % activities.length);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsPaused(true);
    if (event.pointerType !== "touch" || !window.matchMedia("(max-width: 639px)").matches) return;
    touchStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsPaused(false);
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !window.matchMedia("(max-width: 639px)").matches) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    suppressCardClickRef.current = true;
    slideMobile(deltaX < 0 ? 1 : -1);
    window.setTimeout(() => { suppressCardClickRef.current = false; }, 350);
  };

  const handlePointerCancel = () => {
    touchStartRef.current = null;
    setIsPaused(false);
  };

  const slideDesktop = (direction: number) => {
    const track = trackRef.current;
    const card = track?.children[0] as HTMLElement | undefined;
    if (!track || !card) return;
    const step = card.offsetWidth + 16;
    const lastPosition = track.scrollWidth - track.clientWidth;
    if (direction < 0 && track.scrollLeft < 1) {
      track.scrollTo({ left: activities.length * step, behavior: "instant" });
    } else if (direction > 0 && track.scrollLeft >= lastPosition - 1) {
      track.scrollTo({ left: 0, behavior: "instant" });
    }
    track.scrollBy({ left: direction * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  const syncDesktopActiveCard = () => {
    const track = trackRef.current;
    const firstCard = track?.children[0] as HTMLElement | undefined;
    if (!track || !firstCard) return;
    const step = firstCard.offsetWidth + 16;
    setDesktopActiveIndex(Math.round(track.scrollLeft / step) % activities.length);
  };

  return (
    <section ref={sectionRef} id="actividades" aria-labelledby="activities-heading" className="relative isolate overflow-hidden bg-white pt-6 pb-16 sm:py-20 lg:py-24">
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <clipPath id="activity-organic-a" clipPathUnits="objectBoundingBox">
            <path d="M .065 .085 C .31 .06 .65 .025 .93 .012 Q .99 .006 .992 .065 L .985 .93 Q .982 .99 .925 .99 L .075 .985 Q .015 .983 .018 .925 L .022 .15 Q .02 .092 .065 .085 Z" />
          </clipPath>
          <clipPath id="activity-organic-b" clipPathUnits="objectBoundingBox">
            <path d="M .065 .045 C .35 .025 .65 .018 .935 .025 Q .99 .028 .99 .085 L .98 .94 Q .98 .99 .92 .987 L .07 .99 Q .012 .987 .018 .93 L .015 .11 Q .014 .05 .065 .045 Z" />
          </clipPath>
        </defs>
      </svg>
      <Image
        src="/assets/activities/brush-background.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 hidden scale-[1.2] object-cover object-center lg:block lg:translate-x-[4%] lg:scale-[1.56]"
      />
      <Image
        src="/assets/activities/brush-background-mobile.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 scale-x-[1.2] scale-y-[1.1] object-cover object-center lg:hidden"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-14 bg-gradient-to-b from-transparent via-white/35 to-white sm:hidden" />
      <MotionImage
        initial={{ opacity: 0, x: -28, y: 18, scale: 0.92, rotate: -14 }}
        animate={sectionIsInView || reduceMotion ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } : { opacity: 0, x: -28, y: 18, scale: 0.92, rotate: -14 }}
        transition={{ duration: reduceMotion ? 0 : 1.1, delay: reduceMotion ? 0 : 0.14, ease: [0.18, 0.82, 0.24, 1] }}
        src="/assets/activities/leaf-corner-left.png"
        alt=""
        aria-hidden="true"
        width={768}
        height={1024}
        className="pointer-events-none absolute bottom-[182px] -left-3 z-0 h-[13.2rem] w-[10.8rem] object-contain sm:bottom-6 sm:-left-12 sm:h-64 sm:w-48 lg:bottom-10 lg:h-80 lg:w-60"
      />
      <MotionImage
        initial={{ opacity: 0, x: 28, y: 14, scale: 0.92, rotate: 14 }}
        animate={sectionIsInView || reduceMotion ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } : { opacity: 0, x: 28, y: 14, scale: 0.92, rotate: 14 }}
        transition={{ duration: reduceMotion ? 0 : 1.1, delay: reduceMotion ? 0 : 0.34, ease: [0.18, 0.82, 0.24, 1] }}
        src="/assets/activities/leaf-corner-right.png"
        alt=""
        aria-hidden="true"
        width={768}
        height={1024}
        className="pointer-events-none absolute bottom-[182px] -right-3 z-0 h-[13.2rem] w-[10.8rem] object-contain sm:bottom-6 sm:-right-12 sm:h-64 sm:w-48 lg:bottom-16 lg:h-80 lg:w-60"
      />
      <div className="relative z-10 mx-auto max-w-7xl translate-y-5 px-5 sm:translate-y-0 sm:px-8 lg:grid lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-center lg:gap-4">
        <motion.div
          initial={{ opacity: reduceMotion ? 1 : 0, clipPath: reduceMotion ? "inset(0 0 0 0)" : "inset(0 100% 0 0)" }}
          animate={sectionIsInView || reduceMotion ? { opacity: 1, clipPath: "inset(0 0 0 0)" } : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          transition={{ duration: reduceMotion ? 0 : 1.05, delay: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative top-10 mx-auto mb-5 flex w-fit flex-col items-center sm:top-0 lg:mb-0 lg:items-center"
        >
          <h2 id="activities-heading" className="sr-only">Actividades Next Level</h2>
          <Image
            src="/assets/activities/activities-title.png"
            alt=""
            width={1672}
            height={941}
            sizes="(max-width: 1024px) 231px, 215px"
            className="h-auto w-[min(48vw,190px)] drop-shadow-[0_2px_8px_rgba(3,24,32,0.9)] sm:w-[min(60vw,231px)] lg:w-[215px]"
          />
          <Image src="/assets/activities/activities-arrow.png" alt="" width={2172} height={724} sizes="169px" className="-mt-2 h-auto w-[min(32vw,130px)] sm:-mt-3 sm:w-[min(44vw,169px)]" />
        </motion.div>

        <motion.div
          {...reveal(0.42, 20)}
          className="relative top-2 mx-auto w-full min-w-0 lg:top-4 lg:max-w-[940px]"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={() => setIsPaused(false)}
        >
          <div className="relative mx-auto h-[280px] w-full touch-pan-y overflow-visible sm:hidden" aria-label="Actividades del campamento" style={{ perspective: 1200 }}>
            {activities.map((activity, index) => {
              const forwardOffset = (index - activeIndex + activities.length) % activities.length;
              const relativeOffset = forwardOffset > Math.floor(activities.length / 2) ? forwardOffset - activities.length : forwardOffset;
              const distance = Math.abs(relativeOffset);
              const isCenter = relativeOffset === 0;

              return (
                <motion.article
                  key={activity.title}
                  onClick={() => {
                    if (suppressCardClickRef.current) {
                      suppressCardClickRef.current = false;
                      return;
                    }
                    if (!isCenter) setMobileActiveIndex(index);
                  }}
                  initial={false}
                  animate={{
                    x: `calc(-50% + ${relativeOffset * 28.6}vw)`,
                    y: "-50%",
                    scale: isCenter ? 1 : 0.8,
                    opacity: distance > 1 ? 0 : 1,
                    rotateY: relativeOffset * 8,
                    rotateZ: relativeOffset * 1.2,
                  }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{ left: "50%", top: "50%", zIndex: 20 - distance, clipPath: `url(#activity-organic-${index % 3 === 2 ? "b" : "a"})` }}
                  className="absolute aspect-[4/5] w-[min(52vw,200px)] cursor-pointer overflow-hidden bg-azul-profundo shadow-[0_18px_40px_rgba(0,0,0,0.4)] [backface-visibility:hidden]"
                  aria-hidden={!isCenter}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 14 }}
                    animate={sectionIsInView || reduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.92, y: 14 }}
                    transition={{ duration: reduceMotion ? 0 : 0.72, delay: reduceMotion ? 0 : 0.38 + (relativeOffset === 0 ? 0 : relativeOffset < 0 ? 0.16 : 0.32), ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Image src={activity.image} alt={activity.alt} fill sizes="200px" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#031820]/95 via-[#031820]/10 to-transparent" />
                    <h3 className="absolute inset-x-4 bottom-4 px-1 text-center font-edosz text-[13px] uppercase leading-tight text-white drop-shadow-md">
                      {activity.title}
                    </h3>
                  </motion.div>
                </motion.article>
              );
            })}
            <button type="button" onClick={() => slideMobile(-1)} aria-label="Actividad anterior" className="activities-carousel-arrow absolute left-[calc(50%_-_120px)] top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-azul-profundo/90 text-white shadow-lg">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={() => slideMobile(1)} aria-label="Siguiente actividad" className="activities-carousel-arrow absolute right-[calc(50%_-_120px)] top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-azul-profundo/90 text-white shadow-lg">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m9.5 5 7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div
            ref={trackRef}
            onScroll={syncDesktopActiveCard}
            aria-label="Actividades del campamento"
            className="activities-carousel-track relative hidden snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex"
          >
            {[...activities, ...activities].map((activity, index) => (
              <motion.article
                key={`${activity.title}-${index}`}
                initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
                animate={sectionIsInView || reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.97 }}
                whileHover={reduceMotion ? undefined : { scale: 1.035, y: -5, zIndex: 5, boxShadow: "0 18px 36px rgba(3, 24, 32, 0.28)" }}
                transition={{ duration: reduceMotion ? 0 : 0.68, delay: reduceMotion ? 0 : 0.38 + (index % activities.length) * 0.14, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden={index >= activities.length ? true : undefined}
                className="activities-carousel-card group relative aspect-[4/5] basis-[238px] shrink-0 snap-start overflow-hidden bg-azul-profundo lg:basis-[calc((100%_-_4rem)/5)]"
                style={{ clipPath: `url(#activity-organic-${index % 3 === 2 ? "b" : "a"})` }}
              >
                <Image src={activity.image} alt={activity.alt} fill sizes="(max-width: 640px) 200px, (max-width: 1024px) 310px, 22vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045] motion-reduce:transition-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#031820]/95 via-[#031820]/10 to-transparent" />
                <h3 className="absolute inset-x-3 bottom-3 max-w-[calc(100%-1.5rem)] font-edosz text-[13px] uppercase leading-tight text-white drop-shadow-md sm:inset-x-3 sm:bottom-4 sm:text-xl lg:text-base xl:text-lg">
                  {activity.title}
                </h3>
              </motion.article>
            ))}
          </div>
          <button type="button" onClick={() => slideDesktop(-1)} aria-label="Actividad anterior" className="activities-carousel-arrow absolute -left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-azul-profundo/90 text-white shadow-lg transition-colors hover:bg-turquesa/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amarillo sm:flex lg:-left-6">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => slideDesktop(1)} aria-label="Siguiente actividad" className="activities-carousel-arrow absolute -right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-azul-profundo/90 text-white shadow-lg transition-colors hover:bg-turquesa/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amarillo sm:flex lg:-right-6">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m9.5 5 7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="sr-only" aria-live="polite">Actividad {activeIndex + 1} de {activities.length}</span>
        </motion.div>
      </div>
    </section>
  );
}
