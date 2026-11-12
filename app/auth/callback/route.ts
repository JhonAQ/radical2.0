import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext === "/admin/reset" || requestedNext === "/admin" ? requestedNext : "/inscripcion";
  if (code && !url.searchParams.has("error")) {
    const supabase = createClient(await cookies());
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(new URL(next, url.origin));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  const response = NextResponse.redirect(new URL(next === "/admin/reset" ? "/admin?error=reset_link" : "/login?error=google", url.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
