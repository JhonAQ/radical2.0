/**
 * brand.ts
 * Configuración central y manifiesto tipado de los 4 logotipos oficiales de Radical 2.0.
 * Cada logotipo está aislado con fondo transparente en formato WebP de alta fidelidad y PNG fallback,
 * sin duplicados ni versiones redundantes.
 */

export interface BrandLogoAsset {
  name: string;
  description: string;
  recommendedUse: string;
  width: number;
  height: number;
  aspectRatio: number;
  webp: string;
  png: string;
}

export type BrandLogoVariant =
  | "principal"
  | "secundario"
  | "icono"
  | "black";

export const BRAND_LOGOS: Record<BrandLogoVariant, BrandLogoAsset> = {
  principal: {
    name: "Logo Principal",
    description: "Emblema completo con tipografía de trazo seco y detalles tropicales a todo color.",
    recommendedUse: "Hero section, portadas, material institucional y cabecera en páginas de aterrizaje.",
    width: 1254,
    height: 920,
    aspectRatio: 1254 / 920,
    webp: "/assets/brand/logo-principal.webp",
    png: "/assets/brand/logo-principal.png",
  },
  secundario: {
    name: "Logo Secundario",
    description: "Composición horizontal optimizada para barras de navegación y formatos apaisados.",
    recommendedUse: "Navbar, header fijo sticky, footers compactos y barras laterales.",
    width: 1284,
    height: 601,
    aspectRatio: 1284 / 601,
    webp: "/assets/brand/logo-secundario.webp",
    png: "/assets/brand/logo-secundario.png",
  },
  icono: {
    name: "Logo Icono",
    description: "Glifo icónico de la letra 'R' con trazos gestuales tropicales.",
    recommendedUse: "Favicons, avatares, iconos de aplicación, marcas de agua y badges reducidos.",
    width: 885,
    height: 904,
    aspectRatio: 885 / 904,
    webp: "/assets/brand/logo-icono.webp",
    png: "/assets/brand/logo-icono.png",
  },
  black: {
    name: "Logo Black",
    description: "Versión monocromática con trazos negros y relleno blanco de las letras intacto.",
    recommendedUse: "Fondos claros, fondos oscuros, impresión a una tinta y aplicaciones monocromáticas.",
    width: 1024,
    height: 769,
    aspectRatio: 1024 / 769,
    webp: "/assets/brand/logo-black.webp",
    png: "/assets/brand/logo-black.png",
  },
};
