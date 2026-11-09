import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans, Yellowtail, Bebas_Neue } from "next/font/google";
import "./globals.css";

// UI Base
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Estilo 01: Display / Logo (Protest Riot)
const edosz = localFont({
  src: "../public/fonts/protest-riot.ttf",
  variable: "--font-edosz",
  display: "swap",
});

// Estilo 02: Brush Italic / Acentos (BlowBrush)
const blowBrush = localFont({
  src: "../public/fonts/blowbrush.ttf",
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

export const viewport: Viewport = {
  themeColor: "#0b2d36",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://radical2.com"),
  title: {
    default: "Radical 2.0 — Viviendo Radikalmente",
    template: "%s | Radical 2.0",
  },
  description:
    "Experiencia oficial Radical 2.0 Tropical. Comunidad, eventos, cultura y estilo de vida con energía tropical auténtica.",
  keywords: [
    "Radical 2.0",
    "Radical",
    "Viviendo Radikalmente",
    "Next Level",
    "Eventos Radical",
    "Comunidad Radical",
  ],
  authors: [{ name: "Radical 2.0" }],
  creator: "Radical 2.0",
  openGraph: {
    title: "Radical 2.0 — Viviendo Radikalmente",
    description:
      "Experiencia oficial Radical 2.0 Tropical. Comunidad, eventos, cultura y estilo de vida con energía tropical auténtica.",
    siteName: "Radical 2.0",
    images: [
      {
        url: "/assets/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Radical 2.0 Tropical",
      },
    ],
    locale: "es_LA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Radical 2.0 — Viviendo Radikalmente",
    description:
      "Experiencia oficial Radical 2.0 Tropical. Comunidad, eventos, cultura y estilo de vida con energía tropical auténtica.",
    images: ["/assets/brand/og-image.png"],
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
      className={`h-full antialiased ${sans.variable} ${edosz.variable} ${blowBrush.variable} ${yellowtail.variable} ${bebas.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
