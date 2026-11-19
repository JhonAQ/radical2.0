import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/hero/Hero";
import { HeroDivider } from "@/components/hero/HeroDivider";
import { CampAbout } from "@/components/about/CampAbout";
import { Activities } from "@/components/activities/Activities";
import { ProgramDays } from "@/components/program/ProgramDays";
import { PackingList } from "@/components/packing/PackingList";
import { ProgramPackingAmbient } from "@/components/program/ProgramPackingAmbient";
import { Speakers } from "@/components/speakers/Speakers";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { LocationFaq } from "@/components/location/LocationFaq";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloating } from "@/components/common/WhatsAppFloating";
import type { Metadata } from "next";
import { getPreventaDeadline } from "@/utils/preventa-server";
import { preventaDates } from "@/utils/preventa";
import { buildFaq } from "@/config/faq";
import { CAMP_CONFIG } from "@/config/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radical.ielp.org";

export const metadata: Metadata = {
  // Solo canonical: un openGraph aquí reemplazaría por completo el del layout (imagen incluida).
  alternates: { canonical: "/" },
};

// Datos estructurados (schema.org) para que Google entienda el evento, precios y preguntas.
function structuredData(preventaDeadline: string) {
  const event = {
    "@type": "Event",
    "@id": `${SITE_URL}/#evento`,
    name: "Radical 2.0 · Campamento de verano",
    description:
      "Campamento de verano para adolescentes y jóvenes: adoración, enseñanza, talleres, juegos y playa. Recibimos juntos el Año Nuevo 2027.",
    startDate: CAMP_CONFIG.targetCountdownDate,
    endDate: "2027-01-03T18:00:00-05:00",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "es",
    image: [`${SITE_URL}/assets/brand/og-radical-camp.jpg`, `${SITE_URL}/assets/brand/og-image.png`],
    url: SITE_URL,
    location: {
      "@type": "Place",
      name: CAMP_CONFIG.location.venue,
      hasMap: "https://maps.app.goo.gl/Bxj6DFZEWZcazhh59",
      address: {
        "@type": "PostalAddress",
        addressLocality: CAMP_CONFIG.location.city,
        addressRegion: CAMP_CONFIG.location.region,
        addressCountry: "PE",
      },
    },
    organizer: { "@type": "Organization", name: CAMP_CONFIG.name, url: SITE_URL },
    offers: [
      {
        "@type": "Offer",
        name: "Preventa",
        price: "200",
        priceCurrency: "PEN",
        availability: "https://schema.org/InStock",
        validThrough: preventaDeadline,
        url: `${SITE_URL}/#inscribirme`,
      },
      {
        "@type": "Offer",
        name: "Regular",
        price: "250",
        priceCurrency: "PEN",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/#inscribirme`,
      },
    ],
  };
  const faq = {
    "@type": "FAQPage",
    mainEntity: buildFaq(preventaDates(preventaDeadline).lastDay).map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  const site = { "@type": "WebSite", "@id": `${SITE_URL}/#sitio`, name: CAMP_CONFIG.name, url: SITE_URL, inLanguage: "es" };
  // "<" escapado: el JSON va dentro de un <script>.
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [site, event, faq] }).replace(/</g, "\\u003c");
}

export default async function HomePage() {
  const preventaDeadline = await getPreventaDeadline();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(preventaDeadline) }} />
      {/* Fuera de <main>: el header fijo y el portal del menú quedan
          inmunes al recorte horizontal y al apilado del contenido */}
      <Navbar />
      <main className="relative min-h-screen overflow-x-clip bg-azul-profundo text-white">
        <Hero />
        <HeroDivider />
        <CampAbout />
        <Activities />
        <div className="relative z-10 isolate bg-white">
          <ProgramPackingAmbient />
          <div className="relative z-30 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-2 lg:items-stretch lg:gap-8 lg:px-8 lg:py-[21.333px]">
            <ProgramDays />
            <PackingList />
          </div>
        </div>
        <PricingPlans preventaDeadline={preventaDeadline} />
        <Speakers />
        <LocationFaq preventaDeadline={preventaDeadline} />
      </main>
      <Footer />
      <WhatsAppFloating />
    </>
  );
}
