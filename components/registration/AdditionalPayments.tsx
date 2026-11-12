"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

type Payment = {
  id: string;
  amount: number;
  status: string;
  kind: string;
  created_at: string;
  review_note: string | null;
};
const statusLabel: Record<string, string> = {
  pending: "En revisión",
  approved: "Aprobado",
  rejected: "Observado",
};

export function AdditionalPayments({
  userId,
  registrationId,
  registrationStatus,
  price,
  initialAmount,
}: {
  userId: string;
  registrationId: string;
  registrationStatus: string;
  price: number;
  initialAmount: number;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const replacement = registrationStatus === "rejected";
  const approved = payments
    .filter((p) => p.kind === "additional" && p.status === "approved")
    .reduce((n, p) => n + p.amount, 0);
  const pending = payments
    .filter((p) => p.kind === "additional" && p.status === "pending")
    .reduce((n, p) => n + p.amount, 0);
  const remaining = Math.max(0, price - initialAmount - approved);
  const maximum = replacement ? price : Math.max(0, remaining - pending);
  const replacementPending = payments.some(
    (p) => p.kind === "replacement" && p.status === "pending",
  );
  async function loadPayments() {
    const { data, error } = await createClient()
      .from("registration_payments")
      .select("id,amount,status,kind,created_at,review_note")
      .eq("registration_id", registrationId)
      .order("created_at", { ascending: false });
    if (error) {
      setMessage(
        "No pudimos cargar tus abonos. Recarga la página para intentarlo de nuevo.",
      );
      setLoaded(false);
    } else {
      setPayments(data || []);
      setLoaded(true);
    }
  }
  useEffect(() => {
    let active = true;
    void createClient()
      .from("registration_payments")
      .select("id,amount,status,kind,created_at,review_note")
      .eq("registration_id", registrationId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setMessage(
            "No pudimos cargar tus abonos. Recarga la página para intentarlo de nuevo.",
          );
          setLoaded(false);
        } else {
          setPayments(data || []);
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [registrationId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (
      submitting.current ||
      !file ||
      !Number.isInteger(amount) ||
      amount < (replacement ? 50 : 1) ||
      amount > maximum
    ) {
      setMessage("Revisa el monto y selecciona un comprobante válido.");
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setMessage("Elige una imagen JPG, PNG o WebP de hasta 10 MB.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setMessage("");
    try {
      try {
        const imageUrl = URL.createObjectURL(file);
        try {
          await new Promise<void>((resolve, reject) => {
            const image = new window.Image();
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("invalid-image"));
            image.src = imageUrl;
          });
        } finally {
          URL.revokeObjectURL(imageUrl);
        }
      } catch {
        setMessage("No se pudo leer la imagen seleccionada.");
        return;
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
        setMessage("No se pudo subir el comprobante. Inténtalo de nuevo.");
        return;
      }
      const { error } = await client.rpc("submit_registration_payment", {
        p_registration_id: registrationId,
        p_kind: replacement ? "replacement" : "additional",
        p_amount: amount,
        p_receipt_path: path,
      });
      if (error) {
        await client.storage.from("registration-receipts").remove([path]);
        setMessage(
          "No se pudo enviar el abono. Recarga la página e inténtalo de nuevo.",
        );
      } else {
        setFile(null);
        setAmount(0);
        form.reset();
        setMessage("Comprobante enviado para revisión.");
        await loadPayments();
      }
    } catch {
      setMessage(
        "No pudimos conectar con el servidor. Recarga la página para comprobar si se envió el abono.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  if (registrationStatus === "pending") return null;
  return (
    <section className="mt-6 rounded-2xl border border-[#cfe0dc] bg-white/90 p-5 text-left text-[#0b2d36]">
      <h3 className="text-lg font-extrabold">
        {replacement ? "Enviar otro comprobante" : "Tus abonos"}
      </h3>
      {!replacement && (
        <p className="mt-2 text-sm">
          Saldo pendiente: <strong>S/ {remaining}</strong>
          {pending > 0 && ` · S/ ${pending} en revisión`}
        </p>
      )}
      {payments.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {payments.map((p) => (
            <li key={p.id} className="rounded-xl bg-[#eef6f3] p-3">
              <div className="flex justify-between gap-2">
                <strong>
                  {p.kind === "replacement" ? "Nuevo comprobante" : "Abono"} ·
                  S/ {p.amount}
                </strong>
                <span>{statusLabel[p.status]}</span>
              </div>
              {p.review_note && (
                <p className="mt-1 text-xs">Nota del equipo: {p.review_note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {loaded && (replacement ? !replacementPending : maximum > 0) && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-sm font-bold">
            Monto (S/)
            <input
              className="mt-1 w-full rounded-lg border border-[#bdd2ce] bg-white p-3"
              type="number"
              min={replacement ? 50 : 1}
              max={maximum}
              step={1}
              required
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm font-bold">
            Imagen del comprobante
            <input
              className="mt-1 block w-full text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            disabled={busy}
            className="rounded-xl bg-[#008f95] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Enviando…" : "Enviar comprobante"}
          </button>
        </form>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm font-semibold">
          {message}
        </p>
      )}
    </section>
  );
}
