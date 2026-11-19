// Preguntas frecuentes: las usa la sección FAQ de la landing y los datos estructurados (JSON-LD).
export const buildFaq = (lastDay: string) => [
  { question: "¿Desde dónde saldremos?", answer: "La salida hacia el campamento será desde Arequipa. El punto de encuentro y la hora se comunicarán para esta edición." },
  { question: "¿Puedo pagar por partes?", answer: `¡Sí! Puedes reservar tu cupo con S/50 y completar el saldo antes del inicio del campamento. Si reservas hasta el ${lastDay}, aprovechas el precio de preventa de S/200.` },
  { question: "¿Qué incluye el precio?", answer: "Incluye hospedaje, alimentación completa, programación y materiales, y acceso a todas las actividades del campamento." },
  { question: "¿La preventa incluye lo mismo que el precio regular?", answer: "Sí. Ambas tarifas incluyen la misma experiencia. La diferencia es el precio según la fecha en que te inscribas." },
  { question: "¿Hay límite de edad?", answer: "El campamento está pensado para adolescentes y jóvenes. No hay un límite superior de edad: si quieres vivir esta experiencia, eres bienvenido." },
];
