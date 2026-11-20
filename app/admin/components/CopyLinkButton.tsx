"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copia el enlace:", url);
        }
      }}
      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#082f39] px-3 text-xs font-bold text-white hover:bg-[#0b4248]"
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? "Copiado" : "Copiar enlace"}
    </button>
  );
}
