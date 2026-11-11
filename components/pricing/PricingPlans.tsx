"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import "./PricingPlans.css";

const plans = [
  { name: "Preventa", price: "200", date: "Hasta el 15 de diciembre", brush: "/assets/elements/brush-planes-amarillo.png" },
  { name: "Regular", price: "250", date: "Desde el 16 de diciembre", brush: "/assets/elements/brush-planes-turquesa.png" },
] as const;

const benefits = ["Hospedaje", "Alimentación completa", "Programación y materiales", "Acceso a todas las actividades"];
const MotionImage = motion.create(Image);
const entranceEase = [0.22, 1, 0.36, 1] as const;

function RisingLine({ text, className = "justify-center" }: { text: string; className?: string }) {
  return (
    <span className={`flex whitespace-nowrap ${className}`}>
      {Array.from(text).map((letter, index) => (
        <span key={index} className="inline-block" style={{ transform: `translateY(${((text.length - 1) / 2 - index) * 0.045 + Math.sin(index * 0.85) * 0.018}em) rotate(${-5 + Math.sin(index * 0.8) * 2}deg)` }}>
          {letter === " " ? "\u00a0" : letter}
        </span>
      ))}
    </span>
  );
}

function Benefits({ className = "", animated = false }: { className?: string; animated?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <ul className={className}>
      {benefits.map((benefit, index) => (
        <motion.li key={benefit} initial={animated && !reduceMotion ? { opacity: 0, x: 12 } : false} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5, margin: "0px 0px -12% 0px" }} transition={{ duration: reduceMotion ? 0 : 0.5, delay: animated && !reduceMotion ? index * 0.1 : 0, ease: entranceEase }} className="flex items-start gap-1.5 text-[11px] leading-[1.1] sm:text-sm lg:gap-3 lg:text-base lg:font-semibold lg:leading-tight">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#00aeb8] lg:h-6 lg:w-6 lg:rounded-full lg:bg-[#ffbf00] lg:p-1 lg:text-azul-profundo" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>
          <span>{benefit}</span>
        </motion.li>
      ))}
    </ul>
  );
}

function PlanCardWatermark() {
  return (
    <span className="pricing-plan-watermark" aria-hidden="true">
      <span className="pricing-plan-watermark-birds">
        <Image className="pricing-plan-bird pricing-plan-bird-1" src="/assets/elements/elem-flying-bird-single-1.webp" alt="" width={170} height={81} sizes="25px" />
        <Image className="pricing-plan-bird pricing-plan-bird-2" src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} sizes="18px" />
        <Image className="pricing-plan-bird pricing-plan-bird-3" src="/assets/elements/elem-flying-bird-single-3.webp" alt="" width={151} height={64} sizes="17px" />
        <Image className="pricing-plan-bird pricing-plan-bird-4" src="/assets/elements/elem-flying-bird-single-4.webp" alt="" width={154} height={71} sizes="15px" />
        <Image className="pricing-plan-bird pricing-plan-bird-5" src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} sizes="14px" />
      </span>
      <span className="pricing-plan-watermark-vegetation">
        <Image className="pricing-plan-plant pricing-plan-plant-bush" src="/assets/elements/elem-tropical-bush-large.webp" alt="" width={343} height={337} sizes="100px" />
        <Image className="pricing-plan-plant pricing-plan-plant-frond" src="/assets/elements/elem-palm-frond-leaf.webp" alt="" width={294} height={250} sizes="80px" />
        <Image className="pricing-plan-plant pricing-plan-plant-leaf" src="/assets/elements/elem-tropical-leaf-green-yellow.webp" alt="" width={331} height={183} sizes="90px" />
        <Image className="pricing-plan-plant pricing-plan-plant-palm" src="/assets/elements/elem-palm-tree-tall-curved.webp" alt="" width={346} height={544} sizes="100px" />
        <Image className="pricing-plan-plant pricing-plan-plant-flower" src="/assets/elements/elem-hibiscus-flower-red.webp" alt="" width={197} height={183} sizes="35px" />
      </span>
    </span>
  );
}

