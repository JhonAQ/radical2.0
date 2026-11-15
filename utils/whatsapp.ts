/** Normaliza un celular peruano (9 dígitos) a formato internacional y arma el enlace de WhatsApp. */
export function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 9 ? `51${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
