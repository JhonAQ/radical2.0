import Link from "next/link";
import { ArrowRightIcon } from "@/components/common/Icons";
import { CAMP_CONFIG } from "@/config/site";

export function HeroCta() {
  return (
    <div className="flex items-center justify-center">
      <Link
        href={CAMP_CONFIG.registrationUrl}
        className="group inline-flex items-center justify-center gap-2 sm:gap-2.5 px-7 py-4 sm:px-9 sm:py-3.5 md:px-10 md:py-4 rounded-xl bg-[#fcc408] hover:bg-[#e6b007] text-azul-profundo font-sans font-extrabold text-base sm:text-sm md:text-base uppercase tracking-wider transition-all duration-200 shadow-[0_0_24px_rgba(252,196,8,0.45)] hover:shadow-[0_0_38px_rgba(252,196,8,0.8)] hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fcc408]/50 animate-cta-glow"
      >
        <span>Inscribirme Ahora</span>
        <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1.5 group-hover:scale-110" />
      </Link>
    </div>
  );
}
