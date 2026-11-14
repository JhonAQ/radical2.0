"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function AdminDialog({
  children,
  closeHref,
  title,
}: {
  children: ReactNode;
  closeHref: string;
  title: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        router.push(closeHref);
        return;
      }
      if (event.key !== "Tab" || !dialog.current) return;
      const items = [
        ...dialog.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.getClientRects().length);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0],
        last = items[items.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [closeHref, router]);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#03232b]/60"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) router.push(closeHref);
      }}
    >
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="h-full w-full max-w-2xl overflow-y-auto bg-[#fbfaf5] p-6 shadow-2xl outline-none sm:p-9"
      >
        {children}
      </div>
    </div>
  );
}
