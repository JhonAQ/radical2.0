import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/hero/Hero";
import { HeroDivider } from "@/components/hero/HeroDivider";
import { CampAbout } from "@/components/about/CampAbout";
import { Activities } from "@/components/activities/Activities";
import { PackingList } from "@/components/packing/PackingList";
import { Footer } from "@/components/layout/Footer";

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
        <PackingList />
      </main>
      <Footer />
    </>
  );
}
