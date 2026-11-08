import { ChevronDownIcon } from "@/components/common/Icons";

export function HeroScrollCue() {
  return (
    <a
      href="#campamento"
      aria-label="Deslizar hacia abajo"
      className="inline-flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-turquesa rounded-lg px-3 py-1 group"
    >
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold animate-pulse-slow">
        Desliza
      </span>
      <ChevronDownIcon className="w-4 h-4 animate-bounce-slow" />
    </a>
  );
}
