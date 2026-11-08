import { HeroBackground } from "./HeroBackground";
import { BrandLogo } from "@/components/common/BrandLogo";
import { HeroEventDetails } from "./HeroEventDetails";
import { HeroCta } from "./HeroCta";
import { HeroScrollCue } from "./HeroScrollCue";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative w-full h-[100dvh] flex flex-col overflow-hidden"
    >
      <HeroBackground />

      {/* Gradiente inferior solo en mobile para dar peso al bloque de detalles */}
      <div className="sm:hidden absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-azul-profundo/80 via-azul-profundo/40 to-transparent z-[5] pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6 h-full flex flex-col pt-16 sm:pt-20 md:pt-24 pb-5 sm:pb-8">

        {/* ── MOBILE LAYOUT ── */}

        {/* Logo Zone: ocupa la zona superior con flex-1 */}
        <div className="flex-1 sm:hidden flex items-center justify-center">
          <div className="w-full max-w-[85vw] flex items-center justify-center transition-transform hover:scale-[1.01]">
            <BrandLogo
              variant="principal"
              priority
              width={550}
              className="w-full h-auto object-contain drop-shadow-[0_12px_36px_rgba(0,0,0,0.65)]"
            />
          </div>
        </div>

        {/* Bottom block: fecha + lugar + CTA agrupados */}
        <div className="sm:hidden flex flex-col items-center gap-4 mb-10">
          <HeroEventDetails />
          <HeroCta />
        </div>

        {/* ── DESKTOP LAYOUT (sm+) ── */}
        <div className="hidden sm:flex flex-1 flex-col items-center justify-center text-center gap-6 md:gap-7">
          <div className="w-full max-w-[380px] md:max-w-[430px] lg:max-w-[500px] flex items-center justify-center transition-transform hover:scale-[1.01]">
            <BrandLogo
              variant="principal"
              priority
              width={500}
              className="w-full h-auto object-contain drop-shadow-[0_12px_36px_rgba(0,0,0,0.65)]"
            />
          </div>
          <HeroEventDetails />
          <HeroCta />
        </div>

        {/* Scroll Cue */}
        <div className="flex justify-center">
          <HeroScrollCue />
        </div>

      </div>
    </section>
  );
}
