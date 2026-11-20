import { NextResponse } from "next/server";
import { INVITE_COOKIE } from "@/utils/invite";

/** Olvida la invitación guardada y vuelve a la inscripción normal. */
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/inscripcion", new URL(request.url).origin));
  response.cookies.delete(INVITE_COOKIE);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
