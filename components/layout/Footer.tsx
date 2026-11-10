import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";

const footerLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Programa", href: "#programa" },
  { label: "Ubicación", href: "#lugar" },
  { label: "Preguntas", href: "#faq" },
];

function SocialMark({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <span role="img" aria-label={name} className="flex h-10 w-10 items-center justify-center text-azul-profundo">
      {children}
    </span>
  );
}

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#efb77d] text-azul-profundo">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/assets/footer/arena-textura.webp')] bg-repeat opacity-[0.12] [background-size:1086px_36px]" />
      <div className="relative z-10 mx-auto flex min-h-[330px] max-w-7xl flex-col items-center px-6 pt-8 pb-10 sm:min-h-[360px] sm:pt-10 lg:grid lg:min-h-0 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-x-12 lg:px-10 lg:py-12">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <BrandLogo variant="black" width={210} className="w-36 sm:w-44 lg:w-40" />
        </div>

        <div className="mt-4 flex flex-col items-center gap-4 sm:mt-6 sm:gap-5 lg:mt-0 lg:items-end lg:gap-7">
          <nav aria-label="Navegación del pie de página" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-5 lg:justify-end">
            {footerLinks.map((link, index) => (
              <span key={link.label} className="inline-flex items-center gap-3 sm:gap-5">
                {index > 0 && <span aria-hidden="true" className="h-4 w-px bg-azul-profundo/20" />}
                <Link href={link.href} className="font-bebas text-sm tracking-wide text-azul-profundo/75 transition-colors hover:text-azul-profundo sm:text-base">
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>

          <div aria-label="Redes sociales" className="flex items-center justify-center gap-2 sm:gap-5">
            <SocialMark name="Instagram">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            </SocialMark>
            <SocialMark name="YouTube">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M23.2 7a3 3 0 0 0-2.1-2.1C19.2 4.4 12 4.4 12 4.4s-7.2 0-9.1.5A3 3 0 0 0 .8 7 31 31 0 0 0 .3 12a31 31 0 0 0 .5 5 3 3 0 0 0 2.1 2.1c1.9.5 9.1.5 9.1.5s7.2 0 9.1-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-5 31 31 0 0 0-.5-5ZM9.6 15.5v-7l6.2 3.5-6.2 3.5Z" /></svg>
            </SocialMark>
            <SocialMark name="TikTok">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M19.6 7.2a6.2 6.2 0 0 1-4.1-1.6v8.1a6 6 0 1 1-5.2-5.9v3.2a2.8 2.8 0 1 0 2 2.7V2.5h3.2a6.1 6.1 0 0 0 4.1 4.1v.6Z" /></svg>
            </SocialMark>
            <SocialMark name="Spotify">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M12 1.8A10.2 10.2 0 1 0 12 22.2 10.2 10.2 0 0 0 12 1.8Zm4.7 14.7a.8.8 0 0 1-1.1.3 10.8 10.8 0 0 0-8.1-1 .8.8 0 1 1-.5-1.5 12.4 12.4 0 0 1 9.4 1.1c.4.2.5.7.3 1.1Zm1.2-2.7a1 1 0 0 1-1.3.3 13 13 0 0 0-9.7-1.2 1 1 0 1 1-.6-1.8 15 15 0 0 1 11.2 1.4c.5.3.7.9.4 1.3Zm.1-2.8a1.1 1.1 0 0 1-1.5.4 15.4 15.4 0 0 0-11-1.3 1.1 1.1 0 1 1-.6-2.1 17.5 17.5 0 0 1 12.7 1.5c.5.3.7 1 .4 1.5Z" /></svg>
            </SocialMark>
          </div>
        </div>
        <p className="mt-4 pt-0 text-center font-bebas text-xs uppercase tracking-[0.12em] text-azul-profundo/75 sm:mt-5 sm:text-sm lg:col-start-1 lg:row-start-2 lg:mt-2 lg:text-left">
          Una generación que elige vivir radikalmente.
        </p>
        <p className="mt-2 text-center text-[11px] text-azul-profundo/60 lg:col-span-2 lg:row-start-3">
          © {new Date().getFullYear()} {" "}
          <Link href="https://jhonaq.me" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-azul-profundo hover:underline">
            Jhonatan Arias
          </Link>
          . Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
