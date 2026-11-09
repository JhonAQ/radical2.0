"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const activities = [
  { title: "PLAYA Y AVENTURA", image: "/assets/activities/beach.jpg", alt: "Jóvenes compartiendo en la playa al atardecer" },
  { title: "ENSEÑANZA Y TALLERES", image: "/assets/activities/workshop.jpg", alt: "Jóvenes participando en un taller en grupo" },
  { title: "ADORACIÓN Y NOCHES ESPECIALES", image: "/assets/activities/worship.jpg", alt: "Jóvenes adorando durante una reunión de Radical" },
  { title: "AMISTAD Y COMUNIDAD", image: "/assets/activities/community.jpg", alt: "Jóvenes compartiendo juntos durante el campamento" },
  { title: "JUEGOS Y DINÁMICAS", image: "/assets/activities/games.jpg", alt: "Jóvenes participando en juegos y dinámicas de grupo" },
];

export function Activities() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slide = (direction: number) => {
    const track = trackRef.current;
    const card = track?.children[0] as HTMLElement | undefined;
    if (!track || !card) return;
    const step = card.offsetWidth + 16;
    const lastPosition = track.scrollWidth - track.clientWidth;
    if (direction < 0 && track.scrollLeft < 1) {
      track.scrollTo({ left: activities.length * step, behavior: "instant" });
    } else if (direction > 0 && track.scrollLeft >= lastPosition - 1) {
      track.scrollTo({ left: lastPosition - activities.length * step, behavior: "instant" });
    }
    requestAnimationFrame(() => {
      track.scrollBy({ left: direction * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  };

  const syncActiveCard = () => {
    const track = trackRef.current;
    const firstCard = track?.children[0] as HTMLElement | undefined;
    if (!track || !firstCard) return;
    const step = firstCard.offsetWidth + 16;
    setActiveIndex(Math.round(track.scrollLeft / step) % activities.length);
  };

  return (
    <section id="actividades" aria-labelledby="activities-heading" className="relative isolate overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
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
        className="-z-10 scale-[1.2] object-cover object-center lg:translate-x-[4%] lg:scale-[1.56]"
      />
      <Image
        src="/assets/activities/leaf-corner-left.png"
        alt=""
        aria-hidden="true"
        width={768}
        height={1024}
        className="pointer-events-none absolute bottom-6 -left-12 z-0 h-48 w-36 object-contain sm:h-64 sm:w-48 lg:bottom-10 lg:h-80 lg:w-60"
      />
      <Image
        src="/assets/activities/leaf-corner-right.png"
        alt=""
        aria-hidden="true"
        width={768}
        height={1024}
        className="pointer-events-none absolute bottom-10 -right-12 z-0 h-48 w-36 object-contain sm:h-64 sm:w-48 lg:bottom-16 lg:h-80 lg:w-60"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-center lg:gap-4">
        <div className="mb-5 flex flex-col items-center lg:mb-0 lg:items-center">
          <h2 id="activities-heading" className="sr-only">Actividades Next Level</h2>
          <Image
            src="/assets/activities/activities-title.png"
            alt=""
            width={1672}
            height={941}
            sizes="(max-width: 1024px) 231px, 215px"
            className="h-auto w-[min(60vw,231px)] drop-shadow-[0_5px_12px_rgba(0,0,0,0.35)] lg:w-[215px]"
          />
          <Image src="/assets/activities/activities-arrow.png" alt="" width={2172} height={724} sizes="169px" className="-mt-3 h-auto w-[min(44vw,169px)]" />
        </div>

        <div className="relative top-2 mx-auto w-[calc(100%-1.5rem)] min-w-0 lg:top-4 lg:max-w-[940px]">
          <div
            ref={trackRef}
            onScroll={syncActiveCard}
            aria-label="Actividades del campamento"
            className="activities-carousel-track relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[...activities, ...activities].map((activity, index) => (
              <article key={`${activity.title}-${index}`} aria-hidden={index >= activities.length ? true : undefined} style={{ clipPath: `url(#activity-organic-${index % 3 === 2 ? "b" : "a"})` }} className="activities-carousel-card relative aspect-[4/5] basis-[77%] shrink-0 snap-start overflow-hidden bg-azul-profundo sm:basis-[238px] lg:basis-[calc((100%_-_4rem)/5)]">
                <Image src={activity.image} alt={activity.alt} fill sizes="(max-width: 640px) 78vw, (max-width: 1024px) 310px, 22vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#031820]/95 via-[#031820]/10 to-transparent" />
                <h3 className="absolute inset-x-3 bottom-4 font-edosz text-lg uppercase leading-tight text-white drop-shadow-md sm:text-xl lg:text-base xl:text-lg">
                  {activity.title}
                </h3>
              </article>
            ))}
          </div>
          <button type="button" onClick={() => slide(-1)} aria-label="Actividad anterior" className="activities-carousel-arrow absolute -left-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-azul-profundo/90 text-white shadow-lg transition-colors hover:bg-turquesa/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amarillo lg:-left-6">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => slide(1)} aria-label="Siguiente actividad" className="activities-carousel-arrow absolute -right-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-azul-profundo/90 text-white shadow-lg transition-colors hover:bg-turquesa/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amarillo lg:-right-6">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m9.5 5 7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="sr-only" aria-live="polite">Actividad {activeIndex + 1} de {activities.length}</span>
        </div>
      </div>
    </section>
  );
}
