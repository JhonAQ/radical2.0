"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { MenuIcon, CloseIcon, ArrowRightIcon } from "@/components/common/Icons";
import { CAMP_CONFIG } from "@/config/site";

export function Navbar() {
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const openIconRef = useRef<HTMLSpanElement>(null);
  const closeIconRef = useRef<HTMLSpanElement>(null);
  const isOpenRef = useRef(false);

  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  function openMenu() {
    isOpenRef.current = true;
    if (drawerRef.current) drawerRef.current.style.display = "block";
    if (backdropRef.current) backdropRef.current.style.display = "block";
    if (openIconRef.current) openIconRef.current.style.display = "none";
    if (closeIconRef.current) closeIconRef.current.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    isOpenRef.current = false;
    if (drawerRef.current) drawerRef.current.style.display = "none";
    if (backdropRef.current) backdropRef.current.style.display = "none";
    if (openIconRef.current) openIconRef.current.style.display = "block";
    if (closeIconRef.current) closeIconRef.current.style.display = "none";
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    try {
      fetch("/api/debug-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "NAVBAR_HAMBURGER_CLICKED", wasOpen: isOpenRef.current, time: new Date().toISOString() }),
      }).catch(() => {});
    } catch {}
    if (isOpenRef.current) closeMenu();
    else openMenu();
  }

  return (
    <>
      {/* ── HEADER ── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          padding: "0.5rem 0",
          background: "linear-gradient(to bottom, rgba(11,45,54,0.85), rgba(11,45,54,0.3), transparent)",
        }}
      >
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          {/* Logo */}
          <Link href="#inicio" style={{ display: "flex", alignItems: "center" }}>
            <BrandLogo variant="secundario" width={110} priority className="w-28 h-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {CAMP_CONFIG.navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-xs font-extrabold uppercase tracking-wider text-white/85 hover:text-amarillo transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA + Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link
              href={CAMP_CONFIG.registrationUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.875rem",
                borderRadius: "0.75rem",
                background: "#fcc408",
                color: "#0b2d36",
                fontWeight: 800,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
              }}
            >
              <span>Inscríbete</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>

            {/* Botón hamburguesa — SIN React state, DOM directo */}
            <button
              type="button"
              aria-label="Menú"
              onClick={toggleMenu}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.5rem",
                borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
              className="lg:hidden"
            >
              <span ref={openIconRef} style={{ display: "block" }}>
                <MenuIcon className="w-6 h-6" />
              </span>
              <span ref={closeIconRef} style={{ display: "none" }}>
                <CloseIcon className="w-6 h-6" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── BACKDROP — siempre en DOM, oculto por defecto ── */}
      <div
        ref={backdropRef}
        onClick={closeMenu}
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.75)",
        }}
      />

      {/* ── DRAWER — siempre en DOM, oculto por defecto ── */}
      <div
        ref={drawerRef}
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#0b2d36",
          paddingTop: "1.25rem",
          paddingBottom: "2rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "0.5rem" }}>
          <BrandLogo variant="secundario" width={100} priority className="w-20 h-auto" />
          <button
            type="button"
            onClick={closeMenu}
            style={{
              padding: "0.5rem",
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
          {CAMP_CONFIG.navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={closeMenu}
              style={{
                display: "block",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 800,
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href={CAMP_CONFIG.registrationUrl}
          onClick={closeMenu}
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
  );
}