export function PricingPlans() {
  const router = useRouter();
  const headingRef = useRef<HTMLDivElement>(null);
  const headingVisible = useInView(headingRef, { once: true, amount: 0.4, margin: "0px 0px -18% 0px" });
  const reduceMotion = Boolean(useReducedMotion());
  const showHeading = headingVisible || reduceMotion;
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number]["name"] | null>(null);
  const selectedPlanDetails = plans.find((plan) => plan.name === selectedPlan);

  return (
    <section id="inscribirme" aria-labelledby="pricing-heading" className="relative isolate bg-white px-4 py-16 text-azul-profundo sm:px-8 sm:py-20 lg:px-8 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10 hidden -scale-x-100 -scale-y-100 bg-[url('/assets/activities/brush-background.png')] bg-center bg-[length:130%_190%] bg-no-repeat lg:block" />
      <MotionImage initial={reduceMotion ? false : { opacity: 0, x: -32, y: 16, rotate: -7 }} animate={showHeading ? { opacity: 1, x: 0, y: 0, rotate: 0 } : { opacity: 0, x: -32, y: 16, rotate: -7 }} transition={{ duration: reduceMotion ? 0 : 0.95, delay: reduceMotion ? 0 : 0.08, ease: entranceEase }} src="/assets/elements/precios-izquierda.png" alt="" width={1536} height={1024} className="pointer-events-none absolute bottom-[40px] left-0 z-0 hidden w-72 origin-bottom-left lg:block lg:scale-[1.3] lg:[mask-image:linear-gradient(to_bottom,transparent,black_40%)] xl:w-96" />
      <MotionImage initial={reduceMotion ? false : { opacity: 0, x: 32, y: 16, rotate: 7 }} animate={showHeading ? { opacity: 1, x: 0, y: 0, rotate: 0 } : { opacity: 0, x: 32, y: 16, rotate: 7 }} transition={{ duration: reduceMotion ? 0 : 0.95, delay: reduceMotion ? 0 : 0.22, ease: entranceEase }} src="/assets/elements/precios-derecha.png" alt="" width={1024} height={1536} className="pointer-events-none absolute bottom-[50px] right-0 z-0 hidden w-44 origin-bottom-right lg:block lg:scale-[1.3] lg:[mask-image:linear-gradient(to_bottom,transparent,black_40%)] xl:w-56" />
      <div className="relative z-10 mx-auto max-w-md lg:grid lg:max-w-7xl lg:grid-cols-[1fr_0.85fr_0.85fr_1.1fr] lg:items-center lg:gap-2 lg:px-20 xl:gap-3 xl:px-28">
        <div ref={headingRef} className="relative mb-8 text-center lg:mb-0 lg:text-left lg:text-white">
          <MotionImage initial={reduceMotion ? false : { opacity: 0, rotate: -24, scale: 0.92 }} animate={showHeading ? { opacity: 0.3, rotate: 0, scale: 1 } : { opacity: 0, rotate: -24, scale: 0.92 }} transition={{ duration: reduceMotion ? 0 : 1, ease: entranceEase }} src="/assets/elements/elem-tropical-sun-spiral.webp" alt="" width={303} height={295} className="pointer-events-none absolute -left-5 -top-8 w-40 sm:w-48 lg:hidden" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-7 h-20 w-20 opacity-40 lg:hidden">
            {[1, 2, 3].map((bird, index) => (
              <MotionImage key={bird} initial={reduceMotion ? false : { opacity: 0, x: 16, y: 8, rotate: 6 }} animate={showHeading ? { opacity: 1, x: 0, y: 0, rotate: 0 } : { opacity: 0, x: 16, y: 8, rotate: 6 }} transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.18 + index * 0.1, ease: entranceEase }} src={`/assets/elements/elem-flying-bird-single-${bird}.webp`} alt="" width={[170, 137, 151][index]} height={[81, 62, 64][index]} className={["absolute right-1 top-0 w-9", "absolute right-9 top-5 w-6", "absolute right-0 top-9 w-5"][index]} />
            ))}
          </div>
          <motion.h2 initial={reduceMotion ? false : { clipPath: "inset(-12px 100% -12px -12px)", opacity: 0 }} animate={showHeading ? { clipPath: "inset(-12px -4% -12px -12px)", opacity: 1 } : { clipPath: "inset(-12px 100% -12px -12px)", opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.85, delay: reduceMotion ? 0 : 0.1, ease: entranceEase }} id="pricing-heading" className="font-edosz text-3xl uppercase leading-[1.1] sm:text-5xl lg:text-5xl xl:text-6xl">
            <span className="sr-only lg:hidden">Asegura tu cupo, vive el siguiente nivel</span>
            <span aria-hidden="true" className="relative block text-[clamp(1.15rem,6vw,2.25rem)] leading-[1.35] lg:hidden"><RisingLine text="ASEGURA TU CUPO" /><RisingLine text="VIVE EL SIGUIENTE NIVEL" /></span>
            <span className="hidden lg:block"><span className="sr-only">Precios</span><span aria-hidden="true"><RisingLine text="PRECIOS" className="justify-start" /></span></span>
          </motion.h2>
          <motion.p initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={showHeading ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.3, ease: entranceEase }} className="mt-4 hidden max-w-60 text-base leading-relaxed lg:block">Un tiempo diseñado completo, a un precio accesible. ¡No te quedes fuera!</motion.p>
        </div>

        <div role="radiogroup" aria-label="Selecciona tu plan de inscripción" className="grid grid-cols-2 gap-3 sm:gap-5 lg:contents">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={reduceMotion ? false : { opacity: 0, y: 24, rotate: index === 0 ? -2 : 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.25, margin: "0px 0px -18% 0px" }}
              transition={{ duration: reduceMotion ? 0 : 0.75, delay: reduceMotion ? 0 : 0.08 + index * 0.14, ease: entranceEase }}
              className={`min-w-0 lg:scale-90 ${index === 0 ? "lg:translate-x-2" : "lg:-translate-x-2"}`}
            >
              <motion.label
                animate={{ y: !reduceMotion && selectedPlan === plan.name ? -3 : 0 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: entranceEase }}
                data-tone={index === 0 ? "yellow" : "teal"}
                data-selected={selectedPlan === plan.name}
                className={`pricing-plan-card relative block h-full min-w-0 cursor-pointer overflow-hidden rounded-xl border-2 pb-3 transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none lg:focus-within:outline lg:focus-within:outline-2 lg:focus-within:outline-offset-4 lg:focus-within:outline-azul-profundo lg:overflow-visible lg:pb-7 ${selectedPlan === plan.name ? index === 0 ? "border-[#ffbf00] ring-2 ring-[#ffbf00]/30 shadow-[0_10px_28px_rgba(9,47,57,0.24)]" : "border-[#00aeb8] ring-2 ring-[#00aeb8]/30 shadow-[0_10px_28px_rgba(9,47,57,0.24)]" : "border-transparent shadow-[0_6px_20px_rgba(9,47,57,0.16)]"} ${index === 1 ? "bg-[#fffdf7] lg:bg-[#105466] lg:text-white" : "bg-[#fffdf7]"}`}
              >
                <input
                  type="radio"
                  name="camp-plan"
                  value={plan.name}
                  checked={selectedPlan === plan.name}
                  onChange={() => setSelectedPlan(plan.name)}
                  aria-label={`${plan.name}, S/${plan.price}, ${plan.date}`}
                  className="sr-only"
                />
                <PlanCardWatermark />
                <AnimatePresence>
                  {selectedPlan === plan.name && <motion.span key="selected" initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 440, damping: 24 }} aria-hidden="true" className={`absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md ${index === 0 ? "bg-[#d99f00]" : "bg-[#008c97]"}`}><Check className="h-4 w-4" strokeWidth={3} /></motion.span>}
                </AnimatePresence>
                <div className="relative z-10 -mx-1 flex h-12 items-center justify-center sm:h-14 lg:mx-0 lg:h-auto lg:pt-6">
                  <Image src={plan.brush} alt="" fill sizes="(max-width: 1023px) 50vw, 1px" className={`object-fill lg:hidden ${index === 0 ? "-scale-x-150 scale-y-150 -translate-y-[3px] -rotate-[9deg]" : "scale-150"}`} />
                  <h3 className={`relative font-bebas text-2xl uppercase tracking-wide sm:text-3xl lg:text-2xl lg:text-inherit ${index === 0 ? "text-azul-profundo" : "text-white"}`}>{plan.name}</h3>
                </div>
                <div className="relative z-10 px-2 pt-2 text-center sm:px-4 lg:pt-2">
                  <p className="whitespace-nowrap font-bebas text-5xl leading-none sm:text-6xl lg:text-6xl xl:text-7xl"><span className="mr-1 text-2xl sm:text-3xl">S/</span>{plan.price}</p>
                  <p className="relative isolate mt-1 min-h-8 text-xs font-semibold leading-tight sm:text-sm lg:mt-4 lg:flex lg:min-h-9 lg:items-center lg:justify-center lg:text-base">
                    {index === 0 && <span aria-hidden="true" className="pointer-events-none absolute -inset-y-3 inset-x-[15%] -z-10 hidden lg:block lg:scale-x-125 lg:scale-y-150 lg:rotate-[7deg]"><Image src={plan.brush} alt="" fill sizes="220px" className="object-fill" /></span>}
                    {index === 0 ? <><span className="lg:hidden">{plan.date}</span><span className="hidden lg:block lg:font-extrabold lg:uppercase">Hasta el 15<br />de diciembre</span></> : plan.date}
                  </p>
                </div>
                <div className="relative z-10 mx-3 mt-2 border-t border-azul-profundo/10 pt-2 sm:mx-5 lg:hidden">
                  <Benefits className="space-y-2" />
                </div>
              </motion.label>
            </motion.div>
          ))}
        </div>

        <div className="hidden text-white lg:block">
          <h3 className="sr-only">Ambos planes incluyen</h3>
          <Benefits className="space-y-4" animated />
          <button type="button" disabled={!selectedPlan} onClick={() => { if (selectedPlan) router.push(`/inscripcion?plan=${selectedPlan.toLowerCase()}`); }} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ffbf00] px-4 font-bebas text-xl uppercase tracking-wide text-white shadow-lg transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
            {selectedPlanDetails ? `Continuar con S/${selectedPlanDetails.price}` : "Elige un plan"}
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
          </button>
        </div>
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4, margin: "0px 0px -10% 0px" }} transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.12, ease: entranceEase }} className="mt-4 text-center lg:hidden">
          <button type="button" disabled={!selectedPlan} onClick={() => { if (selectedPlan) router.push(`/inscripcion?plan=${selectedPlan.toLowerCase()}`); }} aria-describedby="registration-status" className="relative inline-flex min-h-20 w-full items-center justify-center gap-3 px-6 font-bebas text-2xl uppercase tracking-wide text-white transition-[filter,transform] enabled:active:scale-[0.98] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65 sm:max-w-md">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 inset-x-[6%]"><Image src="/assets/elements/asset-boton-xd.png" alt="" fill sizes="(max-width: 640px) 88vw, 394px" className="object-fill" /></span>
            <span className="relative inline-flex translate-y-[3px] items-center justify-center gap-3 leading-none">
              <span aria-live="polite" aria-atomic="true" className="inline-grid">
                <AnimatePresence initial={false}>
                  <motion.span key={selectedPlanDetails?.price ?? "choose"} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.16 }} className="col-start-1 row-start-1">{selectedPlanDetails ? `Continuar con S/${selectedPlanDetails.price}` : "Elige un plan"}</motion.span>
                </AnimatePresence>
              </span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 shrink-0"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
            </span>
          </button>
          <p id="registration-status" className="-mt-1 font-bebas text-base uppercase tracking-wide text-azul-profundo/70 lg:mt-3 lg:text-sm lg:text-white/80">{!selectedPlan ? "Selecciona un plan para continuar" : "Cupos limitados"}</p>
        </motion.div>
      </div>
    </section>
  );
}
