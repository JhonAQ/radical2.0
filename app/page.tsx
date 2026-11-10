import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/hero/Hero";
import { HeroDivider } from "@/components/hero/HeroDivider";
import { CampAbout } from "@/components/about/CampAbout";
import { Activities } from "@/components/activities/Activities";
import { ProgramDays } from "@/components/program/ProgramDays";
import { PackingList } from "@/components/packing/PackingList";
import { ProgramPackingAmbient } from "@/components/program/ProgramPackingAmbient";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { LocationFaq } from "@/components/location/LocationFaq";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloating } from "@/components/common/WhatsAppFloating";

export default function HomePage() {
  return (
    <>
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
        <PricingPlans />
        <LocationFaq />
      </main>
      <Footer />
      <WhatsAppFloating />
    </>
  );
}
