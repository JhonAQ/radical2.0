"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  Wallet,
  ArrowRight,
  CalendarDays,
  Receipt,
} from "lucide-react";

type Registration = {
  id: string;
  first_name: string;
  last_name: string;
  document: string;
  email: string;
  phone: string;
  plan: string;
  price: number;
  amount: number;
  status: string;
  review_note: string | null;
  created_at: string;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  kind: string;
  created_at: string;
  review_note: string | null;
};

const statusConfig = {
  pending: {
    className: "mi-inscripcion-status--pending",
    icon: Clock3,
    title: "Estamos revisando tu inscripción",
    description: "El equipo verificará tu comprobante y actualizará el estado.",
  },
  approved: {
    className: "mi-inscripcion-status--approved",
    icon: CheckCircle2,
    title: "¡Tu inscripción fue aprobada!",
    description: "Tu comprobante fue verificado. Estás dentro de Radical 2.0.",
  },
  rejected: {
    className: "mi-inscripcion-status--rejected",
    icon: AlertCircle,
    title: "Tu comprobante necesita revisión",
    description: "Envía un nuevo comprobante para continuar con tu inscripción.",
  },
} as const;

const kindLabels: Record<string, string> = {
  additional: "Abono adicional",
  replacement: "Comprobante corregido",
};

const statusLabels: Record<string, string> = {
  pending: "En revisión",
  approved: "Aprobado",
  rejected: "Observado",
};

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 9 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: "easeOut" as const, delay },
  };
}

export function MiInscripcionDashboard({
  registration,
  payments,
  totalPaid,
  pendingAmount,
  remaining,
}: {
  registration: Registration;
  payments: Payment[];
  totalPaid: number;
  pendingAmount: number;
  remaining: number;
  avatarUrl: string | null;
}) {
  const config =
    statusConfig[registration.status as keyof typeof statusConfig] ??
    statusConfig.pending;
  const StatusIcon = config.icon;
  const progressPercent = Math.min(
    100,
    registration.price > 0 ? (totalPaid / registration.price) * 100 : 0,
  );
  const isPaidInFull = remaining <= 0 && registration.status === "approved";
  const recentPayments = payments.slice(0, 3);

  return (
    <div className="mi-inscripcion-dashboard-grid">
      {/* ── LEFT COLUMN: heading · status · personal info ── */}
      <div className="mi-inscripcion-left-col">
        <motion.div className="mi-inscripcion-heading" {...fade(0)}>
          <p className="mi-inscripcion-eyebrow">Radical 2.0</p>
          <h1>TU ESPACIO RADICAL</h1>
          <p>Consulta el estado de tu inscripción y gestiona tus abonos.</p>
        </motion.div>

        {/* Status banner */}
        <motion.div
          className={`mi-inscripcion-status ${config.className}`}
          {...fade(0.06)}
        >
          <StatusIcon size={22} />
          <div>
            <strong>{config.title}</strong>
            {registration.status === "rejected" && registration.review_note && (
              <span className="mi-inscripcion-status-note">
                Nota del equipo: {registration.review_note}
              </span>
            )}
            {registration.status !== "rejected" && (
              <span className="mi-inscripcion-status-note">
                {config.description}
              </span>
            )}
          </div>
        </motion.div>

        {/* Personal info */}
        <motion.div className="mi-inscripcion-card" {...fade(0.12)}>
          <h2 className="mi-inscripcion-card-title">Datos del campista</h2>
          <div className="mi-inscripcion-card-row">
            <span>Nombre</span>
            <strong>{registration.first_name} {registration.last_name}</strong>
          </div>
          <div className="mi-inscripcion-card-row">
            <span>Plan</span>
            <strong style={{ textTransform: "capitalize" }}>
              {registration.plan} · S/{registration.price}
            </strong>
          </div>
          <div className="mi-inscripcion-card-row">
            <span>Correo</span>
            <strong>{registration.email}</strong>
          </div>
          <div className="mi-inscripcion-card-row">
            <span>WhatsApp</span>
            <strong>{registration.phone}</strong>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT COLUMN: progress · actions · payments ── */}
      <div className="mi-inscripcion-right-col">
        {/* Payment progress */}
        <motion.div className="mi-inscripcion-progress" {...fade(0.1)}>
          <h2 className="mi-inscripcion-progress-title">Progreso de pago</h2>
          <div className="mi-inscripcion-progress-bar">
            <motion.div
              className="mi-inscripcion-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.9, ease: "easeOut" as const, delay: 0.35 }}
            />
          </div>
          <div className="mi-inscripcion-progress-label">
            <span>S/{totalPaid} abonado</span>
            <span>S/{registration.price} total</span>
          </div>
          <div className="mi-inscripcion-progress-stats">
            <div className="mi-inscripcion-progress-stat">
              <span>Abonos aprobados</span>
              <strong>S/{totalPaid}</strong>
            </div>
            {pendingAmount > 0 && (
              <div className="mi-inscripcion-progress-stat">
                <span>En revisión</span>
                <strong>S/{pendingAmount}</strong>
              </div>
            )}
            <div className="mi-inscripcion-progress-stat">
              <span>Saldo pendiente</span>
              <strong>S/{remaining}</strong>
            </div>
          </div>
          {isPaidInFull && (
            <p className="mi-inscripcion-progress-complete">¡Pago completo!</p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div className="mi-inscripcion-actions" {...fade(0.17)}>
          {registration.status === "rejected" && (
            <Link
              href="/mi-inscripcion/nuevo-abono?tipo=correccion"
              className="mi-inscripcion-btn-primary"
            >
              <Wallet size={18} />
              Enviar otro comprobante
              <ArrowRight size={18} />
            </Link>
          )}
          {registration.status === "approved" && remaining > 0 && (
            <Link
              href="/mi-inscripcion/nuevo-abono"
              className="mi-inscripcion-btn-primary"
            >
              <Wallet size={18} />
              Registrar nuevo abono
              <ArrowRight size={18} />
            </Link>
          )}
          <Link href="/mi-inscripcion/historial" className="mi-inscripcion-btn-secondary">
            <CalendarDays size={16} />
            Ver historial
          </Link>
        </motion.div>

        {/* Recent payments */}
        {recentPayments.length > 0 && (
          <motion.div className="mi-inscripcion-payments" {...fade(0.22)}>
            <h2 className="mi-inscripcion-payments-title">Últimos movimientos</h2>
            {recentPayments.map((p) => (
              <div key={p.id} className="mi-inscripcion-payment-item">
                <div
                  className={`mi-inscripcion-payment-icon mi-inscripcion-payment-icon--${p.status}`}
                >
                  <Receipt size={18} />
                </div>
                <div className="mi-inscripcion-payment-info">
                  <strong>{kindLabels[p.kind] ?? "Abono"}</strong>
                  <small>
                    {new Date(p.created_at).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "America/Lima",
                    })}
                  </small>
                </div>
                <span className="mi-inscripcion-payment-amount">S/{p.amount}</span>
                <span className={`mi-inscripcion-badge mi-inscripcion-badge--${p.status}`}>
                  {statusLabels[p.status] ?? p.status}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
