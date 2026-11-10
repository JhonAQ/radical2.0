"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { BadgeCheck, BusFront, Layers3, MapPin, UsersRound, Wallet } from "lucide-react";
import { CAMP_CONFIG } from "@/config/site";
import { FooterBeachScene } from "@/components/layout/FooterBeachScene";
import { AnimatedSeabird } from "@/components/common/AnimatedSeabird";
import "./LocationFaq.css";

const questions = [
  { question: "¿Desde dónde saldremos?", answer: "La salida hacia el campamento será desde Arequipa. El punto de encuentro y la hora se comunicarán para esta edición.", icon: BusFront },
  { question: "¿Puedo pagar por partes?", answer: "¡Sí! Puedes reservar tu cupo con S/50 y completar el saldo antes del inicio del campamento. Si reservas hasta el 15 de diciembre, aprovechas el precio de preventa de S/200.", icon: Wallet },
  { question: "¿Qué incluye el precio?", answer: "Incluye hospedaje, alimentación completa, programación y materiales, y acceso a todas las actividades del campamento.", icon: BadgeCheck },
  { question: "¿La preventa incluye lo mismo que el precio regular?", answer: "Sí. Ambas tarifas incluyen la misma experiencia. La diferencia es el precio según la fecha en que te inscribas.", icon: Layers3 },
  { question: "¿Hay límite de edad?", answer: "El campamento está pensado para adolescentes y jóvenes. No hay un límite superior de edad: si quieres vivir esta experiencia, eres bienvenido.", icon: UsersRound },
];

const entranceEase = [0.22, 1, 0.36, 1] as const;
const revealViewport = { once: true, amount: 0.3, margin: "0px 0px -16% 0px" } as const;

function FaqBirds() {
  const birdsRef = useRef<HTMLDivElement>(null);
  const revealed = useInView(birdsRef, { once: true, amount: 0.25, margin: "0px 0px -12% 0px" });
  const active = useInView(birdsRef, { amount: 0.05 });
  return (
    <div ref={birdsRef} aria-hidden="true" className="faq-ambient-birds">
      <AnimatedSeabird src="/assets/elements/elem-flying-bird-single-1.webp" style={{ right: 4, top: 4, width: 48 }} seed={0} revealed={revealed} active={active} />
      <AnimatedSeabird src="/assets/elements/elem-flying-bird-single-3.webp" style={{ right: 48, top: 32, width: 32 }} width={151} height={64} seed={3} revealed={revealed} active={active} />
    </div>
  );
}

function SectionHeading({ id, text, tone }: { id: string; text: string; tone: "yellow" | "teal" }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inView = useInView(headingRef, revealViewport);
  const reduceMotion = useReducedMotion();
  const revealed = inView || Boolean(reduceMotion);
  return (
    <h2 ref={headingRef} data-revealed={revealed} id={id} aria-label={text} className={`location-heading location-heading--${tone} font-edosz uppercase leading-none`}>
      <motion.span initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(-18% 100% -18% -8%)" }} animate={revealed ? { opacity: 1, clipPath: "inset(-18% -8% -18% -8%)" } : { opacity: 0, clipPath: "inset(-18% 100% -18% -8%)" }} transition={{ duration: reduceMotion ? 0 : 0.8, ease: entranceEase }} aria-hidden="true" className="relative z-10 inline-flex whitespace-nowrap">
        {Array.from(text).map((letter, index) => <span key={index} style={{ transform: `translateY(${((text.length - 1) / 2 - index) * 0.035}em) rotate(-4deg)` }}>{letter === " " ? "\u00a0" : letter}</span>)}
      </motion.span>
    </h2>
  );
}

