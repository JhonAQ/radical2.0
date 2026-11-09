import Image from "next/image";

const plans = [
  { name: "Preventa", price: "200", date: "Hasta el 15 de diciembre", brush: "/assets/elements/brush-planes-amarillo.png" },
  { name: "Regular", price: "250", date: "Desde el 16 de diciembre", brush: "/assets/elements/brush-planes-turquesa.png" },
] as const;

const benefits = ["Hospedaje", "Alimentación completa", "Programación y materiales", "Acceso a todas las actividades"];

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

function Benefits({ className = "" }: { className?: string }) {
  return (
    <ul className={className}>
      {benefits.map((benefit) => (
        <li key={benefit} className="flex items-start gap-1.5 text-[11px] leading-[1.1] sm:text-sm lg:gap-3 lg:text-base lg:font-semibold lg:leading-tight">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#00aeb8] lg:h-6 lg:w-6 lg:rounded-full lg:bg-[#ffbf00] lg:p-1 lg:text-azul-profundo" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingPlans() {
  return (
    <section id="inscribirme" aria-labelledby="pricing-heading" className="relative isolate bg-white px-4 py-16 text-azul-profundo sm:px-8 sm:py-20 lg:px-8 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10 hidden -scale-x-100 -scale-y-100 bg-[url('/assets/activities/brush-background.png')] bg-center bg-[length:130%_190%] bg-no-repeat lg:block" />
      <Image src="/assets/elements/precios-izquierda.png" alt="" width={1536} height={1024} className="pointer-events-none absolute bottom-[40px] left-0 z-0 hidden w-72 origin-bottom-left lg:block lg:scale-[1.3] lg:[mask-image:linear-gradient(to_bottom,transparent,black_40%)] xl:w-96" />
      <Image src="/assets/elements/precios-derecha.png" alt="" width={1024} height={1536} className="pointer-events-none absolute bottom-[50px] right-0 z-0 hidden w-44 origin-bottom-right lg:block lg:scale-[1.3] lg:[mask-image:linear-gradient(to_bottom,transparent,black_40%)] xl:w-56" />
      <div className="relative z-10 mx-auto max-w-md lg:grid lg:max-w-7xl lg:grid-cols-[1fr_0.85fr_0.85fr_1.1fr] lg:items-center lg:gap-2 lg:px-20 xl:gap-3 xl:px-28">
        <div className="relative mb-8 text-center lg:mb-0 lg:text-left lg:text-white">
          <Image src="/assets/elements/elem-tropical-sun-spiral.webp" alt="" width={303} height={295} className="pointer-events-none absolute -left-5 -top-8 w-40 opacity-30 sm:w-48 lg:hidden" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-7 h-20 w-20 opacity-40 lg:hidden">
            <Image src="/assets/elements/elem-flying-bird-single-1.webp" alt="" width={170} height={81} className="absolute right-1 top-0 w-9" />
            <Image src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} className="absolute right-9 top-5 w-6" />
            <Image src="/assets/elements/elem-flying-bird-single-3.webp" alt="" width={151} height={64} className="absolute right-0 top-9 w-5" />
          </div>
          <h2 id="pricing-heading" className="font-edosz text-3xl uppercase leading-[1.1] sm:text-5xl lg:text-5xl xl:text-6xl">
            <span className="sr-only lg:hidden">Asegura tu cupo, vive el siguiente nivel</span>
            <span aria-hidden="true" className="relative block text-[clamp(1.15rem,6vw,2.25rem)] leading-[1.35] lg:hidden"><RisingLine text="ASEGURA TU CUPO" /><RisingLine text="VIVE EL SIGUIENTE NIVEL" /></span>
            <span className="hidden lg:block"><span className="sr-only">Precios</span><span aria-hidden="true"><RisingLine text="PRECIOS" className="justify-start" /></span></span>
          </h2>
          <p className="mt-4 hidden max-w-60 text-base leading-relaxed lg:block">Un tiempo diseñado completo, a un precio accesible. ¡No te quedes fuera!</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:contents">
          {plans.map((plan, index) => (
            <article key={plan.name} className={`min-w-0 overflow-hidden rounded-xl bg-[#fffdf7] pb-3 shadow-[0_6px_20px_rgba(9,47,57,0.16)] lg:scale-90 lg:overflow-visible lg:pb-7 ${index === 1 ? "lg:-translate-x-2 lg:bg-[#105466] lg:text-white" : "lg:translate-x-2"}`}>
              <div className="relative -mx-1 flex h-12 items-center justify-center sm:h-14 lg:mx-0 lg:h-auto lg:pt-6">
                <Image src={plan.brush} alt="" fill sizes="(max-width: 1023px) 50vw, 1px" className={`object-fill lg:hidden ${index === 0 ? "-scale-x-150 scale-y-150 -translate-y-[3px] -rotate-[9deg]" : "scale-150"}`} />
                <h3 className={`relative font-bebas text-2xl uppercase tracking-wide sm:text-3xl lg:text-2xl lg:text-inherit ${index === 0 ? "text-azul-profundo" : "text-white"}`}>{plan.name}</h3>
              </div>
              <div className="px-2 pt-2 text-center sm:px-4 lg:pt-2">
                <p className="whitespace-nowrap font-bebas text-5xl leading-none sm:text-6xl lg:text-6xl xl:text-7xl"><span className="mr-1 text-2xl sm:text-3xl">S/</span>{plan.price}</p>
                <p className="relative isolate mt-1 min-h-8 text-xs font-semibold leading-tight sm:text-sm lg:mt-4 lg:flex lg:min-h-9 lg:items-center lg:justify-center lg:text-base">
                  {index === 0 && <span aria-hidden="true" className="pointer-events-none absolute -inset-y-3 inset-x-[15%] -z-10 hidden lg:block lg:scale-x-125 lg:scale-y-150 lg:rotate-[7deg]"><Image src={plan.brush} alt="" fill sizes="220px" className="object-fill" /></span>}
                  {index === 0 ? <><span className="lg:hidden">{plan.date}</span><span className="hidden lg:block lg:font-extrabold lg:uppercase">Hasta el 15<br />de diciembre</span></> : plan.date}
                </p>
              </div>
              <div className="mx-3 mt-2 border-t border-azul-profundo/10 pt-2 sm:mx-5 lg:hidden">
                <Benefits className="space-y-2" />
              </div>
            </article>
          ))}
        </div>

        <div className="hidden text-white lg:block">
          <h3 className="sr-only">Ambos planes incluyen</h3>
          <Benefits className="space-y-4" />
        </div>
        <div className="mt-4 text-center lg:hidden">
          <button type="button" disabled aria-describedby="registration-status" className="relative inline-flex min-h-20 w-full items-center justify-center gap-3 px-6 font-bebas text-2xl uppercase tracking-wide text-white sm:max-w-md">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 inset-x-[6%]"><Image src="/assets/elements/asset-boton-xd.png" alt="" fill sizes="(max-width: 640px) 88vw, 394px" className="object-fill" /></span>
            <span className="relative inline-flex translate-y-[3px] items-center justify-center gap-3 leading-none">
              <span>Inscribirme ahora</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 shrink-0"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
            </span>
          </button>
          <p id="registration-status" className="-mt-1 font-bebas text-base uppercase tracking-wide text-azul-profundo/70 lg:mt-3 lg:text-sm lg:text-white/80">Cupos limitados</p>
        </div>
      </div>
    </section>
  );
}
