"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function GoogleLoginButton({ next }: { next?: "admin" }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setPending(true);
    setError("");
    try {
      const supabase = createClient();
      // Use the canonical site URL from env if set (avoids Vercel preview URLs
      // being used as the OAuth callback origin). Falls back to window.location.origin
      // for local development.
      const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const callback = new URL("/auth/callback", origin);
      if (next === "admin") callback.searchParams.set("next", "/admin");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      if (error) throw error;
    } catch {
      setError("No pudimos conectar con Google. Inténtalo nuevamente.");
      setPending(false);
    }
  }

  return <div>
    <button type="button" onClick={() => void signIn()} disabled={pending} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#0b2d36]/20 bg-white px-5 py-3 font-bold text-[#0b2d36] shadow-sm transition hover:bg-[#f5f8f6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#009da8] disabled:cursor-wait disabled:opacity-60">
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.9h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.2Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4.1 1.9-6.8 1.9-5.3 0-9.8-3.6-11.4-8.4H5.7v5.4A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.4a12.2 12.2 0 0 1 0-7.8v-5.4H5.7a20.2 20.2 0 0 0 0 18.6l6.9-5.4Z"/><path fill="#EA4335" d="M24 11.2c3 0 5.7 1 7.8 3.1l5.8-5.8A19.6 19.6 0 0 0 24 3 20.4 20.4 0 0 0 5.7 14.2l6.9 5.4c1.6-4.8 6.1-8.4 11.4-8.4Z"/></svg>
      {pending ? "Conectando con Google…" : "Continuar con Google"}
    </button>
    {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#b42318]">{error}</p>}
  </div>;
}
