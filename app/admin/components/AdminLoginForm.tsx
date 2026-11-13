import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { login, requestPasswordReset } from "../actions";
import { errorMessages, successMessages, adminInputClass, adminButtonClass } from "../types";

export function AdminLoginForm({
  error,
  success,
  isLoggedInWithoutAccess,
}: {
  error?: string;
  success?: string;
  isLoggedInWithoutAccess?: boolean;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f8f5e9] px-5 py-12 text-[#082e39]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#bfe5df,transparent_40%),radial-gradient(circle_at_bottom_right,#ffe4a4,transparent_40%)]"
      />
      <div className="relative w-full max-w-md">
        <Link href="/" aria-label="Volver al inicio de Radical 2.0">
          <Image
            src="/assets/registration/corner-yellow-brush.webp"
            alt=""
            width={180}
            height={80}
            className="absolute -left-10 -top-16 w-56 opacity-60"
          />
        </Link>
        <section className="relative rounded-3xl bg-white/95 p-8 shadow-[0_12px_40px_rgba(11,45,54,0.08)] sm:p-10">
          <Link href="/" aria-label="Radical 2.0, inicio">
            <BrandLogo variant="secundario" width={130} />
          </Link>
          <p className="mb-3 mt-5 text-xs font-black uppercase tracking-[.2em] text-[#009ca5]">
            Radical 2.0 · Equipo
          </p>
          <h1 className="text-3xl font-black">Bienvenido al panel</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ingresa con tu cuenta de administrador para gestionar las
            inscripciones.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800"
            >
              {errorMessages[error] || "No pudimos completar la operación."}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="mt-5 rounded-xl bg-teal-50 p-3 text-sm text-teal-900"
            >
              {successMessages[success] || "Operación exitosa."}
            </p>
          )}

          {isLoggedInWithoutAccess && (
            <p className="mt-4 text-sm text-slate-600">
              La sesión actual no tiene permisos de administrador.
            </p>
          )}

          <form action={login} className="mt-7 space-y-4">
            <label className="block text-sm font-bold">
              Correo
              <input
                className={`${adminInputClass} mt-2`}
                type="email"
                name="email"
                required
                autoComplete="username"
              />
            </label>
            <label className="block text-sm font-bold">
              Contraseña
              <input
                className={`${adminInputClass} mt-2`}
                type="password"
                name="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button className={`${adminButtonClass} w-full gap-2`} type="submit">
              <span>Entrar al panel</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <details className="mt-5 text-sm">
            <summary className="cursor-pointer font-semibold text-[#008e98]">
              Crear o recuperar contraseña
            </summary>
            <form action={requestPasswordReset} className="mt-3 space-y-3">
              <label className="block font-semibold">
                Correo de administrador
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className={`${adminInputClass} mt-2`}
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl border border-[#008e98] px-4 py-3 font-bold text-[#008e98] transition hover:bg-[#008e98]/5"
              >
                Enviar enlace de recuperación
              </button>
            </form>
          </details>

          <Link
            href="/login?next=admin"
            className="mt-5 flex items-center justify-center gap-2 text-center text-sm font-semibold text-[#008e98] hover:underline"
          >
            <KeyRound size={16} />
            <span>Activar acceso de cuenta maestra con Google</span>
          </Link>

          <Link
            href="/"
            className="mt-4 flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={15} />
            <span>Volver a Radical</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
