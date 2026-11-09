import Image from "next/image";

const items = [
  { label: <>Ropa cómoda<br />y de playa</>, icon: "backpack" },
  { label: <>Gorra<br />y bloqueador</>, icon: "cap" },
  { label: <>Biblia<br />y cuaderno</>, icon: "bible" },
  { label: <>Sandalias<br />y zapatillas</>, icon: "sandals" },
  { label: <>Toalla<br />y artículos personales</>, icon: "towel" },
  { label: <>Buena actitud<br />¡y muchas ganas!</>, icon: "camera" },
] as const;

const headingLetters = Array.from("¿QUÉ LLEVAR?");

function PackingIcon({ name }: { name: (typeof items)[number]["icon"] }) {
  const shared = "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16";
  switch (name) {
    case "backpack":
      return <svg className={shared} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M24 14v-3a8 8 0 0 1 16 0v3M19 20h26a7 7 0 0 1 7 7v28H12V27a7 7 0 0 1 7-7Z" /><path d="M19 20v-5a13 13 0 0 1 26 0v5M12 30H8v17h4m40-17h4v17h-4M22 42h20v13H22z" /><path d="M24 29h16v8H24z" stroke="#00aeb7" /></svg>;
    case "cap":
      return <svg className={shared} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128 24a104.12 104.12 0 0 0-104 104v56a24 24 0 0 0 38.18 19.36C74.33 194.53 95.6 184 128 184s53.67 10.52 65.81 19.35A24 24 0 0 0 232 184v-56A104.12 104.12 0 0 0 128 24Zm88 104v8.87a166 166 0 0 0-40.94-18.22 167 167 0 0 0-28.87-76.75A88.14 88.14 0 0 1 216 128ZM128 44.27a152.47 152.47 0 0 1 30.4 70.46 170.85 170.85 0 0 0-60.84 0A153.31 153.31 0 0 1 128 44.27ZM109.81 41.9a167 167 0 0 0-28.87 76.76A166 166 0 0 0 40 136.88V128a88.14 88.14 0 0 1 69.81-86.1Zm101.85 149.21a8 8 0 0 1-8.44-.69C189.16 180.2 164.7 168 128 168s-61.16 12.2-75.22 22.42a8 8 0 0 1-8.44.69A7.77 7.77 0 0 1 40 184v-27.93a152 152 0 0 1 176 0V184a7.77 7.77 0 0 1-4.34 7.11Z" /></svg>;
    case "bible":
      return <svg className={shared} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="20" y="12" width="30" height="45" rx="5" /><path d="M20 19h-4a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h4M28 28h14m-7-7v14M25 49h20" /><path d="M35 39v7" stroke="#00aeb7" /></svg>;
    case "sandals":
      return <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 7s.5-4-4-4-4 4-4 4m8 0h-8m8 0-.2143 3M14 7l.2143 3m7.5714 0-.5867 8.2137A3 3 0 0 1 18.2067 21h-.4133a3 3 0 0 1-2.9924-2.7863L14.2143 10m7.5714 0h-7.5714" /><path d="M10 7s.5-4-4-4-4 4-4 4m8 0H2m8 0-.2143 3M2 7l.2143 3m7.5714 0-.5867 8.2137A3 3 0 0 1 6.2067 21h-.4133a3 3 0 0 1-2.9924-2.7863L2.2143 10m7.5714 0H2.2143" /></svg>;
    case "towel":
      return <svg className={shared} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="16" y="9" width="33" height="45" rx="4" /><path d="M16 18h-5v20h5m33-20h5v20h-5M21 26h23M21 48h23" /><path d="M26 34h13" stroke="#00aeb7" /></svg>;
    case "camera":
      return <svg className={shared} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 20h11l4-6h18l4 6h11a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z" /><circle cx="32" cy="37" r="11" /><circle cx="32" cy="37" r="4" stroke="#00aeb7" /><path d="M50 27h3" /></svg>;
  }
}

export function PackingList() {
  return (
    <section id="que-llevar" aria-labelledby="packing-heading" className="relative isolate z-10 overflow-visible bg-white px-5 py-14 text-azul-profundo sm:px-8 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] [background-image:radial-gradient(#967f57_0.7px,transparent_0.7px)] [background-size:11px_11px]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[-56px] top-[-36px] z-0 w-40 origin-bottom-right -rotate-12 opacity-70 sm:right-[-68px] sm:top-[-84px] sm:w-[13.333rem] lg:right-[-76px] lg:w-60">
        <Image src="/assets/elements/elem-palm-tree-tall-curved.webp" alt="" width={346} height={544} className="h-auto w-full scale-x-[-1]" />
      </div>
      <Image src="/assets/textures/t1-01-teal-wide.webp" alt="" width={732} height={252} className="pointer-events-none absolute -left-20 -top-14 z-0 w-60 -rotate-12 sm:w-80" />
      <Image src="/assets/textures/t1-01-teal-wide.webp" alt="" width={732} height={252} className="pointer-events-none absolute bottom-[-24px] -left-28 z-0 w-64 -rotate-12 opacity-80 sm:w-80" />
      <Image src="/assets/textures/t1-02-orange-yellow-wide.webp" alt="" width={756} height={212} className="pointer-events-none absolute bottom-[-8px] -right-28 z-0 w-64 rotate-[-8deg] scale-y-[-1] opacity-80 sm:w-80" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <h2 id="packing-heading" aria-label="¿Qué llevar?" className="mb-10 font-edosz text-4xl uppercase leading-none sm:mb-12 sm:text-5xl lg:text-6xl">
          <span aria-hidden="true" className="inline-flex whitespace-nowrap">
            {headingLetters.map((letter, index) => (
              <span
                key={index}
                className="inline-block"
                style={{ transform: `translateY(${((headingLetters.length - 1) / 2 - index) * 0.045 + Math.sin(index * 0.85) * 0.018}em) rotate(${-5 + Math.sin(index * 0.8) * 2}deg)` }}
              >
                {letter === " " ? "\u00a0" : letter}
              </span>
            ))}
          </span>
        </h2>
        <div className="grid grid-cols-3 lg:grid-cols-6">
          {items.map((item, index) => (
            <div key={item.icon} className={`flex min-h-[154px] flex-col items-center justify-start px-1 py-5 text-center sm:min-h-[184px] sm:px-4 lg:min-h-[190px] ${index % 3 !== 2 ? "border-r-2 border-azul-profundo/15" : ""} ${index < 3 ? "border-b-2 border-azul-profundo/15 lg:border-b-0" : ""} ${index === 2 ? "lg:border-r-2 lg:border-azul-profundo/15" : ""}`}>
              <div className="mb-4 flex h-14 items-center justify-center sm:mb-5 sm:h-16 lg:h-20"><PackingIcon name={item.icon} /></div>
              <p className="font-sans text-[11px] font-semibold leading-snug text-azul-profundo sm:text-sm lg:text-base">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
