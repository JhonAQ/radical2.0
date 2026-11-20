import React from "react";
import Image from "next/image";
import { BRAND_LOGOS, BrandLogoVariant } from "@/utils/brand";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  alt?: string;
  /** Ancho real en pantalla; evita descargar una versión más grande de la necesaria. */
  sizes?: string;
}

export function BrandLogo({
  variant = "principal",
  className = "",
  priority = false,
  width,
  height,
  alt = "Radical 2.0 · Next Level · Viviendo Radikalmente",
  sizes,
}: BrandLogoProps) {
  const logo = BRAND_LOGOS[variant];

  // Si se pasan width y height específicos, se usan; de lo contrario se usa la resolución nativa
  const targetWidth = width ?? (variant === "secundario" ? 220 : 680);
  const targetHeight =
    height ?? Math.round(targetWidth / logo.aspectRatio);

  return (
    <Image
      src={logo.webp}
      alt={alt}
      width={targetWidth}
      height={targetHeight}
      priority={priority}
      sizes={sizes}
      className={`h-auto object-contain ${className}`}
    />
  );
}
