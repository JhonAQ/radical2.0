const TZ = "America/Lima";

/** Fecha de hoy en Lima como [año, mes (1-12), día]. */
export function limaToday(now = new Date()): [number, number, number] {
  const [y, m, d] = now
    .toLocaleDateString("en-CA", { timeZone: TZ })
    .split("-")
    .map(Number);
  return [y, m, d];
}

function parseBirth(birth: string): [number, number, number] | null {
  const [y, m, d] = birth.slice(0, 10).split("-").map(Number);
  return y && m && d ? [y, m, d] : null;
}

/** Edad cumplida hoy (hora de Lima). Vacío si la fecha no es válida. */
export function ageFromBirth(birth: string, now = new Date()): number | null {
  const b = parseBirth(birth);
  if (!b) return null;
  const [ty, tm, td] = limaToday(now);
  let age = ty - b[0];
  if (tm < b[1] || (tm === b[1] && td < b[2])) age -= 1;
  return age;
}

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export type BirthdayEntry<T> = { item: T; day: number; month: number; monthLabel: string; turns: number };

/**
 * Cumpleaños de diciembre y enero. La ventana es el próximo diciembre
 * (o el actual) y el enero siguiente; en enero, la ventana es la que está en curso.
 * `turns` es la edad que cumple en su cumpleaños.
 */
export function decemberJanuaryBirthdays<T extends { birth_date: string }>(items: T[], now = new Date()): BirthdayEntry<T>[] {
  const [ty, tm] = limaToday(now);
  const decYear = tm === 1 ? ty - 1 : ty;
  const out: BirthdayEntry<T>[] = [];
  for (const item of items) {
    const b = parseBirth(item.birth_date);
    if (!b || (b[1] !== 12 && b[1] !== 1)) continue;
    const year = b[1] === 12 ? decYear : decYear + 1;
    out.push({ item, day: b[2], month: b[1], monthLabel: MONTHS[b[1] - 1], turns: year - b[0] });
  }
  // Diciembre primero, luego enero; por día dentro de cada mes.
  return out.sort((a, b) => (a.month === b.month ? a.day - b.day : a.month === 12 ? -1 : 1));
}
