"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { HeroBackground } from "./HeroBackground";
import { BrandLogo } from "@/components/common/BrandLogo";
import { HeroEventDetails } from "./HeroEventDetails";
import { HeroCta } from "./HeroCta";
import { HeroScrollCue } from "./HeroScrollCue";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Safety: si GSAP no ejecuta, los elementos ya son visibles (sin opacity:0 inline)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });

      tl
        .fromTo(
          "[data-anim='logo']",
          { opacity: 0, scale: 0.85, y: 30 },
          {
            opacity: 1, scale: 1, y: 0, duration: 0.9,
            onComplete: () => {
              gsap.set("[data-anim='logo']", { clearProps: "all" });
            },
          }
        )
        .fromTo(
          "[data-anim='details']",
          { opacity: 0, y: 32 },
          {
            opacity: 1, y: 0, duration: 0.7,
            onComplete: () => gsap.set("[data-anim='details']", { clearProps: "all" }),
          },
          "-=0.45"
        )
        .fromTo(
          "[data-anim='cta']",
          { opacity: 0, y: 24, scale: 0.92 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "back.out(1.6)",
            onComplete: () => gsap.set("[data-anim='cta']", { clearProps: "all" }),
          },
          "-=0.3"
        )
        .fromTo(
          "[data-anim='scroll-cue']",
          { opacity: 0, y: 8 },
          {
            opacity: 1, y: 0, duration: 0.5,
            onComplete: () => gsap.set("[data-anim='scroll-cue']", { clearProps: "all" }),
          },
          "-=0.1"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="inicio"
      className="relative w-full h-[100dvh] flex flex-col overflow-hidden"
      ref={containerRef}
    >
      <HeroBackground />

      {/* Gradiente inferior solo en mobile */}
      <div className="sm:hidden absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-azul-profundo/80 via-azul-profundo/40 to-transparent z-[5] pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6 h-full flex flex-col pt-16 sm:pt-20 md:pt-24 pb-5 sm:pb-8">

        {/* ── MOBILE LAYOUT ── */}
        <div className="flex-1 sm:hidden flex items-center justify-center">
          {/* Sin opacity:0 inline — GSAP lo setea desde el fromTo */}
          <div
            data-anim="logo"
            className="w-full max-w-[85vw] flex items-center justify-center will-change-transform"
          >
            <BrandLogo
              variant="principal"
              priority
              width={550}
              className="w-full h-auto object-contain drop-shadow-[0_12px_36px_rgba(0,0,0,0.65)] animate-float"
            />
          </div>
        </div>

        <div className="sm:hidden flex flex-col items-center gap-12 mb-10">
          <div data-anim="details">
            <HeroEventDetails />
          </div>
          <div data-anim="cta">
            <HeroCta />
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (sm+) ── */}
        <div className="hidden sm:flex flex-1 flex-col items-center justify-center text-center gap-6 md:gap-7">
          <div
            data-anim="logo"
            className="w-full max-w-[380px] md:max-w-[430px] lg:max-w-[500px] flex items-center justify-center will-change-transform"
          >
            <BrandLogo
              variant="principal"
              priority
              width={500}
              className="w-full h-auto object-contain drop-shadow-[0_12px_36px_rgba(0,0,0,0.65)]"
            />
          </div>
          <div data-anim="details">
            <HeroEventDetails />
          </div>
          <div data-anim="cta">
            <HeroCta />
          </div>
        </div>

        {/* Scroll Cue */}
        <div data-anim="scroll-cue" className="flex justify-center">
          <HeroScrollCue />
        </div>

      </div>
    </section>
  );
}
