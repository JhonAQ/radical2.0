import Image from "next/image";
import { BadgeCheck, BusFront, Layers3, MapPin, UsersRound, Wallet } from "lucide-react";
import { CAMP_CONFIG } from "@/config/site";
import { FooterBeachScene } from "@/components/layout/FooterBeachScene";
import "./LocationFaq.css";

const questions = [
  { question: "¿Desde dónde saldremos?", answer: "La salida hacia el campamento será desde Arequipa. El punto de encuentro y la hora se comunicarán para esta edición.", icon: BusFront },
  { question: "¿Puedo pagar por partes?", answer: "¡Sí! Puedes reservar tu cupo con S/50 y completar el saldo antes del inicio del campamento. Si reservas hasta el 15 de diciembre, aprovechas el precio de preventa de S/200.", icon: Wallet },
  { question: "¿Qué incluye el precio?", answer: "Incluye hospedaje, alimentación completa, programación y materiales, y acceso a todas las actividades del campamento.", icon: BadgeCheck },
  { question: "¿La preventa incluye lo mismo que el precio regular?", answer: "Sí. Ambas tarifas incluyen la misma experiencia. La diferencia es el precio según la fecha en que te inscribas.", icon: Layers3 },
  { question: "¿Hay límite de edad?", answer: "El campamento está pensado para adolescentes y jóvenes. No hay un límite superior de edad: si quieres vivir esta experiencia, eres bienvenido.", icon: UsersRound },
];

function SectionHeading({ id, text, tone }: { id: string; text: string; tone: "yellow" | "teal" }) {
  return (
    <h2 id={id} aria-label={text} className={`location-heading location-heading--${tone} font-edosz uppercase leading-none`}>
      <span aria-hidden="true" className="relative z-10 inline-flex whitespace-nowrap">
        {Array.from(text).map((letter, index) => <span key={index} style={{ transform: `translateY(${((text.length - 1) / 2 - index) * 0.035}em) rotate(-4deg)` }}>{letter === " " ? "\u00a0" : letter}</span>)}
      </span>
    </h2>
  );
}

export function LocationFaq() {
  const mapQuery = encodeURIComponent("Campamento Evangélico Luterano CAMPEL, Mejía, Arequipa, Perú");
  const mapsUrl = "https://maps.app.goo.gl/Bxj6DFZEWZcazhh59";

  return (
    <div className="location-faq-section relative isolate bg-white text-azul-profundo">
      <div className="location-content relative z-10 mx-auto flex max-w-[1500px] flex-col gap-16 px-5 pt-16 pb-5 sm:px-8 sm:pt-20 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:px-12 lg:pt-16 lg:pb-36 xl:gap-16">
        <section id="lugar" aria-labelledby="location-heading" className="min-w-0 scroll-mt-40 lg:border-r lg:border-azul-profundo/20 lg:pr-8">
          <SectionHeading id="location-heading" text="¿Dónde será?" tone="yellow" />
          <div className="mb-5 flex items-center gap-3 lg:mb-4">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 shrink-0 text-[#00aeb8]"><path fillRule="evenodd" d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8Zm0 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
            <div><h3 className="text-xl font-bold">Campamento Evangélico Luterano (CAMPEL)</h3><p className="mt-0.5 font-bebas text-lg tracking-wide text-azul-profundo/65">{CAMP_CONFIG.location.city}, {CAMP_CONFIG.location.region}</p></div>
          </div>
          <div className="location-visuals">
            <div className="location-photo" aria-label="Campamento nocturno en CAMPEL">
              <Image src="/assets/location/campel-noche.webp" alt="Mesas iluminadas durante una noche de campamento en CAMPEL" fill sizes="(min-width: 1024px) 260px, 1px" className="object-cover object-center" />
            </div>
            <div className="location-map overflow-hidden rounded-xl border border-azul-profundo/10 bg-[#e8f2f1] shadow-[0_8px_28px_rgba(9,47,57,0.08)]">
              <iframe title="Mapa de Campel Mejía en Google Maps" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="block h-64 w-full border-0 sm:h-80 lg:h-full" />
            </div>
          </div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="location-map-link mt-4 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-azul-profundo px-5 py-3 font-bebas text-xl tracking-wide text-white transition-colors hover:bg-[#105466] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00aeb8] sm:w-auto">
            <MapPin aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />Ver ubicación en Google Maps<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
          </a>
        </section>

        <section id="faq" aria-labelledby="faq-heading" className="min-w-0 scroll-mt-40">
          <SectionHeading id="faq-heading" text="¿Tienes preguntas?" tone="teal" />
          <p className="mb-5 text-sm leading-relaxed text-azul-profundo/70 sm:text-base">Todo lo esencial para preparar tu próxima experiencia radical.</p>
          <div className="location-faq-list">
            {questions.map(({ question, answer, icon: Icon }) => (
              <details key={question} name="camp-faq" className="location-faq-item group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-1 text-sm font-semibold transition-colors hover:text-[#008c97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00aeb8] sm:text-base [&::-webkit-details-marker]:hidden">
                  <Icon aria-hidden="true" className="hidden h-6 w-6 shrink-0 text-azul-profundo lg:block" strokeWidth={2.2} />
                  <span className="flex-1">{question}</span>
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffbf00]/20 text-azul-profundo transition-colors group-open:bg-[#ffbf00]">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4"><path d="M4 10h12" /><path d="M10 4v12" className="origin-center transition-transform group-open:scale-y-0 motion-reduce:transition-none" /></svg>
                  </span>
                </summary>
                <p className="px-4 pb-3 text-sm leading-relaxed text-azul-profundo/75 lg:pl-[3.25rem]">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
      <FooterBeachScene />
    </div>
  );
}
