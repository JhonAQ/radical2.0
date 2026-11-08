import Link from "next/link";
import { ArrowRightIcon } from "@/components/common/Icons";
import { CAMP_CONFIG } from "@/config/site";

export function HeroCta() {
  return (
    <div className="flex items-center justify-center w-full sm:w-auto">
      <Link
        href={CAMP_CONFIG.registrationUrl}
        className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-2.5 px-7 py-4 sm:px-9 sm:py-3.5 md:px-10 md:py-4 rounded-xl bg-naranja hover:bg-[#e65f00] text-white font-sans font-extrabold text-base sm:text-sm md:text-base uppercase tracking-wider transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-naranja/50 animate-cta-glow"
      >
        <span>Inscribirme Ahora</span>
        <ArrowRightIcon className="w-4 h-4 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1.5 group-hover:scale-110" />
      </Link>
    </div>
  );
}
