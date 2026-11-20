import { NextResponse } from "next/server";
import { INVITE_COOKIE, isInviteToken } from "@/utils/invite";

/**
 * Enlace de invitación (pago ya recibido por el equipo). Guarda el código en una cookie
 * para que sobreviva al inicio de sesión con Google y lleva a la inscripción, que lo lee.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = new URL(request.url).origin;
  if (!isInviteToken(token)) return NextResponse.redirect(new URL("/inscripcion", origin));
  const response = NextResponse.redirect(new URL("/inscripcion", origin));
  response.cookies.set(INVITE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
