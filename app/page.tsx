import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/hero/Hero";
import { HeroDivider } from "@/components/hero/HeroDivider";
import { CampAbout } from "@/components/about/CampAbout";
import { Activities } from "@/components/activities/Activities";

export default function HomePage() {
  return (
    <>
      {/* Fuera de <main>: el header fijo y el portal del menú quedan
          inmunes al overflow-x-hidden y al apilado del contenido */}
      <Navbar />
      <main className="relative min-h-screen bg-azul-profundo text-white overflow-x-hidden">
        <Hero />
        <HeroDivider />
        <CampAbout />
        <Activities />
      </main>
    </>
  );
}
