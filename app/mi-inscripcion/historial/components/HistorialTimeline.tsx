"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock3, AlertCircle, ArrowLeft, Ticket } from "lucide-react";

type TimelineEvent = {
  id: string;
  date: string;
  label: string;
  amount: number;
  status: string;
  reviewNote: string | null;
};

const statusLabels: Record<string, string> = {
  pending: "En revisión",
  approved: "Aprobado",
  rejected: "Observado",
};

const statusIcons: Record<string, typeof Check> = {
  pending: Clock3,
  approved: Check,
  rejected: AlertCircle,
};

const kindLabels: Record<string, string> = {
  additional: "Abono adicional",
  replacement: "Comprobante corregido",
};

export function HistorialTimeline({
  registration,
  payments,
}: {
  registration: {
    plan: string;
    price: number;
    amount: number;
    status: string;
    created_at: string;
  };
  payments: {
    id: string;
    amount: number;
    status: string;
    kind: string;
    created_at: string;
    review_note: string | null;
  }[];
}) {
  /* Build chronological events list (newest first) */
  const events: TimelineEvent[] = [
    ...payments.map((p) => ({
      id: p.id,
      date: p.created_at,
      label: kindLabels[p.kind] ?? "Abono",
      amount: p.amount,
      status: p.status,
      reviewNote: p.review_note,
    })),
    {
      id: "initial",
      date: registration.created_at,
      label: `Inscripción enviada · Plan ${registration.plan}`,
      amount: registration.amount,
      status: registration.status,
      reviewNote: null,
    },
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mi-inscripcion-historial-wrap">
      <motion.div
        className="mi-inscripcion-heading"
        initial={{ opacity: 0, y: 9 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <p className="mi-inscripcion-eyebrow">Radical 2.0</p>
        <h1>HISTORIAL DE PAGOS</h1>
        <p>Todos los movimientos de tu inscripción en un solo lugar.</p>
      </motion.div>

      <div style={{ marginBottom: 20 }}>
        <Link href="/mi-inscripcion" className="mi-inscripcion-btn-secondary">
          <ArrowLeft size={16} /> Volver a mi espacio
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="mi-inscripcion-empty">
          No hay movimientos registrados todavía.
        </p>
      ) : (
        <div className="mi-inscripcion-timeline">
          {events.map((event, index) => {
            const Icon = statusIcons[event.status] ?? Clock3;
            return (
              <motion.div
                key={event.id}
                className="mi-inscripcion-timeline-event"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut" as const,
                  delay: index * 0.07,
                }}
              >
                <div
                  className={`mi-inscripcion-timeline-dot mi-inscripcion-timeline-dot--${event.status}`}
                >
                  {event.id === "initial" ? (
                    <Ticket size={10} />
                  ) : (
                    <Icon size={10} />
                  )}
                </div>
                <div className="mi-inscripcion-timeline-card">
                  <p className="mi-inscripcion-timeline-date">
                    {new Date(event.date).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "America/Lima",
                    })}
                  </p>
                  <div className="mi-inscripcion-timeline-meta">
                    <strong>{event.label}</strong>
                    <span>S/{event.amount}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span
                      className={`mi-inscripcion-badge mi-inscripcion-badge--${event.status}`}
                    >
                      {statusLabels[event.status] ?? event.status}
                    </span>
                  </div>
                  {event.reviewNote && (
                    <p className="mi-inscripcion-timeline-note">
                      Nota del equipo: {event.reviewNote}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
