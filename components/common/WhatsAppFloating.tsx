"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { WHATSAPP_URL } from "@/config/contact";
import { WhatsAppMark } from "@/components/common/WhatsAppMark";

export function WhatsAppFloating() {
  const [isOutsideHero, setIsOutsideHero] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());

  useEffect(() => {
    const hero = document.getElementById("inicio");
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsOutsideHero(!entry.isIntersecting);
    }, { threshold: 0 });

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {isOutsideHero && (
        <motion.a
          key="whatsapp-floating"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escríbenos por WhatsApp para hacer una consulta sobre Radical 2.0"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.94 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[100] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_8px_24px_rgba(4,45,30,0.3)] transition-[background-color,box-shadow] duration-200 hover:bg-[#20bd5a] hover:shadow-[0_10px_28px_rgba(4,45,30,0.38)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0b4931] active:scale-95 lg:bottom-6 lg:right-6 lg:h-14 lg:w-auto lg:gap-2.5 lg:px-5"
        >
          <WhatsAppMark className="h-6 w-6 shrink-0" />
          <span className="sr-only lg:not-sr-only lg:font-sans lg:text-sm lg:font-semibold">¿Dudas? WhatsApp</span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