export function LocationFaq() {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const faqId = useId();
  const reduceMotion = Boolean(useReducedMotion());
  const reveal = (delay = 0, distance = 14) => ({
    initial: reduceMotion ? false as const : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: revealViewport,
    transition: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : delay, ease: entranceEase },
  });
  const mapQuery = encodeURIComponent("Campamento Evangélico Luterano CAMPEL, Mejía, Arequipa, Perú");
  const mapsUrl = "https://maps.app.goo.gl/Bxj6DFZEWZcazhh59";

  return (
    <div className="location-faq-section relative isolate bg-white text-azul-profundo">
      <div className="location-content relative z-10 mx-auto flex max-w-[1500px] flex-col gap-16 px-5 pt-16 pb-5 sm:px-8 sm:pt-20 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:px-12 lg:pt-16 lg:pb-36 xl:gap-16">
        <section id="lugar" aria-labelledby="location-heading" className="min-w-0 scroll-mt-40 lg:border-r lg:border-azul-profundo/20 lg:pr-8">
          <div aria-hidden="true" className="location-brush-background">
            <Image src="/assets/activities/brush-background-mobile.png" alt="" fill sizes="100vw" className="object-cover object-center" style={{ transform: "translateY(-37px) scaleX(1.2) scaleY(1.1)" }} />
            <div className="location-brush-fade" />
          </div>
          <SectionHeading id="location-heading" text="¿Dónde será?" tone="yellow" />
          <motion.div {...reveal(0.12)} className="mb-5 flex items-center gap-3 lg:mb-4">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 shrink-0 text-[#00aeb8]"><path fillRule="evenodd" d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8Zm0 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
            <div><h3 className="text-xl font-bold">Campamento Evangélico Luterano (CAMPEL)</h3><p className="mt-0.5 font-bebas text-lg tracking-wide text-azul-profundo/65">{CAMP_CONFIG.location.city}, {CAMP_CONFIG.location.region}</p></div>
          </motion.div>
          <div className="location-visuals">
            <motion.div {...reveal(0.14, 20)} initial={reduceMotion ? false : { opacity: 0, y: 20, rotate: -4 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} className="min-w-0">
              <div className="location-photo" aria-label="Campamento nocturno en CAMPEL">
                <Image src="/assets/location/campel-noche.webp" alt="Mesas iluminadas durante una noche de campamento en CAMPEL" fill sizes="(min-width: 1024px) 260px, (min-width: 768px) 45vw, 90vw" className="object-cover object-center" />
              </div>
            </motion.div>
            <motion.div {...reveal(0.28, 16)} initial={reduceMotion ? false : { opacity: 0, y: 16, rotate: 4 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} className="min-w-0">
              <div className="location-map overflow-hidden rounded-xl border border-azul-profundo/10 bg-[#e8f2f1] shadow-[0_8px_28px_rgba(9,47,57,0.08)]">
                <iframe title="Mapa de Campel Mejía en Google Maps" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="block h-64 w-full border-0 sm:h-80 lg:h-full" />
              </div>
            </motion.div>
          </div>
          <motion.a {...reveal(0.1, 12)} whileTap={reduceMotion ? undefined : { scale: 0.98 }} href={mapsUrl} target="_blank" rel="noopener noreferrer" className="location-map-link mt-4 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-azul-profundo px-5 py-3 font-bebas text-xl tracking-wide text-white transition-colors hover:bg-[#105466] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00aeb8] sm:w-auto">
            <MapPin aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />Ver ubicación en Google Maps<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
          </motion.a>
        </section>

        <section id="faq" aria-labelledby="faq-heading" className="min-w-0 scroll-mt-40">
          <FaqBirds />
          <SectionHeading id="faq-heading" text="¿Tienes preguntas?" tone="teal" />
          <motion.p {...reveal(0.12, 10)} className="mb-5 text-sm leading-relaxed text-azul-profundo/70 sm:text-base">Todo lo esencial para preparar tu próxima experiencia radical.</motion.p>
          <div className="location-faq-list">
            {questions.map(({ question, answer, icon: Icon }, index) => {
              const expanded = activeQuestion === index;
              const buttonId = `${faqId}-question-${index}`;
              const panelId = `${faqId}-answer-${index}`;
              return (
                <motion.div {...reveal(index * 0.06, 10)} key={question} className="location-faq-item" data-expanded={expanded}>
                  <h3 key="question">
                    <button type="button" id={buttonId} aria-expanded={expanded} aria-controls={panelId} onClick={() => setActiveQuestion((current) => current === index ? null : index)} className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-1 text-left text-sm font-semibold transition-colors hover:text-[#008c97] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#00aeb8] sm:text-base">
                      <Icon aria-hidden="true" className="hidden h-6 w-6 shrink-0 text-azul-profundo lg:block" strokeWidth={2.2} />
                      <span className="flex-1">{question}</span>
                      <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-azul-profundo transition-colors motion-reduce:transition-none ${expanded ? "bg-[#ffbf00]" : "bg-[#ffbf00]/20"}`}>
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                          <path d="M4 10h12" />
                          <motion.path d="M10 4v12" initial={false} animate={{ scaleY: expanded ? 0 : 1 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} style={{ transformOrigin: "10px 10px" }} />
                        </svg>
                      </span>
                    </button>
                  </h3>
                  <div key="answer-region" id={panelId} role="region" aria-labelledby={buttonId} aria-hidden={!expanded}>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div key="answer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { duration: reduceMotion ? 0 : 0.28, ease: entranceEase }, opacity: { duration: reduceMotion ? 0 : 0.18 } }} className="overflow-hidden">
                          <p className="px-4 pb-3 pt-1 text-sm leading-relaxed text-azul-profundo/75 lg:pl-[3.25rem]">{answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
      <FooterBeachScene />
    </div>
  );
}
