"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Bloquea los botones y campos de un formulario mientras se envía, para que
 * un doble clic no apruebe o registre dos veces. Debe ir dentro del <form>.
 */
export function PendingFieldset({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <fieldset disabled={pending} aria-busy={pending} className={`min-w-0 ${pending ? "cursor-wait [&_button]:opacity-60" : ""} ${className}`}>
      {children}
    </fieldset>
  );
}
