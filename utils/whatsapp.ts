/** Normaliza un celular peruano (9 dígitos) a formato internacional y arma el enlace de WhatsApp. */
export function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 9 ? `51${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Aviso de una observación: qué se revisó, la nota y dónde corregirlo. */
export function observationMessage(firstName: string, what: string, note: string) {
  return `Hola ${firstName}, te escribimos del equipo de Radical 2.0. Revisamos ${what} y tiene una observación: ${note}\n\nPuedes corregirlo desde tu cuenta en https://radical.ielp.org/mi-inscripcion`;
}
