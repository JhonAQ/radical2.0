"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { WhatsAppMark } from "@/components/common/WhatsAppMark";
import { WHATSAPP_URL } from "@/config/contact";

const footerLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Programa", href: "#programa" },
  { label: "Ubicación", href: "#lugar" },
  { label: "Preguntas", href: "#faq" },
];

const footerViewport = { once: true, amount: 0.35, margin: "0px" } as const;
const footerEase = [0.22, 1, 0.36, 1] as const;

function SocialMark({ name, children, order }: { name: string; children: React.ReactNode; order: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span initial={reduceMotion ? false : { opacity: 0, y: 10, rotate: -5 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={footerViewport} transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : order * 0.09, ease: footerEase }} role="img" aria-label={name} className="flex h-10 w-10 items-center justify-center text-azul-profundo">
      {children}
    </motion.span>
  );
}

export function Footer() {
  const reduceMotion = Boolean(useReducedMotion());
  const reveal = (delay = 0, distance = 10) => ({
    initial: reduceMotion ? false as const : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: footerViewport,
    transition: { duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : delay, ease: footerEase },
  });
  return (
    <footer className="relative isolate overflow-hidden bg-[#efb77d] text-azul-profundo">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/assets/footer/arena-textura.webp')] bg-repeat opacity-[0.12] [background-size:1086px_36px]" />
      <div className="relative z-10 mx-auto flex min-h-[330px] max-w-7xl flex-col items-center px-6 pt-8 pb-10 sm:min-h-[360px] sm:pt-10 lg:grid lg:min-h-0 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-x-12 lg:px-10 lg:py-12">
        <motion.div {...reveal(0, 16)} initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96, rotate: -1.5 }} whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }} className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <BrandLogo variant="black" width={210} className="w-36 sm:w-44 lg:w-40" />
        </motion.div>

        <div className="mt-4 flex flex-col items-center gap-4 sm:mt-6 sm:gap-5 lg:mt-0 lg:items-end lg:gap-7">
          <nav aria-label="Navegación del pie de página" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-5 lg:justify-end">
            {footerLinks.map((link, index) => (
              <motion.span {...reveal(0.08 + index * 0.07, 8)} key={link.label} className="inline-flex items-center gap-3 sm:gap-5">
                {index > 0 && <span key="separator" aria-hidden="true" className="h-4 w-px bg-azul-profundo/20" />}
                <Link key="link" href={link.href} className="relative font-bebas text-sm tracking-wide text-azul-profundo/75 transition-colors hover:text-azul-profundo focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-azul-profundo after:absolute after:-bottom-1 after:inset-x-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-azul-profundo after:transition-transform hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none sm:text-base">
                  {link.label}
                </Link>
              </motion.span>
            ))}
          </nav>

          <div aria-label="Redes sociales" className="flex items-center justify-center gap-2 sm:gap-5">
            <SocialMark name="Instagram" order={0}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            </SocialMark>
            <motion.div {...reveal(0.09, 10)}>
              <motion.a whileHover={reduceMotion ? undefined : { y: -3, scale: 1.08 }} whileTap={reduceMotion ? undefined : { scale: 0.94 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center text-azul-profundo transition-colors hover:text-[#168c4b] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul-profundo">
                <WhatsAppMark className="h-[23px] w-[23px]" />
              </motion.a>
            </motion.div>
            <SocialMark name="TikTok" order={2}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M19.6 7.2a6.2 6.2 0 0 1-4.1-1.6v8.1a6 6 0 1 1-5.2-5.9v3.2a2.8 2.8 0 1 0 2 2.7V2.5h3.2a6.1 6.1 0 0 0 4.1 4.1v.6Z" /></svg>
            </SocialMark>
            <SocialMark name="Spotify" order={3}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M12 1.8A10.2 10.2 0 1 0 12 22.2 10.2 10.2 0 0 0 12 1.8Zm4.7 14.7a.8.8 0 0 1-1.1.3 10.8 10.8 0 0 0-8.1-1 .8.8 0 1 1-.5-1.5 12.4 12.4 0 0 1 9.4 1.1c.4.2.5.7.3 1.1Zm1.2-2.7a1 1 0 0 1-1.3.3 13 13 0 0 0-9.7-1.2 1 1 0 1 1-.6-1.8 15 15 0 0 1 11.2 1.4c.5.3.7.9.4 1.3Zm.1-2.8a1.1 1.1 0 0 1-1.5.4 15.4 15.4 0 0 0-11-1.3 1.1 1.1 0 1 1-.6-2.1 17.5 17.5 0 0 1 12.7 1.5c.5.3.7 1 .4 1.5Z" /></svg>
            </SocialMark>
          </div>
        </div>
        <motion.p {...reveal(0.2, 8)} className="mt-4 pt-0 text-center font-bebas text-xs uppercase tracking-[0.12em] text-azul-profundo/75 sm:mt-5 sm:text-sm lg:col-start-1 lg:row-start-2 lg:mt-2 lg:text-left">
          Una generación que elige vivir radikalmente.
        </motion.p>
        <motion.p {...reveal(0.28, 6)} className="mt-2 text-center text-[11px] text-azul-profundo/60 lg:col-span-2 lg:row-start-3">
          © {new Date().getFullYear()} {" "}
          <Link key="author" href="https://jhonaq.me" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-azul-profundo hover:underline">
            Jhonatan Arias
          </Link>
          . Todos los derechos reservados.
        </motion.p>
      </div>
    </footer>
  );
}
