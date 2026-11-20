export const INVITE_COOKIE = "radical_invite";

export function isInviteToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(value);
}

export type InviteState = "open" | "full" | "expired" | "revoked";
export type InviteInfo = { plan: "preventa" | "regular"; amount: number; slotsLeft: number; state: InviteState };
