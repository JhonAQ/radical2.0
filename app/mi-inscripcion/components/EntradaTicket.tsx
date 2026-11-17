import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Download, Clock3, AlertCircle } from "lucide-react";
import { CAMP_CONFIG } from "@/config/site";
import { formatTicketCode, type TicketState } from "@/utils/ticket";
import "./EntradaTicket.css";

const stateCopy: Record<Exclude<TicketState, "active">, { icon: typeof Clock3; title: string; text: string }> = {
  pending: {
    icon: Clock3,
    title: "Entrada en espera",
    text: "Se activa cuando validemos tu primer pago.",
  },
  rejected: {
    icon: AlertCircle,
    title: "Entrada en pausa",
    text: "Tu comprobante necesita revisión. Envía uno nuevo para activarla.",
  },
};

export function EntradaTicket({
  firstName,
  lastName,
  plan,
  code,
  qrSvg,
  state,
  remaining,
  isMinor,
}: {
  firstName: string;
  lastName: string;
  plan: string;
  code: string;
  qrSvg: string;
  state: TicketState;
  remaining: number;
  isMinor: boolean;
}) {
  const inactive = state !== "active" ? stateCopy[state] : null;
  const InactiveIcon = inactive?.icon;
  const paidInFull = state === "active" && remaining <= 0;

  return (
    <div className="entrada">
      <article className="entrada-ticket" data-state={state} aria-label="Tu entrada a Radical 2.0">
        <header className="entrada-top">
          <div className="entrada-top-row">
            <Image src="/assets/brand/logo-secundario.webp" alt="Radical 2.0" width={112} height={52} className="entrada-logo" />
            <span className="entrada-kind">Entrada</span>
          </div>
          <p className="entrada-event">{CAMP_CONFIG.dates.badge}</p>
          <div className="entrada-meta">
            <div>
              <span>Fechas</span>
              <strong>{CAMP_CONFIG.dates.range}</strong>
            </div>
            <div>
              <span>Lugar</span>
              <strong>{CAMP_CONFIG.location.venue}</strong>
            </div>
          </div>
        </header>

        <div className="entrada-tear" aria-hidden />

        <div className="entrada-body">
          <div className="entrada-qr-wrap">
            <div
              className="entrada-qr"
              role="img"
              aria-label={inactive ? "Código QR inactivo" : "Código QR de tu entrada"}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            {inactive && InactiveIcon && (
              <div className="entrada-qr-lock">
                <InactiveIcon size={22} aria-hidden />
                <strong>{inactive.title}</strong>
                <span>{inactive.text}</span>
              </div>
            )}
          </div>
          <p className="entrada-code">{formatTicketCode(code)}</p>

          <dl className="entrada-holder">
            <div className="entrada-holder-name">
              <dt>Campista</dt>
              <dd>{firstName} {lastName}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd className="entrada-cap">{plan}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                {state !== "active" ? (
                  <span className="entrada-chip entrada-chip--wait">Por validar</span>
                ) : paidInFull ? (
                  <span className="entrada-chip entrada-chip--paid">Pagado</span>
                ) : (
                  <span className="entrada-chip entrada-chip--due">Saldo S/{remaining}</span>
                )}
              </dd>
            </div>
          </dl>
          {isMinor && <p className="entrada-minor">Menor de edad · presentar permiso notarial</p>}
        </div>
      </article>

      <div className="entrada-actions">
        {state === "active" && (
          <a href="/mi-inscripcion/entrada/pdf" className="mi-inscripcion-btn-primary" download>
            <Download size={18} aria-hidden />
            Descargar PDF
          </a>
        )}
        {state === "active" && remaining > 0 && (
          <Link href="/mi-inscripcion/nuevo-abono" className="mi-inscripcion-btn-secondary">
            Abonar S/{remaining} pendientes
            <ArrowRight size={16} aria-hidden />
          </Link>
        )}
        {state === "rejected" && (
          <Link href="/mi-inscripcion/nuevo-abono?tipo=correccion" className="mi-inscripcion-btn-primary">
            Enviar otro comprobante
            <ArrowRight size={16} aria-hidden />
          </Link>
        )}
        <p className="entrada-hint">
          {state === "active"
            ? "Muéstrala al llegar. Puedes llevarla en el celular o impresa."
            : "Cuando se active podrás descargarla en PDF."}
        </p>
      </div>
    </div>
  );
}
