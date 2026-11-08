"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { MenuIcon, CloseIcon, ArrowRightIcon } from "@/components/common/Icons";
import { CAMP_CONFIG } from "@/config/site";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-azul-profundo/90 backdrop-blur-md shadow-md py-1.5 sm:py-2"
            : "bg-gradient-to-b from-azul-profundo/80 via-azul-profundo/30 to-transparent py-2 sm:py-2.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="#inicio"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center"
            >
              <BrandLogo variant="secundario" width={110} priority className="w-28 sm:w-24 md:w-28 h-auto" />
            </Link>

            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {CAMP_CONFIG.navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveSection(item.id)}
                    className={`relative py-1 text-xs xl:text-sm font-extrabold uppercase tracking-wider transition-colors ${
                      isActive ? "text-amarillo" : "text-white/85 hover:text-amarillo"
                    }`}
                  >
                    {item.label}
                    {isActive && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amarillo rounded-full" />}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href={CAMP_CONFIG.registrationUrl}
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#fcc408] hover:bg-[#e6b007] text-azul-profundo text-[11px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(252,196,8,0.45)] hover:shadow-[0_0_22px_rgba(252,196,8,0.75)]"
              >
                <span>Inscríbete</span>
                <ArrowRightIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Link>

              {/* Botón hamburguesa */}
              <button
                type="button"
                aria-label="Abrir menú"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileOpen((prev) => !prev);
                }}
                style={{ WebkitTapHighlightColor: "transparent", cursor: "pointer" }}
                className="lg:hidden relative z-50 p-2 rounded-xl text-white bg-white/10"
              >
                {isMobileOpen
                  ? <CloseIcon className="w-6 h-6" />
                  : <MenuIcon className="w-6 h-6" />
                }
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DRAWER: condicional, z-index máximo, sin animaciones */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.75)" }}
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: "#0b2d36",
              paddingLeft: "1.5rem",
              paddingRight: "1.5rem",
              paddingTop: "1.25rem",
              paddingBottom: "2rem",
            }}
          >
            {/* Header del drawer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "0.5rem" }}>
              <BrandLogo variant="secundario" width={100} priority className="w-20 h-auto" />
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                style={{ WebkitTapHighlightColor: "transparent", cursor: "pointer", padding: "0.5rem", color: "white" }}
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Nav links */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
              {CAMP_CONFIG.navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => { setActiveSection(item.id); setIsMobileOpen(false); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      color: isActive ? "#ffc629" : "rgba(255,255,255,0.85)",
                      background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                      fontWeight: 800,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA */}
            <Link
              href={CAMP_CONFIG.registrationUrl}
              onClick={() => setIsMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.875rem 1.25rem",
                borderRadius: "0.75rem",
                background: "#fcc408",
                color: "#0b2d36",
                fontWeight: 800,
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
              }}
            >
              <span>Inscribirme al Campamento</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </>
  );
}
