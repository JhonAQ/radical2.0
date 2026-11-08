import { ChevronDownIcon } from "@/components/common/Icons";

export function HeroScrollCue() {
  return (
    <a
      href="#campamento"
      aria-label="Deslizar hacia abajo"
      className="inline-flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-turquesa rounded-lg px-3 py-1 group"
    >
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold">
        Desliza
      </span>
      <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:translate-y-0.5 animate-bounce" />
    </a>
  );
}
