import Image from "next/image";
import { BRAND_LOGOS, type BrandLogoVariant } from "@/utils/brand";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  format?: "webp" | "png";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  alt?: string;
}

/**
 * Componente oficial de logotipo de Radical 2.0.
 * Utiliza los assets optimizados transparentes en formato WebP con fallback PNG.
 */
export function BrandLogo({
  variant = "principal",
  format = "webp",
  className = "",
  width,
  height,
  priority = false,
  alt,
}: BrandLogoProps) {
  const logo = BRAND_LOGOS[variant] ?? BRAND_LOGOS.principal;
  const src = format === "webp" ? logo.webp : logo.png;
  const resolvedAlt = alt || `${logo.name} Radical 2.0`;

  const finalWidth = width ?? (height ? Math.round(height * logo.aspectRatio) : logo.width);
  const finalHeight = height ?? (width ? Math.round(width / logo.aspectRatio) : logo.height);

  return (
    <Image
      src={src}
      alt={resolvedAlt}
      width={finalWidth}
      height={finalHeight}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}

export default BrandLogo;
