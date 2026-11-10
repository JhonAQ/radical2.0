import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/hero/Hero";
import { HeroDivider } from "@/components/hero/HeroDivider";
import { CampAbout } from "@/components/about/CampAbout";
import { Activities } from "@/components/activities/Activities";
import { ProgramDays } from "@/components/program/ProgramDays";
import { PackingList } from "@/components/packing/PackingList";
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
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 hidden opacity-35 lg:block">
            <Image src="/assets/elements/elem-flying-bird-single-1.webp" alt="" width={170} height={81} className="absolute left-[49%] top-[6%] w-14" />
            <Image src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} className="absolute left-[46%] top-[12%] w-10 -rotate-12" />
            <Image src="/assets/elements/elem-flying-bird-single-3.webp" alt="" width={151} height={64} className="absolute left-[52%] top-[12%] w-9 rotate-6" />
            <Image src="/assets/elements/elem-flying-bird-single-4.webp" alt="" width={154} height={71} className="absolute left-[45%] top-[16%] w-8 rotate-12" />
            <Image src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} className="absolute left-[54%] top-[16%] w-7 -rotate-12" />
            <Image src="/assets/elements/elem-flying-bird-single-3.webp" alt="" width={151} height={64} className="absolute left-[8%] top-[28%] w-8 rotate-6 opacity-40" />
            <Image src="/assets/elements/elem-flying-bird-single-1.webp" alt="" width={170} height={81} className="absolute left-[11%] top-[24%] w-11 -rotate-12 opacity-45" />
            <Image src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} className="absolute left-[14%] top-[30%] w-6 rotate-12 opacity-35" />
            <Image src="/assets/elements/elem-flying-bird-single-4.webp" alt="" width={154} height={71} className="absolute right-[7%] top-[25%] w-9 -rotate-6 opacity-40" />
            <Image src="/assets/elements/elem-flying-bird-single-1.webp" alt="" width={170} height={81} className="absolute right-[11%] top-[21%] w-12 rotate-12 opacity-45" />
            <Image src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} className="absolute right-[14%] top-[27%] w-7 -rotate-12 opacity-35" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 z-20 hidden h-64 w-72 opacity-70 lg:block">
            <Image src="/assets/elements/elem-palm-tree-tall-curved.webp" alt="" width={346} height={544} className="absolute bottom-[51px] -left-10 w-[18rem] max-w-none -rotate-6" />
            <Image src="/assets/elements/elem-tropical-bush-large.webp" alt="" width={343} height={337} className="absolute -bottom-16 -left-20 w-72" />
            <Image src="/assets/elements/elem-palm-frond-leaf.webp" alt="" width={294} height={250} className="absolute -bottom-16 left-12 w-56 -rotate-12" />
            <Image src="/assets/elements/elem-tropical-leaf-green-yellow.webp" alt="" width={331} height={183} className="absolute -bottom-4 -left-16 w-64 rotate-[-28deg]" />
            <Image src="/assets/elements/elem-hibiscus-flower-red.webp" alt="" width={197} height={183} className="absolute bottom-10 left-14 w-16 rotate-12" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 z-20 hidden h-64 w-72 opacity-70 lg:block">
            <Image src="/assets/elements/elem-tropical-bush-large.webp" alt="" width={343} height={337} className="absolute -bottom-16 -right-20 w-72 scale-x-[-1]" />
            <Image src="/assets/elements/elem-palm-frond-leaf.webp" alt="" width={294} height={250} className="absolute -bottom-16 right-12 w-56 rotate-12 scale-x-[-1]" />
            <Image src="/assets/elements/elem-tropical-leaf-green-yellow.webp" alt="" width={331} height={183} className="absolute -bottom-4 -right-16 w-64 rotate-[28deg] scale-x-[-1]" />
            <Image src="/assets/elements/elem-hibiscus-flower-yellow.webp" alt="" width={214} height={197} className="absolute bottom-10 right-14 w-16 -rotate-12" />
          </div>
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
