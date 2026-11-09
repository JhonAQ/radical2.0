import Image from "next/image";
import { BookOpen, Flame, Sun, UsersRound, Waves } from "lucide-react";

const days = [
  {
    day: "DÍA 1",
    title: "Llegada y encuentro",
    description: "Bienvenida, juegos, comunidad",
    color: "bg-[#ffb900]",
    icon: Sun,
  },
  {
    day: "DÍA 2",
    title: "Enseñanzas que desafían",
    description: "Tiempos con Dios y talleres",
    color: "bg-[#009fb1]",
    icon: BookOpen,
  },
  {
    day: "DÍA 3",
    title: "Vida en comunidad",
    description: "Deportes, dinámicas y playa",
    color: "bg-azul-profundo",
    icon: UsersRound,
  },
  {
    day: "DÍA 4",
    title: "Naturaleza que renueva",
    description: "Salida, aventura y reflexión",
    color: "bg-[#00bdbb]",
    icon: Waves,
  },
  {
    day: "DÍA 5",
    title: "Un propósito más grande",
    description: "Cierre y envío",
    color: "bg-[#ff4a1f]",
    icon: Flame,
  },
] as const;

export function ProgramDays() {
  return (
    <section id="programa" aria-labelledby="program-heading" className="relative z-20 isolate bg-white px-5 pt-16 pb-[12px] text-azul-profundo sm:px-8 sm:py-20 lg:min-w-0 lg:bg-transparent lg:px-0 lg:py-0">
      <Image src="/assets/elements/elem-crown-painted-gold.webp" alt="" width={145} height={137} className="pointer-events-none absolute right-[40px] top-[68px] z-0 w-28 rotate-12 opacity-70 sm:right-[-57px] sm:top-[18px] sm:w-36 lg:hidden" />

      <div className="relative z-10 mx-auto max-w-6xl lg:max-w-[300px]">
        <div className="mb-10 lg:mb-8 lg:text-center">
          <h2 id="program-heading" className="font-blowbrush text-4xl uppercase leading-none sm:text-5xl lg:text-5xl">Programa</h2>
          <p className="mt-4 max-w-[12rem] font-blowbrush text-[1.55rem] uppercase leading-[1.08] text-[#f0522d] sm:max-w-sm sm:text-3xl lg:mx-auto lg:mt-3 lg:max-w-none lg:text-xl">
            Cinco días<span className="hidden lg:inline"> </span><br className="lg:hidden" />que marcarán<span className="hidden lg:inline"> </span><br className="lg:hidden" />tu historia
          </p>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="absolute left-[83px] top-8 bottom-8 w-px bg-azul-profundo/25 sm:left-[99px] lg:left-[73px]" />
          <ol className="relative flex flex-col gap-3 sm:gap-5 lg:gap-3">
            {days.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.day} className="relative grid min-h-[76px] grid-cols-[64px_16px_minmax(0,1fr)] items-center gap-3 sm:min-h-[88px] sm:grid-cols-[80px_16px_minmax(0,1fr)] lg:min-h-[72px] lg:grid-cols-[56px_12px_minmax(0,1fr)] lg:gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_3px_0_rgba(11,45,54,0.18)] sm:h-16 sm:w-16 lg:h-12 lg:w-12 ${item.color}`}>
                    <Icon aria-hidden="true" className="h-[25px] w-[25px] sm:h-7 sm:w-7" strokeWidth={2.2} />
                  </div>
                  <span aria-hidden="true" className={`z-10 h-2 w-2 justify-self-center rounded-full ${item.day === "DÍA 4" || item.day === "DÍA 5" ? "bg-[#ff5a2a]" : "bg-[#0b7893]"}`} />
                  <div className="min-w-0 leading-tight">
                    <span className="font-bebas text-base tracking-wide sm:text-lg">{item.day}</span>
                    <h3 className="font-sans text-sm font-bold sm:text-base">{item.title}</h3>
                    <p className="mt-0.5 font-sans text-xs text-azul-profundo/75 sm:text-sm">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
