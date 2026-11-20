export type Speaker = {
  slug: string;
  /** Nombre completo, para lectores de pantalla y textos. */
  name: string;
  /** Tratamiento: Ps., Hna., Hno. */
  title: string;
  /** Líneas del nombre pintado sobre el brochazo. */
  display: [string, string?];
  role: string;
  topic: string;
  bio: string;
  /** Recorte sin fondo (webp con transparencia). */
  image: { src: string; width: number; height: number };
  /**
   * Alto del recorte relativo al escenario. Ajusta cada foto para que las
   * cabezas queden a una escala parecida aunque el encuadre original varíe.
   */
  fit: number;
  /** Ajuste extra solo en móvil (multiplica a `fit`). */
  mobileScale?: number;
  accent: "naranja" | "turquesa";
};

// Temas tomados del programa oficial.
export const SPEAKERS: Speaker[] = [
  {
    slug: "ruby-barrantes",
    name: "Ruby Barrantes",
    title: "Hna.",
    display: ["Ruby", "Barrantes"],
    role: "30 dic · Noche",
    topic: "Introducción a Radical",
    bio: "“De vuelta a la raíz, para un nuevo nivel.” Volver a lo esencial de la fe para empezar el campamento con el corazón dispuesto.",
    image: { src: "/assets/ponentes/recortes/ruby-barrantes.webp", width: 653, height: 1000 },
    fit: 0.85,
    accent: "turquesa",
  },
  {
    slug: "paola-vargas",
    name: "Paola Vargas",
    title: "Hna.",
    display: ["Paola", "Vargas"],
    role: "31 dic · Mañana",
    topic: "Cuando llega la tentación",
    bio: "“No todo lo que puedo hacer me conviene.” Aprender a reconocer la tentación, enfrentarla y tomar decisiones que honren a Dios.",
    image: { src: "/assets/ponentes/recortes/paola-vargas.webp", width: 818, height: 892 },
    fit: 0.84,
    accent: "naranja",
  },
  {
    slug: "brian-inga",
    name: "Brian Inga",
    title: "Ps.",
    display: ["Brian", "Inga"],
    role: "31 dic · Noche",
    topic: "La presión de los demás",
    bio: "“¿Cristo o encajar?” Mantenerse firme en las convicciones aunque haya presión de amigos, redes sociales o del entorno.",
    image: { src: "/assets/ponentes/recortes/bryan.webp", width: 529, height: 833 },
    fit: 0.98,
    accent: "turquesa",
  },
  {
    slug: "diego-valero",
    name: "Diego Valero",
    title: "Hno.",
    display: ["Diego", "Valero"],
    role: "1 ene · Noche",
    topic: "Decisiones que construyen mi futuro",
    bio: "“Mi fe también se demuestra en mis decisiones.” Buscar la dirección de Dios en los estudios, las amistades y los proyectos.",
    image: { src: "/assets/ponentes/recortes/diego-valero.webp", width: 602, height: 497 },
    fit: 1.02,
    mobileScale: 1.1 / 1.2,
    accent: "turquesa",
  },
  {
    slug: "daniel-ramos",
    name: "Daniel Ramos",
    title: "Ps.",
    display: ["Daniel", "Ramos"],
    role: "2 ene · Mañana y noche",
    topic: "Viviendo radicalmente",
    bio: "“Ahora me toca vivir lo que creo.” Llevar la fe del campamento a la vida de todos los días.",
    image: { src: "/assets/ponentes/recortes/daniel-ramos.webp", width: 278, height: 396 },
    fit: 0.95,
    accent: "naranja",
  },
];
