"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Botón de envío que pide confirmación antes de una acción que no se puede deshacer. */
export function ConfirmSubmitButton({
  message,
  children,
  className = "",
  ariaLabel,
}: {
  message: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      aria-busy={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-60`}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
