import React from "react";
import Image from "next/image";
import { BRAND_LOGOS, BrandLogoVariant } from "@/utils/brand";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export function BrandLogo({
  variant = "principal",
  className = "",
  priority = false,
  width,
  height,
}: BrandLogoProps) {
  const logo = BRAND_LOGOS[variant];

  // Si se pasan width y height específicos, se usan; de lo contrario se usa la resolución nativa
  const targetWidth = width ?? (variant === "secundario" ? 220 : 680);
  const targetHeight =
    height ?? Math.round(targetWidth / logo.aspectRatio);

  return (
    <Image
      src={logo.webp}
      alt={logo.name}
      width={targetWidth}
      height={targetHeight}
      priority={priority}
      className={`h-auto object-contain ${className}`}
    />
  );
}
