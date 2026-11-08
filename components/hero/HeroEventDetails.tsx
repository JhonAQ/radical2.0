import { CalendarGridIcon, LocationPinSolidIcon } from "@/components/common/Icons";

export function HeroEventDetails() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 md:gap-7 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
      {/* Date Item */}
      <div className="flex items-center gap-2 sm:gap-3">
        <CalendarGridIcon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white flex-shrink-0" />
        <span className="font-bebas text-4xl sm:text-3xl md:text-4xl tracking-wider text-white whitespace-nowrap pt-0.5">
          30 DIC – 3 ENE
        </span>
      </div>

      {/* Separator */}
      <div className="w-20 h-[1.5px] sm:w-[1.5px] sm:h-8 md:h-9 bg-white/40 select-none" />

      {/* Location Item */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <LocationPinSolidIcon className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white flex-shrink-0" />
        <span className="font-bebas text-3xl sm:text-xl md:text-2xl tracking-wider text-white uppercase pt-0.5">
          Campel Mejía
        </span>
      </div>
    </div>
  );
}
