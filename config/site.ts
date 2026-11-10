export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface CampEventConfig {
  name: string;
  slogan: string;
  tagline: string;
  dates: {
    badge: string;
    range: string;
    year: string;
  };
  location: {
    venue: string;
    city: string;
    region: string;
    full: string;
  };
  targetCountdownDate: string; // ISO date string
  registrationUrl: string;
  navItems: NavItem[];
}

export const CAMP_CONFIG: CampEventConfig = {
  name: "Radical 2.0",
  tagline: "Next Level",
  slogan: "Viviendo Radikalmente",
  dates: {
    badge: "Campamento de Verano",
    range: "30 DIC — 03 ENE",
    year: "2026 – 2027",
  },
  location: {
    venue: "Campel Mejía",
    city: "Mejía",
    region: "Arequipa",
    full: "Campel Mejía, Arequipa, Perú",
  },
  // Fecha objetivo del campamento
  targetCountdownDate: "2026-12-30T09:00:00-05:00",
  registrationUrl: "#inscribirme",
  navItems: [
    { id: "inicio", label: "Inicio", href: "#inicio" },
    { id: "campamento", label: "El Campamento", href: "#campamento" },
    { id: "actividades", label: "Actividades", href: "#actividades" },
    { id: "programa", label: "Programa", href: "#programa" },
    { id: "que-llevar", label: "Qué llevar", href: "#que-llevar" },
    { id: "inscribirme", label: "Precios", href: "#inscribirme" },
    { id: "lugar", label: "Ubicación", href: "#lugar" },
    { id: "faq", label: "Preguntas", href: "#faq" },
  ],
};
