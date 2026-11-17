"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { isMinorAtCamp } from "@/utils/minors";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  Wallet,
  ArrowRight,
  Receipt,
  IdCard,
  House,
  UserRound,
  Pencil,
  Mail,
  X,
  LogOut,
  Ticket,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import { HistorialTimeline } from "../historial/components/HistorialTimeline";
import { EntradaTicket } from "./EntradaTicket";
import { ticketState } from "@/utils/ticket";

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
  birth_date: string;
  payment_method?: string;
  created_at: string;
  ticket_code: string;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  kind: string;
  method?: string;
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

export type Tab = "inicio" | "pagos" | "entrada" | "datos";

const tabs: { id: Tab; label: string; icon: typeof House }[] = [
  { id: "inicio", label: "Inicio", icon: House },
  { id: "pagos", label: "Pagos", icon: Receipt },
  { id: "entrada", label: "Entrada", icon: Ticket },
  { id: "datos", label: "Mi perfil", icon: UserRound },
];

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
  avatarUrl,
  qrSvg,
  initialTab = "inicio",
}: {
  registration: Registration;
  payments: Payment[];
  totalPaid: number;
  pendingAmount: number;
  remaining: number;
  avatarUrl: string | null;
  qrSvg: string;
  initialTab?: Tab;
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

  const [tab, setTab] = useState<Tab>(initialTab);
  const [statusToastOpen, setStatusToastOpen] = useState(true);

  return (
    <div className="mi-inscripcion-dashboard-grid" data-tab={tab}>
      {/* ── LEFT COLUMN: heading · status · personal info ── */}
      <div className="mi-inscripcion-left-col">
        <p className="mi-inscripcion-greeting" data-panel="inicio">
          Hola, <strong>{registration.first_name.split(" ")[0]}</strong>
        </p>

        <motion.div className="mi-inscripcion-heading" {...fade(0)}>
          <p className="mi-inscripcion-eyebrow">Radical 2.0</p>
          <h1>TU ESPACIO RADICAL</h1>
          <p>Consulta el estado de tu inscripción y gestiona tus abonos.</p>
        </motion.div>

        {/* Personal info */}
        <motion.div className="mi-inscripcion-account-card" data-panel="datos" {...fade(0.08)}>
          {avatarUrl ? <Image src={avatarUrl} alt="Foto de perfil" width={64} height={64} unoptimized className="mi-inscripcion-account-avatar mi-inscripcion-profile-avatar" /> : <span className="mi-inscripcion-account-icon"><UserRound size={22} aria-hidden /></span>}
          <div>
            <h2>{registration.first_name} {registration.last_name}</h2>
            <p><Mail size={14} aria-hidden /> <span>{registration.email}</span></p>
            <span className="mi-inscripcion-account-caption">Cuenta de Google</span>
            <form action={signOut} className="mi-inscripcion-signout-mobile">
              <button type="submit"><LogOut size={16} aria-hidden />Cerrar sesión</button>
            </form>
          </div>
        </motion.div>
        {/* Entrada virtual */}
        <motion.div className="mi-inscripcion-entrada" data-panel="entrada" {...fade(0.16)}>
          <EntradaTicket
            firstName={registration.first_name}
            lastName={registration.last_name}
            plan={registration.plan}
            code={registration.ticket_code}
            qrSvg={qrSvg}
            state={ticketState(registration.status)}
            remaining={remaining}
            isMinor={isMinorAtCamp(registration.birth_date)}
          />
        </motion.div>
        <motion.div className="mi-inscripcion-card" data-panel="datos" {...fade(0.12)}>
          <h2 className="mi-inscripcion-card-title">Datos de inscripción</h2>
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
          <Link href="/mi-inscripcion/datos" className="mi-inscripcion-btn-secondary mi-inscripcion-mobile-only">
            <Pencil size={16} />
            Editar mis datos
          </Link>
        </motion.div>
        {isMinorAtCamp(registration.birth_date) && (
          <motion.p className="mi-inscripcion-minor-notice" data-panel="datos" {...fade(0.14)}>
            <IdCard size={18} aria-hidden />
            <span><b>Eres menor de edad:</b> lleva tu permiso de viaje notarial en original. Sin él no podrás abordar el bus.</span>
          </motion.p>
        )}
      </div>

      {/* ── RIGHT COLUMN: progress · actions · payments ── */}
      <div className="mi-inscripcion-right-col">
        {statusToastOpen && <motion.div className={`mi-inscripcion-status mi-inscripcion-status-toast ${config.className}`} data-panel="inicio" role={registration.status === "rejected" ? "alert" : "status"} {...fade(0.06)}>
          <StatusIcon size={22} />
          <div>
            <strong>{config.title}</strong>
            {registration.status === "rejected" && registration.review_note ? (
              <span className="mi-inscripcion-status-note">Nota del equipo: {registration.review_note}</span>
            ) : <span className="mi-inscripcion-status-note">{config.description}</span>}
          </div>
          <button type="button" className="mi-inscripcion-status-close" aria-label="Cerrar aviso" onClick={() => setStatusToastOpen(false)}><X size={17} /></button>
        </motion.div>}

        {/* Payment progress */}
        <motion.div className="mi-inscripcion-progress" data-panel="inicio" {...fade(0.1)}>
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
        <motion.div className="mi-inscripcion-actions" data-panel="inicio" {...fade(0.17)}>
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
          {registration.status === "pending" && remaining > 0 && (
            <p className="mi-inscripcion-actions-hint">
              Podrás registrar nuevos abonos cuando el equipo apruebe tu inscripción.
            </p>
          )}
          <Link href="/mi-inscripcion/datos" className="mi-inscripcion-btn-secondary mi-inscripcion-desktop-only">
            Editar mis datos
          </Link>
        </motion.div>

        {/* Full payment history */}
        <motion.div className="mi-inscripcion-payments" data-panel="pagos" {...fade(0.22)}>
          <HistorialTimeline
            embedded
            registration={registration}
            payments={payments}
          />
        </motion.div>
      </div>

      <nav className="mi-inscripcion-tabbar" aria-label="Secciones">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
          >
            <Icon size={21} strokeWidth={tab === id ? 2.4 : 1.9} aria-hidden />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
