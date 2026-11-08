import Image from "next/image";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Mobile Background */}
      <div className="relative w-full h-full md:hidden">
        <Image
          src="/assets/hero/hero-mobile.webp"
          alt="Campamento Radical 2.0 en la playa"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          quality={95}
        />
        {/* Soft vignette gradient for readability on mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-azul-profundo/60 via-transparent to-azul-profundo/80" />
      </div>

      {/* Desktop Background */}
      <div className="relative hidden md:block w-full h-full">
        <Image
          src="/assets/hero/hero-desktop.webp"
          alt="Campamento Radical 2.0 en la playa al atardecer"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          quality={95}
        />
        {/* Soft vignette and radial gradient for focal centering */}
        <div className="absolute inset-0 bg-gradient-to-t from-azul-profundo/85 via-azul-profundo/20 to-azul-profundo/40" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-multiply"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 40%, transparent 40%, rgba(11, 45, 54, 0.7) 100%)",
          }}
        />
      </div>
    </div>
  );
}
