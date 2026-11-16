import { CAMP_CONFIG } from "@/config/site";

/** Fecha de inicio del campamento (YYYY-MM-DD, hora de Lima). */
const campStart = CAMP_CONFIG.targetCountdownDate.slice(0, 10);

/** Edad que tendrá el campista el primer día del campamento. */
export function ageAtCamp(birth: string): number | null {
  const [by, bm, bd] = birth.slice(0, 10).split("-").map(Number);
  const [cy, cm, cd] = campStart.split("-").map(Number);
  if (!by || !bm || !bd) return null;
  let age = cy - by;
  if (cm < bm || (cm === bm && cd < bd)) age -= 1;
  return age;
}

/** Menor de 18 años al inicio del campamento. */
export function isMinorAtCamp(birth: string): boolean {
  const age = ageAtCamp(birth);
  return age !== null && age >= 0 && age < 18;
}

export const TRAVEL_PERMIT_NOTICE =
  "Para viajar necesitarás un permiso de viaje notarial firmado por tus padres o tutores.";
