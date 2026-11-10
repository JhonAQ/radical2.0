import { siWhatsapp } from "simple-icons";

export function WhatsAppMark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={siWhatsapp.path} />
    </svg>
  );
}
