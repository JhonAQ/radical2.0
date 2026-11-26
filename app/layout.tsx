import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans, Yellowtail, Bebas_Neue, Kalam } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// UI Base
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Estilo 01: Display / Logo (Protest Riot)
const edosz = localFont({
  src: "../public/fonts/protest-riot.woff2",
  variable: "--font-edosz",
  display: "swap",
});

// Estilo 02: Brush Italic / Acentos (BlowBrush)
const blowBrush = localFont({
  src: "../public/fonts/blowbrush.woff2",
  variable: "--font-blowbrush",
  display: "swap",
});

// Estilo 03: Script / Slogan (Yellowtail)
const yellowtail = Yellowtail({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yellowtail",
  display: "swap",
});

// Condensada / Fechas y Eventos (Bebas Neue)
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

// Rotulado a mano / Fechas y temas de ponentes (Kalam)
const marker = Kalam({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-kalam",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0b2d36",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

// Texto e imagen que muestran WhatsApp, Facebook, etc. al compartir el enlace.
// ~155 caracteres: Google corta las descripciones más largas.
const shareDescription =
  "Campamento cristiano de jóvenes en la playa de Mejía, Arequipa, del 30 de diciembre al 3 de enero. Adoración, enseñanza y Año Nuevo 2027 juntos. ¡Inscríbete!";
const homeTitle = "Radical 2.0 | Campamento Nacional de Jóvenes 2027";

export const metadata: Metadata = {
  // Dominio público: las redes necesitan URLs absolutas para la imagen de vista previa.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://radical.ielp.org"),
  title: {
    default: homeTitle,
    template: "%s | Radical 2.0",
  },
  description: shareDescription,
  keywords: [
    "Radical 2.0",
    "campamento de verano",
    "campamento juvenil Arequipa",
    "campamento cristiano",
    "Campel Mejía",
    "Año Nuevo 2027",
    "Viviendo Radikalmente",
  ],
  authors: [{ name: "Radical 2.0" }],
  creator: "Radical 2.0",
  openGraph: {
    title: homeTitle,
    description: shareDescription,
    siteName: "Radical 2.0",
    images: [
      {
        url: "/assets/brand/og-radical-camp.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Radical 2.0 · Campamento de verano, 30 dic – 03 ene en Campel Mejía, Arequipa",
      },
    ],
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: shareDescription,
    images: ["/assets/brand/og-radical-camp.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${sans.variable} ${edosz.variable} ${blowBrush.variable} ${yellowtail.variable} ${bebas.variable} ${marker.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
