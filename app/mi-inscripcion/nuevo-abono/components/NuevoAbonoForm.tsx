"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Copy,
  Download,
  FileText,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  Wallet,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const yapePhoneNumber = process.env.NEXT_PUBLIC_YAPE_PHONE || "";
const yapeHolder = process.env.NEXT_PUBLIC_YAPE_HOLDER || "";

const fadeIn = {
  initial: { opacity: 0, y: 9 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

export function NuevoAbonoForm({
  userId,
  registrationId,
  registrationStatus,
  plan,
  price,
  totalPaid,
  remaining,
  maximumAllowed,
  isCorrection,
}: {
  userId: string;
  registrationId: string;
  registrationStatus: string;
  plan: string;
  price: number;
  totalPaid: number;
  remaining: number;
  maximumAllowed: number;
  isCorrection: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(isCorrection ? 50 : Math.min(remaining, maximumAllowed));
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  const previewRef = useRef<string | null>(null);
  const [phoneCopied, setPhoneCopied] = useState(false);

  const minAmount = isCorrection ? 50 : 1;
  const amountValid =
    Number.isInteger(amount) && amount >= minAmount && amount <= maximumAllowed;
  const remainingAfter = isCorrection
    ? price - amount
    : Math.max(0, remaining - amount);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0];
    if (!selected) return;
    setError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Elige una imagen JPG, PNG o WebP.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("La imagen debe pesar 10 MB o menos.");
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(selected);
    previewRef.current = url;
    setPreviewUrl(url);
    setFileName(selected.name);
    setFile(selected);
    event.currentTarget.value = "";
  }

  function removeFile() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreviewUrl(null);
    setFileName("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(yapePhoneNumber);
      setPhoneCopied(true);
    } catch {
      /* silently fail */
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitLock.current) return;

    if (!amountValid) {
      setError(`El monto debe ser desde S/${minAmount} hasta S/${maximumAllowed}.`);
      return;
    }
    if (!file || !previewUrl) {
      setError("Sube el comprobante de pago para continuar.");
      return;
    }
    if (!consent) {
      setError("Confirma que el monto y el comprobante son correctos.");
      return;
    }

    submitLock.current = true;
    setBusy(true);
    setError("");

    try {
      /* Validate image */
      const verifyUrl = URL.createObjectURL(file);
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("invalid-image"));
          img.src = verifyUrl;
        });
      } finally {
        URL.revokeObjectURL(verifyUrl);
      }

      const client = createClient();
      const suffix =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${suffix}`;

      const { error: uploadError } = await client.storage
        .from("registration-receipts")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError("No se pudo subir el comprobante. Inténtalo de nuevo.");
        return;
      }

      const { error: rpcError } = await client.rpc(
        "submit_registration_payment",
        {
          p_registration_id: registrationId,
          p_kind: isCorrection ? "replacement" : "additional",
          p_amount: amount,
          p_receipt_path: path,
        },
      );

      if (rpcError) {
        await client.storage.from("registration-receipts").remove([path]);
        setError(
          "No se pudo enviar el abono. Recarga la página e inténtalo de nuevo.",
        );
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/mi-inscripcion"), 2500);
    } catch {
      setError(
        "No pudimos conectar con el servidor. Recarga la página e inténtalo de nuevo.",
      );
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="mi-inscripcion-success">
        <div className="mi-inscripcion-success-icon">
          <Check size={34} />
        </div>
        <h2>Comprobante enviado</h2>
        <p>
          Tu {isCorrection ? "comprobante corregido" : "abono"} fue enviado para
          revisión. Te redirigimos a tu espacio.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div className="mi-inscripcion-heading" {...fadeIn}>
        <h1>{isCorrection ? "ENVIAR OTRO\nCOMPROBANTE" : "REGISTRA\nTU ABONO"}</h1>
        <p>
          {isCorrection
            ? "Sube un nuevo comprobante para corregir tu inscripción."
            : `Estás a S/${remaining} de completar tu inscripción.`}
        </p>
      </motion.div>

      <motion.form
        className="mi-inscripcion-abono-layout"
        onSubmit={handleSubmit}
        noValidate
        {...{ ...fadeIn, transition: { ...fadeIn.transition, delay: 0.08 } }}
      >
        {/* QR Column */}
        <div className="mi-inscripcion-payment-method">
          <h2 className="mi-inscripcion-payment-method-title">Paga con Yape</h2>
          <p>
            {yapePhoneNumber
              ? "Escanea el QR o usa el número de celular."
              : "Escanea el QR para realizar tu pago."}
          </p>
          <Image
            className="mi-inscripcion-payment-qr"
            src="/assets/registration/payment-qr.png"
            alt="Código QR de Yape para pago"
            width={220}
            height={222}
          />
          <div className="mi-inscripcion-yape-details">
            {yapeHolder && <strong>{yapeHolder}</strong>}
            {yapePhoneNumber && (
              <div className="mi-inscripcion-yape-number">
                <span>{yapePhoneNumber}</span>
                <button type="button" onClick={() => void copyPhone()}>
                  <Copy size={14} />
                  {phoneCopied ? "Copiado" : "Copiar"}
                </button>
              </div>
            )}
            <a
              href="/assets/registration/payment-qr.png"
              download="qr-yape-abono.png"
            >
              <Download size={15} />
              Descargar QR
            </a>
          </div>
        </div>

        {/* Form Column */}
        <div className="mi-inscripcion-abono-form">
          <label>
            Monto del abono (S/)
            <input
              type="number"
              min={minAmount}
              max={maximumAllowed}
              step={1}
              inputMode="numeric"
              required
              aria-invalid={error && !amountValid ? true : undefined}
              value={amount || ""}
              onChange={(e) =>
                setAmount(
                  e.target.value === "" ? 0 : Number(e.target.value),
                )
              }
            />
            <small>
              Desde S/{minAmount} hasta S/{maximumAllowed}.
              {!isCorrection && ` Saldo pendiente: S/${remaining}`}
            </small>
          </label>

          {/* Receipt upload */}
          <div className="mi-inscripcion-receipt">
            <label style={{ fontWeight: 800, fontSize: 13 }}>
              Comprobante de pago
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              aria-label="Selecciona una imagen del comprobante"
            />
            {previewUrl ? (
              <>
                <div className="mi-inscripcion-receipt-preview">
                  <Image
                    src={previewUrl}
                    alt={`Vista previa de ${fileName}`}
                    width={600}
                    height={400}
                    unoptimized
                  />
                </div>
                <div className="mi-inscripcion-receipt-file-info">
                  <strong title={fileName}>{fileName}</strong>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText size={14} /> Cambiar
                    </button>
                    <button
                      type="button"
                      className="mi-inscripcion-receipt-remove"
                      onClick={removeFile}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <label
                className="mi-inscripcion-receipt-drop"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText size={20} />
                Elegir imagen del comprobante
              </label>
            )}
          </div>

          {/* Confirmation */}
          <div className="mi-inscripcion-confirmation">
            <h3 className="mi-inscripcion-confirmation-title">
              Confirma tu abono
            </h3>
            <div className="mi-inscripcion-confirmation-row">
              <span>Monto</span>
              <strong>S/{amount || 0}</strong>
            </div>
            <div className="mi-inscripcion-confirmation-row">
              <span>Saldo después</span>
              <strong>
                S/{remainingAfter}
                {remainingAfter <= 0 ? " (¡Completo!)" : ""}
              </strong>
            </div>
            <label className="mi-inscripcion-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Confirmo que el monto y el comprobante son correctos.
              </span>
            </label>
          </div>

          {error && (
            <p className="mi-inscripcion-field-error" role="alert">
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/mi-inscripcion"
              className="mi-inscripcion-btn-secondary"
            >
              <ArrowLeft size={16} /> Volver
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="mi-inscripcion-btn-primary"
              style={{ opacity: busy ? 0.6 : 1 }}
            >
              <Wallet size={18} />
              {busy ? "Enviando…" : "Enviar comprobante"}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </motion.form>
    </>
  );
}
