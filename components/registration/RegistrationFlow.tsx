"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Copy, Download, FileText, IdCard, Mail, Ticket, Trash2, UserRound, UsersRound, Wallet, Phone } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { createClient } from "@/utils/supabase/client";

import "./RegistrationFlow.css";

type PlanId = "preventa" | "regular";
type Participant = { firstName: string; lastName: string; document: string; birthDate: string; gender: string };
type Contact = { phone: string; email: string; emergencyName: string; emergencyRelation: string; emergencyPhone: string };
type RegistrationDraft = { version: 1; step: number; plan: PlanId | null; participant: Participant; contact: Contact; payment: "reserve" | "full"; reserveAmount: number; receiptName: string; consent: boolean };
const registrationDraftDatabase = "radical-registration-drafts";
const registrationDraftStore = "files";

function openRegistrationDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is unavailable"));
    const request = indexedDB.open(registrationDraftDatabase, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(registrationDraftStore);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local draft storage"));
  });
}

async function storeReceiptLocally(userId: string, file: Blob | null) {
  const database = await openRegistrationDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(registrationDraftStore, "readwrite");
    const store = transaction.objectStore(registrationDraftStore);
    if (file) store.put(file, `${userId}:receipt`);
    else store.delete(`${userId}:receipt`);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save the local receipt"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Local receipt save was interrupted"));
  }).finally(() => database.close());
}

async function loadReceiptLocally(userId: string) {
  const database = await openRegistrationDraftDatabase();
  return new Promise<Blob | null>((resolve, reject) => {
    const transaction = database.transaction(registrationDraftStore, "readonly");
    const request = transaction.objectStore(registrationDraftStore).get(`${userId}:receipt`);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error ?? new Error("Could not load the local receipt"));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
}

function clearLocalDraft(userId: string) {
  try { window.localStorage.removeItem(`radical-registration-draft:v1:${userId}`); } catch { /* Storage may be unavailable. */ }
  void storeReceiptLocally(userId, null).catch(() => {});
}

const plans = {
  preventa: { name: "Preventa", price: 200, date: "Hasta el 15 de diciembre", brush: "/assets/elements/brush-planes-amarillo.png", desktopBrush: "/assets/elements/elem-brush-banner-orange.webp" },
  regular: { name: "Regular", price: 250, date: "Desde el 16 de diciembre", brush: "/assets/elements/brush-planes-turquesa.png", desktopBrush: "/assets/elements/brush-planes-turquesa.png" },
} as const;
const benefits = ["Hospedaje", "Alimentación completa", "Programación y materiales", "Amistad del evento", "Acceso a todas las actividades"];
const yapePhoneNumber = process.env.NEXT_PUBLIC_YAPE_PHONE || "";
const yapeHolder = process.env.NEXT_PUBLIC_YAPE_HOLDER || "";
function FieldValidationMessage({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="registration-field-error" role="alert">{message}</span> : null;
}

function StaggeredTitle({ text }: { text: string }) {
  const lines = text.split("\n");
  return <span className="registration-staggered-title" aria-hidden="true">{lines.map((line) => <span className="registration-title-line" key={line}>{Array.from(line).map((letter, index) => <span key={index} style={{ transform: letter === " " ? undefined : `translateY(${((line.length - 1) / 2 - index) * 0.045 + Math.sin(index * 0.85) * 0.018}em) rotate(${-5 + Math.sin(index * 0.8) * 2}deg)` }}>{letter === " " ? "\u00a0" : letter}</span>)}</span>)}</span>;
}
const steps = [
  { label: "Plan", icon: Ticket },
  { label: "Datos", icon: UserRound },
  { label: "Contacto", icon: Phone },
  { label: "Abono", icon: Wallet },
  { label: "Revisión", icon: FileText },
  { label: "Mi inscripción", icon: CheckCircle2 },
] as const;
const titles = ["ELIGE TU PLAN\nDE INSCRIPCIÓN", "INFORMACIÓN\nPERSONAL", "CONTACTO Y\nEMERGENCIA", "ELIGE TU ABONO", "REVISA TUS DATOS", "TU ESPACIO RADICAL"];
const subtitles = ["Asegura tu cupo y vive el siguiente nivel en Radical 2.0.", "Datos del campista", "Cómo comunicarnos contigo y a quién llamar en una emergencia.", "Separa tu cupo con un abono desde S/50 o paga el plan completo.", "Confirma que todo esté listo antes de enviar tu inscripción.", "Consulta el estado de tu inscripción y tus abonos."];
const previousCampPhotoSources = [
  "/assets/previous-camp/01-lugar-letrero-carretera-campel.jpg",
  "/assets/previous-camp/02-fogata-noche-tarjeta-2timoteo.jpg",
  "/assets/previous-camp/03-playa-atardecer-ronda-bandera-equipo.jpg",
  "/assets/previous-camp/04-playa-crepusculo-siluetas-bandera.jpg",
  "/assets/previous-camp/05-taller-dinamica-podio-cristo-me-fortalece.jpg",
  "/assets/previous-camp/06-comunidad-corazon-papel-auditorio.jpg",
  "/assets/previous-camp/07-dinamica-exterior-atardecer-banderas-colores.jpg",
  "/assets/previous-camp/08-taller-grupo-pequeno-circulo-dialogo.jpg",
  "/assets/previous-camp/09-capilla-reflexion-cortinas-cruz.jpg",
  "/assets/previous-camp/10-juegos-dinamica-energia-auditorio.jpg",
  "/assets/previous-camp/11-dinamicas-grupales-relevos-auditorio.jpg",
  "/assets/previous-camp/12-adoracion-banda-en-vivo-letras-radical.jpg",
  "/assets/previous-camp/13-adoracion-escenario-banda-vertical.jpg",
  "/assets/previous-camp/14-fogata-comunidad-exterior-noche-banderas.jpg",
  "/assets/previous-camp/15-concierto-noche-escenario-luces-enredaderas.jpg",
  "/assets/previous-camp/16-campamento-noche-mesas-luces-campel.jpg",
  "/assets/previous-camp/17-noche-companerismo-fila-jovenes.jpg",
  "/assets/previous-camp/18-concierto-acustico-noche-aire-libre.jpg",
  "/assets/previous-camp/19-sonido-consola-laptop-noche-evento.jpg",
  "/assets/previous-camp/20-noche-escenario-luces-enredaderas-wide.jpg",
  "/assets/previous-camp/21-predica-plenaria-lider-auditorio-lleno.jpg",
  "/assets/previous-camp/22-concierto-aire-libre-cabanas-campel.jpg",
  "/assets/previous-camp/23-escenario-letras-gigantes-radical-3d.jpg",
  "/assets/previous-camp/24-auditorio-jovenes-escuchando-plenaria.jpg",
  "/assets/previous-camp/25-adoracion-manos-alzadas-alabanza-radical.jpg",
  "/assets/previous-camp/26-escenario-letras-radical-backdrop-tiempo.jpg",
  "/assets/previous-camp/27-auditorio-principal-preparado-cortinas.jpg",
] as const;
const previousCampPhotos = [
  previousCampPhotoSources.filter((_, index) => index % 2 === 0),
  previousCampPhotoSources.filter((_, index) => index % 2 === 1),
];
const previousCampPortraitPhotos = new Set<string>([
  "/assets/previous-camp/01-lugar-letrero-carretera-campel.jpg",
  "/assets/previous-camp/02-fogata-noche-tarjeta-2timoteo.jpg",
  "/assets/previous-camp/04-playa-crepusculo-siluetas-bandera.jpg",
  "/assets/previous-camp/05-taller-dinamica-podio-cristo-me-fortalece.jpg",
  "/assets/previous-camp/06-comunidad-corazon-papel-auditorio.jpg",
  "/assets/previous-camp/09-capilla-reflexion-cortinas-cruz.jpg",
  "/assets/previous-camp/10-juegos-dinamica-energia-auditorio.jpg",
  "/assets/previous-camp/11-dinamicas-grupales-relevos-auditorio.jpg",
  "/assets/previous-camp/13-adoracion-escenario-banda-vertical.jpg",
  "/assets/previous-camp/14-fogata-comunidad-exterior-noche-banderas.jpg",
  "/assets/previous-camp/15-concierto-noche-escenario-luces-enredaderas.jpg",
  "/assets/previous-camp/17-noche-companerismo-fila-jovenes.jpg",
  "/assets/previous-camp/18-concierto-acustico-noche-aire-libre.jpg",
]);

function CampFilmReels() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="registration-film-reels" aria-hidden="true">
      {previousCampPhotos.map((photos, reelIndex) => (
        <div key={reelIndex} className={`registration-film-strip registration-film-strip--${reelIndex === 0 ? "up" : "down"}`}>
          <span className="registration-film-tape" />
          <motion.div
            className="registration-film-track"
            initial={{ y: reelIndex === 0 ? "0%" : "-50%" }}
            animate={{ y: reduceMotion ? (reelIndex === 0 ? "0%" : "-50%") : reelIndex === 0 ? "-50%" : "0%" }}
            transition={reduceMotion ? { duration: 0 } : { duration: photos.length * 7, ease: "linear", repeat: Infinity }}
          >
            {[0, 1].map((copy) => (
              <span key={copy} className="registration-film-group">
                {photos.map((src, photoIndex) => (
                  <span key={`${copy}-${src}`} className={`registration-film-frame ${previousCampPortraitPhotos.has(src) ? "is-portrait" : "is-landscape"}`}>
                    <Image src={src} alt="" fill sizes="180px" quality={95} className="registration-film-photo" priority={reelIndex === 0 && copy === 0 && photoIndex === 0} />
                  </span>
                ))}
              </span>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

function RegistrationProgress({ currentStep, className }: { currentStep: number; className: string }) {
  const reduceMotion = useReducedMotion();
  const [visualStep, setVisualStep] = useState(currentStep);
  const [phase, setPhase] = useState<"idle" | "completing" | "travelling" | "arriving">("idle");
  const [arrivalDirection, setArrivalDirection] = useState<"forward" | "backward" | null>(null);
  const transitioning = currentStep !== visualStep;
  const forward = currentStep > visualStep;
  const arrivingBackward = phase === "arriving" && arrivalDirection === "backward";
  const activeEdge = transitioning ? (forward ? visualStep : Math.max(visualStep - 1, 0)) : Math.max(visualStep - 1, 0);
  const completedEdges = transitioning ? (forward ? visualStep : Math.max(currentStep - 1, 0)) : Math.max(visualStep - 1, 0);
  const showActiveEdge = transitioning || visualStep > 0;
  const transitionPhase = transitioning ? (forward ? "completing" : "travelling") : phase;
  const finishTransition = () => {
    setArrivalDirection(forward ? "forward" : "backward");
    setVisualStep(currentStep);
    setPhase("arriving");
    window.setTimeout(() => {
      setPhase("idle");
      setArrivalDirection(null);
    }, 480);
  };

  return <nav aria-label="Progreso de inscripción" className={`registration-progress ${className}`} data-phase={transitionPhase}>{steps.slice(0, -1).map((_, index) => <span key={index} aria-hidden="true" className={`registration-progress-edge ${index < completedEdges ? "is-complete" : ""}`} style={{ left: `${8.333 + index * 16.667}%` }} />)}{((transitioning && !forward) || arrivingBackward) && currentStep > 0 && <span aria-hidden="true" className="registration-progress-edge is-complete registration-progress-edge--backward-target" style={{ left: `${8.333 + (currentStep - 1) * 16.667}%` }} />}{showActiveEdge && !arrivingBackward && <motion.span key={`${visualStep}-${currentStep}`} aria-hidden="true" className={`registration-progress-fill ${transitioning && !forward ? "is-receding" : ""}`} style={{ left: `${8.333 + activeEdge * 16.667}%` }} initial={transitioning ? { clipPath: forward ? "inset(0 100% 0 0)" : "inset(0 0% 0 0)" } : { clipPath: "inset(0 0% 0 0)" }} animate={{ clipPath: transitioning && !forward ? "inset(0 100% 0 0)" : "inset(0 0% 0 0)" }} transition={reduceMotion ? { duration: 0 } : { duration: forward ? 1.45 : 1.05, ease: forward ? ([0.28, 0.08, 0.72, 1] as const) : "easeOut" }} onAnimationComplete={transitioning ? finishTransition : undefined} />}{steps.map(({ label, icon: Icon }, index) => {
    const completing = transitioning && forward && index === visualStep;
    const done = index < visualStep || completing;
    const current = index === visualStep && !transitioning || index === currentStep && phase === "arriving";
    return <div key={label} className={`registration-progress-step ${current ? "is-current" : ""} ${done ? "is-done" : ""} ${completing ? "is-completing" : ""} ${index === currentStep && phase === "arriving" ? "is-arriving" : ""}`} aria-current={currentStep === index ? "step" : undefined}><span className="registration-progress-dot"><span className="registration-progress-number">{index + 1}</span><span className="registration-progress-icon">{done ? <Check size={17} strokeWidth={3} /> : <Icon size={17} strokeWidth={2.3} />}</span></span><span className="registration-progress-name">{label}</span></div>;
  })}</nav>;
}

export function RegistrationFlow({ initialPlan, userId, userEmail, avatarUrl, initialFirstName, initialLastName }: { initialPlan: PlanId | null; userId: string; userEmail: string; avatarUrl: string | null; initialFirstName: string; initialLastName: string }) {
  const [step, setStep] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const navigationLocked = useRef(false);
  const navigationTimer = useRef<number | null>(null);
  const [plan, setPlan] = useState<PlanId | null>(initialPlan ?? "preventa");
  const [participant, setParticipant] = useState<Participant>({ firstName: initialFirstName, lastName: initialLastName, document: "", birthDate: "", gender: "" });
  const [contact, setContact] = useState<Contact>({ phone: "", email: userEmail, emergencyName: "", emergencyRelation: "", emergencyPhone: "" });
  const [payment, setPayment] = useState<"reserve" | "full">("reserve");
  const [reserveAmount, setReserveAmount] = useState(50);
  const [paymentError, setPaymentError] = useState("");
  const [yapePhoneCopied, setYapePhoneCopied] = useState(false);
  const [receiptName, setReceiptName] = useState("");
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const receiptPreviewRef = useRef<string | null>(null);
  const receiptBlobRef = useRef<Blob | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const receiptSelectionRef = useRef(0);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [submitError, setSubmitError] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [validationStep, setValidationStep] = useState<number | null>(null);
  const [birthDateInvalid, setBirthDateInvalid] = useState(false);
  const selected = plan ? plans[plan] : null;
  const amount = payment === "reserve" ? Math.min(reserveAmount, selected?.price ?? reserveAmount) : selected?.price ?? 0;
  const remaining = selected ? selected.price - amount : 0;
  const dataComplete = Object.values(participant).every((value) => value.trim()) && /^[a-zA-Z0-9]{6,12}$/.test(participant.document.replace(/\s/g, "")) && !Number.isNaN(Date.parse(participant.birthDate));
  const contactComplete = Object.values(contact).every((value) => value.trim()) && /^\d{9,15}$/.test(contact.phone.replace(/[\s+()-]/g, "")) && /^\d{9,15}$/.test(contact.emergencyPhone.replace(/[\s+()-]/g, ""));
  const showStepErrors = validationStep === step;
  const participantErrors: Partial<Record<keyof Participant, string>> = showStepErrors && step === 1 ? {
    firstName: participant.firstName.trim() ? "" : "Ingresa tus nombres.",
    lastName: participant.lastName.trim() ? "" : "Ingresa tus apellidos.",
    document: !participant.document.trim() ? "Ingresa tu documento." : /^[a-zA-Z0-9]{6,12}$/.test(participant.document.replace(/\s/g, "")) ? "" : "Revisa el documento (6 a 12 caracteres).",
    birthDate: !participant.birthDate ? "Ingresa tu fecha de nacimiento." : birthDateInvalid ? "La fecha no puede ser futura." : "",
    gender: participant.gender ? "" : "Selecciona una opción.",
  } : {};
  const contactErrors: Partial<Record<keyof Contact, string>> = showStepErrors && step === 2 ? {
    phone: !contact.phone.trim() ? "Ingresa tu número de WhatsApp." : /^\d{9,15}$/.test(contact.phone.replace(/[\s+()-]/g, "")) ? "" : "Ingresa un celular válido.",
    email: contact.email.trim() ? "" : "No encontramos el correo de tu cuenta.",
    emergencyName: contact.emergencyName.trim() ? "" : "Ingresa el nombre del contacto.",
    emergencyRelation: contact.emergencyRelation ? "" : "Selecciona el parentesco.",
    emergencyPhone: !contact.emergencyPhone.trim() ? "Ingresa el celular de emergencia." : /^\d{9,15}$/.test(contact.emergencyPhone.replace(/[\s+()-]/g, "")) ? "" : "Ingresa un celular válido.",
  } : {};

  useEffect(() => {
    let cancelled = false;
    async function restoreDraft() {
      try {
        const { data: existing } = await createClient().from("registrations").select("id,status,review_note,first_name,last_name,document,birth_date,gender,phone,emergency_name,emergency_relation,emergency_phone,plan,payment_type,amount").eq("user_id", userId).maybeSingle();
        if (existing && !cancelled) {
          setRegistrationId(existing.id);
          setParticipant({ firstName: existing.first_name, lastName: existing.last_name, document: existing.document, birthDate: existing.birth_date, gender: existing.gender });
          setContact({ phone: existing.phone, email: userEmail, emergencyName: existing.emergency_name, emergencyRelation: existing.emergency_relation, emergencyPhone: existing.emergency_phone });
          setPlan(existing.plan as PlanId);
          setPayment(existing.payment_type as "reserve" | "full");
          setReserveAmount(existing.amount);
          setRegistrationStatus(existing.status);
          setReviewNote(existing.review_note);
          setStep(5);
          clearLocalDraft(userId);
          return;
        }
        const saved = window.localStorage.getItem(`radical-registration-draft:v1:${userId}`);
        if (saved) {
          const draft = JSON.parse(saved) as Partial<RegistrationDraft>;
          if (draft.version === 1) {
            if (Number.isInteger(draft.step) && (draft.step ?? -1) >= 0 && (draft.step ?? 6) <= 5) setStep(Math.min(draft.step!, 4));
            if (draft.plan === null || draft.plan === "preventa" || draft.plan === "regular") setPlan(draft.plan);
            if (draft.participant && Object.values(draft.participant).every((value) => typeof value === "string")) setParticipant(draft.participant);
            if (draft.contact && Object.values(draft.contact).every((value) => typeof value === "string")) setContact({ ...draft.contact, email: userEmail });
            if (draft.payment === "reserve" || draft.payment === "full") setPayment(draft.payment);
            if (typeof draft.reserveAmount === "number" && Number.isFinite(draft.reserveAmount)) setReserveAmount(draft.reserveAmount);
            if (typeof draft.consent === "boolean") setConsent(draft.consent);

            const receipt = draft.receiptName ? await loadReceiptLocally(userId) : null;
            if (cancelled) return;
            if (receipt && ["image/jpeg", "image/png", "image/webp"].includes(receipt.type) && receipt.size <= 10 * 1024 * 1024) {
              const previewUrl = URL.createObjectURL(receipt);
              receiptBlobRef.current = receipt;
              receiptPreviewRef.current = previewUrl;
              setReceiptPreviewUrl(previewUrl);
              setReceiptName(draft.receiptName ?? "Comprobante guardado");
            }
          }
        }
      } catch {
        // Si el almacenamiento local falla, el formulario sigue disponible en esta sesión.
      } finally {
        if (!cancelled) setDraftReady(true);
      }
    }
    void restoreDraft();
    return () => { cancelled = true; };
  }, [userEmail, userId]);

  useEffect(() => {
    if (!draftReady || registrationStatus) return;
    const draft: RegistrationDraft = { version: 1, step, plan, participant, contact: { ...contact, email: userEmail }, payment, reserveAmount, receiptName, consent };
    try {
      window.localStorage.setItem(`radical-registration-draft:v1:${userId}`, JSON.stringify(draft));
    } catch {
      // El formulario conserva su estado aunque el navegador no permita guardar más datos.
    }
  }, [consent, contact, draftReady, participant, payment, plan, receiptName, registrationStatus, reserveAmount, step, userEmail, userId]);

  useEffect(() => {
    if (!draftReady) return;
    void storeReceiptLocally(userId, receiptPreviewUrl ? receiptBlobRef.current : null).catch(() => {});
  }, [draftReady, receiptName, receiptPreviewUrl, userId]);

  useEffect(() => () => {
    if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
    if (receiptPreviewRef.current) URL.revokeObjectURL(receiptPreviewRef.current);
  }, []);

  async function handleReceiptChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const selection = ++receiptSelectionRef.current;
    setReceiptError("");
    setPaymentError("");

    const rejectFile = (message: string) => {
      if (selection !== receiptSelectionRef.current) return;
      if (receiptPreviewRef.current) URL.revokeObjectURL(receiptPreviewRef.current);
      receiptPreviewRef.current = null;
      receiptBlobRef.current = null;
      setReceiptPreviewUrl(null);
      setReceiptName("");
      setReceiptError(message);
      input.value = "";
    };

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      rejectFile("Elige una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      rejectFile("La imagen debe pesar 10 MB o menos.");
      return;
    }

    const verificationUrl = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("invalid-image"));
        image.src = verificationUrl;
      });
    } catch {
      rejectFile("No se pudo leer la imagen. Prueba con otro archivo JPG, PNG o WebP.");
      return;
    } finally {
      URL.revokeObjectURL(verificationUrl);
    }

    if (selection !== receiptSelectionRef.current) return;
    if (receiptPreviewRef.current) URL.revokeObjectURL(receiptPreviewRef.current);
    const previewUrl = URL.createObjectURL(file);
    receiptPreviewRef.current = previewUrl;
    receiptBlobRef.current = file;
    setReceiptPreviewUrl(previewUrl);
    setReceiptName(file.name);
    setPaymentError("");
    input.value = "";
  }

  function removeReceipt() {
    receiptSelectionRef.current += 1;
    if (receiptPreviewRef.current) URL.revokeObjectURL(receiptPreviewRef.current);
    receiptPreviewRef.current = null;
    receiptBlobRef.current = null;
    setReceiptPreviewUrl(null);
    setReceiptName("");
    setReceiptError("");
    setPaymentError("");
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  }

  function lockNavigation(duration: number) {
    if (navigationLocked.current) return false;
    navigationLocked.current = true;
    navigationTimer.current = window.setTimeout(() => {
      navigationLocked.current = false;
      navigationTimer.current = null;
    }, duration);
    return true;
  }

  async function next(event?: FormEvent) {
    event?.preventDefault();
    if (!draftReady) return;
    if (step === 0 && !plan) {
      setValidationStep(step);
      return;
    }
    if (step === 1) {
      const invalidDate = Boolean(participant.birthDate) && Date.parse(participant.birthDate) >= Date.now();
      setBirthDateInvalid(invalidDate);
      if (!dataComplete || invalidDate) {
        setValidationStep(step);
        return;
      }
    }
    if (step === 2 && !contactComplete) {
      setValidationStep(step);
      return;
    }
    if (step === 3 && (!receiptPreviewUrl || Boolean(receiptError) || (payment === "reserve" && (!selected || !Number.isFinite(reserveAmount) || reserveAmount < 50 || reserveAmount > selected.price)))) {
      setPaymentError(!receiptPreviewUrl || receiptError ? "Sube el comprobante de pago para continuar." : `El abono debe ser desde S/50 y no superar S/${selected?.price ?? 0}.`);
      return;
    }
    if (step === 4 && !consent) {
      setValidationStep(step);
      return;
    }
    if (step === 4) {
      const invalidDate = Boolean(participant.birthDate) && Date.parse(participant.birthDate) >= Date.now();
      if (!plan || !selected) { setStep(0); setValidationStep(0); return; }
      if (!dataComplete || invalidDate) { setBirthDateInvalid(invalidDate); setStep(1); setValidationStep(1); return; }
      if (!contactComplete) { setStep(2); setValidationStep(2); return; }
      if (!receiptBlobRef.current || !receiptPreviewUrl || receiptError || (payment === "reserve" && (!Number.isInteger(reserveAmount) || reserveAmount < 50 || reserveAmount > selected.price))) {
        setStep(3); setPaymentError("Revisa el monto y vuelve a subir tu comprobante para continuar."); return;
      }
      if (submitLock.current || !plan || !selected || !receiptBlobRef.current) return;
      submitLock.current = true;
      setSubmitting(true);
      setSubmitError("");
      try {
      const supabase = createClient();
      const receipt = receiptBlobRef.current;
      const suffix = receipt.type === "image/png" ? "png" : receipt.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${suffix}`;
      const { error: uploadError } = await supabase.storage.from("registration-receipts").upload(path, receipt, { contentType: receipt.type });
      if (uploadError) {
        setSubmitError("No pudimos subir tu comprobante. Comprueba tu conexión e inténtalo otra vez.");
        return;
      }
      const { data: created, error } = await supabase.from("registrations").insert({ user_id: userId, first_name: participant.firstName.trim(), last_name: participant.lastName.trim(), document: participant.document.replace(/\s/g, ""), birth_date: participant.birthDate, gender: participant.gender, phone: contact.phone.trim(), email: userEmail, emergency_name: contact.emergencyName.trim(), emergency_relation: contact.emergencyRelation, emergency_phone: contact.emergencyPhone.trim(), plan, price: selected.price, amount, payment_type: payment, receipt_path: path }).select("id").single();
      if (error) {
        await supabase.storage.from("registration-receipts").remove([path]);
        const { data: existing } = await supabase.from("registrations").select("id,status").eq("user_id", userId).maybeSingle();
        if (!existing) {
          setSubmitError("No pudimos enviar tu inscripción. Tus datos siguen guardados en este dispositivo; inténtalo de nuevo.");
          return;
        }
        setRegistrationStatus(existing.status);
        setRegistrationId(existing.id);
      } else {
        setRegistrationStatus("pending");
        setRegistrationId(created.id);
      }
      clearLocalDraft(userId);
      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        setSubmitError("No pudimos conectar con el servidor. Tus datos siguen guardados en este dispositivo; inténtalo de nuevo.");
      } finally {
        submitLock.current = false;
        setSubmitting(false);
      }
      return;
    }
    if (!lockNavigation(1550)) return;
    setValidationStep(null);
    setStep((current) => Math.min(current + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    if (!draftReady) return;
    if (!lockNavigation(1150)) return;
    setValidationStep(null);
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function update(field: keyof Participant, value: string) {
    if (field === "birthDate") setBirthDateInvalid(false);
    setParticipant((current) => ({ ...current, [field]: value }));
  }
  function updateContact(field: keyof Contact, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
  }
  async function copyYapePhone() {
    try {
      await navigator.clipboard.writeText(yapePhoneNumber);
      setYapePhoneCopied(true);
    } catch {
      setPaymentError("No se pudo copiar el número. Puedes seleccionarlo manualmente.");
    }
  }

  return (
    <main className="registration-page">
      <div className="registration-shell">
        <header className="registration-header">
          <Link href="/" aria-label="Volver al inicio de Radical 2.0" className="registration-logo"><BrandLogo variant="secundario" width={150} priority /></Link>
          <div className="flex items-center gap-3 sm:gap-6"><Link href="/login" className="registration-home registration-account" aria-label={`Mi cuenta${userEmail ? `: ${userEmail}` : ""}`}>{avatarUrl ? <Image src={avatarUrl} alt="" width={34} height={34} unoptimized className="registration-account-avatar" /> : <span aria-hidden="true" className="registration-account-avatar registration-account-avatar--fallback">{(userEmail[0] ?? "R").toUpperCase()}</span>}<span>Mi cuenta</span></Link><Link href="/#inscribirme" className="registration-home"><ArrowLeft size={16} /> <span>Volver</span></Link></div>
        </header>

        <div className="registration-content">
          <div className="registration-grid">
            <section className="registration-main" aria-labelledby="registration-title">
              <RegistrationProgress currentStep={step} className="registration-progress--desktop" />
              <RegistrationProgress currentStep={step} className="registration-progress--mobile" />
              <div className="registration-heading">
                <h1 id="registration-title" aria-label={titles[step].replace("\n", " ")}><StaggeredTitle text={titles[step]} /></h1>
                <p>{subtitles[step]}</p>
                <div className="registration-film-reels-slot">
                  <CampFilmReels />
                </div>
              </div>

              {step === 0 && <div className="registration-plans" role="radiogroup" aria-label="Plan de inscripción">
                {(Object.entries(plans) as [PlanId, typeof plans[PlanId]][]).map(([id, item]) => (
                  <label key={id} className={`registration-plan ${plan === id ? "is-selected" : ""}`}>
                    <input type="radio" name="registration-plan" value={id} checked={plan === id} onChange={() => setPlan(id)} />
                    <span className="registration-plan-watermark" aria-hidden="true">
                      <span className="registration-plan-watermark-birds">
                        <Image className="registration-plan-bird registration-plan-bird-1" src="/assets/elements/elem-flying-bird-single-1.webp" alt="" width={170} height={81} sizes="34px" />
                        <Image className="registration-plan-bird registration-plan-bird-2" src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} sizes="25px" />
                        <Image className="registration-plan-bird registration-plan-bird-3" src="/assets/elements/elem-flying-bird-single-3.webp" alt="" width={151} height={64} sizes="23px" />
                        <Image className="registration-plan-bird registration-plan-bird-4" src="/assets/elements/elem-flying-bird-single-4.webp" alt="" width={154} height={71} sizes="20px" />
                        <Image className="registration-plan-bird registration-plan-bird-5" src="/assets/elements/elem-flying-bird-single-2.webp" alt="" width={137} height={62} sizes="18px" />
                      </span>
                      <span className="registration-plan-watermark-vegetation">
                        <Image className="registration-plan-plant registration-plan-plant-bush" src="/assets/elements/elem-tropical-bush-large.webp" alt="" width={343} height={337} sizes="190px" />
                        <Image className="registration-plan-plant registration-plan-plant-frond" src="/assets/elements/elem-palm-frond-leaf.webp" alt="" width={294} height={250} sizes="150px" />
                        <Image className="registration-plan-plant registration-plan-plant-leaf" src="/assets/elements/elem-tropical-leaf-green-yellow.webp" alt="" width={331} height={183} sizes="175px" />
                        <Image className="registration-plan-plant registration-plan-plant-palm" src="/assets/elements/elem-palm-tree-tall-curved.webp" alt="" width={346} height={544} sizes="195px" />
                        <Image className="registration-plan-plant registration-plan-plant-flower" src="/assets/elements/elem-hibiscus-flower-red.webp" alt="" width={197} height={183} sizes="46px" />
                      </span>
                    </span>
                    {id === "preventa" && <span className="registration-plan-popular">Más popular</span>}
                    <span className="registration-plan-brush"><Image className="registration-plan-brush-mobile" src={item.brush} alt="" fill sizes="(max-width: 850px) 50vw, 1px" /><Image className="registration-plan-brush-desktop" src={item.desktopBrush} alt="" fill sizes="300px" /></span>
                    <span className="registration-plan-check"><Check size={16} strokeWidth={3} /></span>
                    <strong>{item.name}</strong>
                    <span className="registration-plan-price"><small>S/</small>{item.price}</span>
                    <span className="registration-plan-date">{item.date}</span>
                    <span className="registration-plan-benefits">{benefits.map((benefit) => <span key={benefit}><Check size={15} strokeWidth={3} />{benefit}</span>)}</span>
                    <span className="registration-plan-selector" aria-hidden="true"><span /></span>
                  </label>
                ))}
                {showStepErrors && !plan && <p className="registration-error" role="alert">Selecciona un plan para continuar.</p>}
              </div>}

              {step === 1 && <form id="registration-form" className="registration-form" onSubmit={next} noValidate>
                <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Continuar</button>
                <div className="registration-form-grid">
                  <label className={`registration-field-wide ${participantErrors.firstName ? "registration-field-invalid" : ""}`}><span className="registration-field-label"><UserRound /> Nombres</span><input aria-required="true" aria-invalid={participantErrors.firstName ? true : undefined} aria-describedby={participantErrors.firstName ? "first-name-error" : undefined} autoComplete="given-name" value={participant.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Tus nombres" /><FieldValidationMessage id="first-name-error" message={participantErrors.firstName} /></label>
                  <label className={`registration-field-wide ${participantErrors.lastName ? "registration-field-invalid" : ""}`}><span className="registration-field-label"><UsersRound /> Apellidos</span><input aria-required="true" aria-invalid={participantErrors.lastName ? true : undefined} aria-describedby={participantErrors.lastName ? "last-name-error" : undefined} autoComplete="family-name" value={participant.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Tus apellidos" /><FieldValidationMessage id="last-name-error" message={participantErrors.lastName} /></label>
                  <label className={participantErrors.document ? "registration-field-invalid" : ""}><span className="registration-field-label"><IdCard /> Documento</span><input aria-required="true" aria-invalid={participantErrors.document ? true : undefined} aria-describedby={participantErrors.document ? "document-error" : undefined} value={participant.document} onChange={(e) => update("document", e.target.value)} placeholder="DNI o documento" /><FieldValidationMessage id="document-error" message={participantErrors.document} /></label>
                  <label className={participantErrors.birthDate ? "registration-field-invalid" : ""}><span className="registration-field-label"><CalendarDays /> Nacimiento</span><input aria-required="true" aria-invalid={participantErrors.birthDate ? true : undefined} aria-describedby={participantErrors.birthDate ? "birth-date-error" : undefined} type="date" value={participant.birthDate} onChange={(e) => update("birthDate", e.target.value)} /><FieldValidationMessage id="birth-date-error" message={participantErrors.birthDate} /></label>
                  <fieldset className={`registration-gender registration-field-wide ${participantErrors.gender ? "registration-field-invalid" : ""}`} aria-invalid={participantErrors.gender ? true : undefined} aria-describedby={participantErrors.gender ? "gender-error" : undefined}><legend><UsersRound size={17} /> Género</legend>{[["masculino", "Masculino"], ["femenino", "Femenino"], ["otro", "Prefiero no decirlo"]].map(([value, label]) => <label key={value}><input type="radio" name="gender" value={value} checked={participant.gender === value} onChange={() => update("gender", value)} /><span>{label}</span></label>)}<FieldValidationMessage id="gender-error" message={participantErrors.gender} /></fieldset>
                </div>
              </form>}

              {step === 2 && <form id="registration-contact-form" className="registration-form registration-contact-form" onSubmit={next} noValidate>
                <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Continuar</button>
                <h2>Datos de contacto</h2>
                <div className="registration-form-grid registration-contact-identity">
                  <label className={`${contactErrors.email ? "registration-field-invalid" : ""}`}><span className="registration-field-label"><Mail /> Correo de tu cuenta</span><input aria-required="true" aria-readonly="true" aria-invalid={contactErrors.email ? true : undefined} aria-describedby={contactErrors.email ? "account-email-error" : undefined} type="email" autoComplete="email" value={contact.email} readOnly />{contactErrors.email && <FieldValidationMessage id="account-email-error" message={contactErrors.email} />}</label>
                  <label className={`${contactErrors.phone ? "registration-field-invalid" : ""}`}><span className="registration-field-label"><Phone /> Número de WhatsApp</span><input aria-required="true" aria-invalid={contactErrors.phone ? true : undefined} aria-describedby={contactErrors.phone ? "participant-phone-error" : undefined} type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => updateContact("phone", e.target.value)} placeholder="+51 987 654 321" /><FieldValidationMessage id="participant-phone-error" message={contactErrors.phone} /></label>
                </div>
                <div className="registration-emergency"><h2>Contacto de emergencia</h2><div className="registration-form-grid"><label className={contactErrors.emergencyName ? "registration-field-invalid" : ""}><span className="registration-field-label"><UserRound /> Nombre completo</span><input aria-required="true" aria-invalid={contactErrors.emergencyName ? true : undefined} aria-describedby={contactErrors.emergencyName ? "emergency-name-error" : undefined} autoComplete="off" value={contact.emergencyName} onChange={(e) => updateContact("emergencyName", e.target.value)} placeholder="Nombre y apellidos" /><FieldValidationMessage id="emergency-name-error" message={contactErrors.emergencyName} /></label><label className={contactErrors.emergencyRelation ? "registration-field-invalid" : ""}><span className="registration-field-label"><UsersRound /> Parentesco</span><select aria-required="true" aria-invalid={contactErrors.emergencyRelation ? true : undefined} aria-describedby={contactErrors.emergencyRelation ? "emergency-relation-error" : undefined} value={contact.emergencyRelation} onChange={(e) => updateContact("emergencyRelation", e.target.value)}><option value="">Selecciona</option><option>Madre</option><option>Padre</option><option>Familiar</option><option>Apoderado</option><option>Otro</option></select><FieldValidationMessage id="emergency-relation-error" message={contactErrors.emergencyRelation} /></label><label className={`registration-field-wide ${contactErrors.emergencyPhone ? "registration-field-invalid" : ""}`}><span className="registration-field-label"><Phone /> Celular de emergencia</span><input aria-required="true" aria-invalid={contactErrors.emergencyPhone ? true : undefined} aria-describedby={contactErrors.emergencyPhone ? "emergency-phone-error" : undefined} type="tel" value={contact.emergencyPhone} onChange={(e) => updateContact("emergencyPhone", e.target.value)} placeholder="+51 987 987 654" /><FieldValidationMessage id="emergency-phone-error" message={contactErrors.emergencyPhone} /></label></div></div>
              </form>}

              {step === 3 && <div className="registration-payment-composition">
                <div className="registration-payment-method"><div className="registration-payment-info"><div><strong>2. Paga con Yape</strong><p>{yapePhoneNumber ? "Escanea el QR o usa el número de celular." : "Escanea el QR para realizar tu pago."}</p></div></div><Image className="registration-payment-qr" src="/assets/registration/payment-qr.png" alt="Código QR de Yape para realizar el pago de inscripción" width={220} height={222} /><div className="registration-yape-details">{yapeHolder && <strong>{yapeHolder}</strong>}{yapePhoneNumber && <div className="registration-yape-number"><span>{yapePhoneNumber}</span><button type="button" onClick={() => void copyYapePhone()}><Copy size={14} />{yapePhoneCopied ? "Copiado" : "Copiar"}</button></div>}<a href="/assets/registration/payment-qr.png" download="qr-yape-inscripcion.png"><Download size={15} />Descargar QR</a></div></div>
                <div className="registration-payment">
                  <div className="registration-payment-options">
                    <p className="registration-payment-step-label"><span>1</span> Elige cómo pagar</p>
                    <div className="registration-payment-choices" role="radiogroup" aria-label="Monto del abono">
                      <label className={payment === "reserve" ? "is-selected" : ""}><input type="radio" name="payment" checked={payment === "reserve"} onChange={() => setPayment("reserve")} /><span className="registration-radio" /><span><strong>Reserva tu cupo</strong><small>Abono desde S/50 · paga el saldo después</small></span><b>Desde S/50</b></label>
                      <label className={payment === "full" ? "is-selected" : ""}><input type="radio" name="payment" checked={payment === "full"} onChange={() => setPayment("full")} /><span className="registration-radio" /><span><strong>Pago completo</strong><small>Todo listo de una vez</small></span><b>S/{selected?.price}</b></label>
                    </div>
                    {payment === "reserve" && <label className="registration-deposit-amount">Monto de tu abono (S/)<input type="number" min={50} max={selected?.price} step={1} inputMode="numeric" value={reserveAmount} aria-invalid={showStepErrors && (reserveAmount < 50 || reserveAmount > (selected?.price ?? 0))} onChange={(event) => setReserveAmount(event.currentTarget.value === "" ? 0 : Number(event.currentTarget.value))} /><small>Desde S/50 hasta el precio total de tu plan.</small></label>}
                  </div>
                  <section className="registration-receipt" aria-labelledby="receipt-title"><span id="receipt-title" className="registration-receipt-title"><b>3</b><strong>Sube tu comprobante de pago</strong></span><input ref={receiptInputRef} id="receipt-file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Selecciona una imagen del comprobante de pago" aria-invalid={receiptError || paymentError || (showStepErrors && !receiptPreviewUrl) ? true : undefined} aria-describedby={[receiptError ? "receipt-error" : "", paymentError ? "payment-error" : "", !receiptError && !paymentError && !receiptPreviewUrl ? "receipt-hint" : ""].filter(Boolean).join(" ") || undefined} onChange={handleReceiptChange} />{receiptPreviewUrl ? <div className="registration-receipt-selected"><div className="registration-receipt-preview"><Image src={receiptPreviewUrl} alt={`Vista previa del comprobante ${receiptName}`} width={800} height={600} unoptimized /></div><div className="registration-receipt-file-info"><strong title={receiptName}>{receiptName}</strong><div><button type="button" onClick={() => receiptInputRef.current?.click()}><FileText size={16} /> Cambiar imagen</button><button type="button" className="registration-receipt-remove" onClick={removeReceipt}><Trash2 size={16} /> Eliminar</button></div></div></div> : <label id="receipt-hint" htmlFor="receipt-file" className="registration-receipt-drop"><FileText size={20} /> Elegir imagen</label>}{receiptError && <span id="receipt-error" className="registration-receipt-error" role="alert">{receiptError}</span>}{paymentError && <span id="payment-error" className="registration-receipt-error" role="alert">{paymentError}</span>}</section>
                </div>
              </div>}

              {step === 4 && <div className="registration-review">
                <div className="registration-review-row"><span>Participante</span><strong>{participant.firstName} {participant.lastName}</strong></div>
                <div className="registration-review-row"><span>Documento</span><strong>{participant.document}</strong></div>
                <div className="registration-review-row"><span>Nacimiento</span><strong>{participant.birthDate}</strong></div>
                <div className="registration-review-row"><span>Contacto</span><strong>{contact.phone}</strong></div>
                <div className="registration-review-row"><span>Correo</span><strong>{contact.email}</strong></div>
                <div className="registration-review-row"><span>Emergencia</span><strong>{contact.emergencyName} · {contact.emergencyRelation}<br />{contact.emergencyPhone}</strong></div>
                <div className="registration-review-row"><span>Plan</span><strong>{selected?.name} · S/{selected?.price}</strong></div>
                <div className="registration-review-row"><span>Primer abono</span><strong>S/{amount}</strong></div>
                <div className="registration-review-row"><span>Saldo posterior</span><strong>S/{remaining}</strong></div>
                <label className={`registration-consent ${showStepErrors && !consent ? "registration-field-invalid" : ""}`}><input type="checkbox" aria-invalid={showStepErrors && !consent ? true : undefined} aria-describedby={showStepErrors && !consent ? "consent-error" : undefined} checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>Revisé mis datos y autorizo su uso para gestionar mi inscripción.</span>{showStepErrors && !consent && <FieldValidationMessage id="consent-error" message="Confirma que revisaste la información." />}</label>
                {submitError && <p className="registration-error" role="alert">{submitError}</p>}
              </div>}

              {step === 5 && <div className="registration-ticket-preview">
                <div className="registration-ticket-icon"><Ticket size={38} /></div>
                <span className="registration-preview-tag">INSCRIPCIÓN ENVIADA</span>
                <h2>{registrationStatus === "approved" ? "¡Tu inscripción fue aprobada!" : registrationStatus === "rejected" ? "Tu comprobante necesita revisión" : "Estamos revisando tu inscripción"}</h2>
                <p>{registrationStatus === "rejected" ? "Comunícate con el equipo para revisar tu comprobante." : "El equipo revisará tu comprobante y actualizará el estado de tu inscripción."}</p>
                {registrationStatus === "rejected" && reviewNote && <p>Nota del equipo: {reviewNote}</p>}
                <div className="registration-ticket-status"><Clock3 size={19} /><span>{registrationStatus === "approved" ? "Pago aprobado" : registrationStatus === "rejected" ? "Comprobante observado" : "Pendiente de revisión"}</span></div>
                <Link href="/mi-inscripcion" className="registration-mi-espacio-link">Ir a mi espacio<ArrowRight size={18} /></Link>
                <p className="registration-mi-espacio-hint">Desde ahí podrás gestionar tus abonos y ver tu historial.</p>
              </div>}

              <div className="registration-actions">
                {step > 0 && step < 5 && <button type="button" className="registration-back" disabled={submitting} onClick={back}><ArrowLeft size={18} /> Atrás</button>}
                {step < 5 && <button type="button" className="registration-next" disabled={!draftReady || submitting} onClick={() => void next()}><span>{submitting ? "Enviando…" : step === 4 ? "Enviar inscripción" : "Continuar"}</span><ArrowRight size={23} /></button>}
              </div>
            </section>

            <aside className="registration-aside" aria-label="Resumen de inscripción">
              <div className="registration-summary"><span className="registration-summary-kicker">RESUMEN DE TU AVENTURA</span><h2>TU PASE <em>RADICAL</em></h2><p>30 DIC — 03 ENE · MEJÍA, AREQUIPA</p><div className="registration-summary-line" /><div className="registration-summary-detail"><span>Plan elegido</span><strong>{selected?.name ?? "Elige una opción"}</strong></div><div className="registration-summary-detail"><span>Precio del plan</span><strong>{selected ? `S/${selected.price}` : "—"}</strong></div>{step >= 3 && selected && <><div className="registration-summary-detail"><span>Abono elegido</span><strong>S/{amount}</strong></div><div className="registration-summary-detail"><span>Saldo restante</span><strong>S/{remaining}</strong></div></>}<div className="registration-summary-note"><CheckCircle2 size={18} /><span>{selected ? "Plan listo para continuar" : "Elige tu plan para comenzar"}</span></div></div>
              <div className="registration-aside-art" aria-hidden="true"><Image src="/assets/elements/elem-surfboard-tropical-stripes.webp" alt="" width={360} height={650} /></div>
            </aside>
          </div>
        </div>
      </div>
      <div className="registration-ambient" aria-hidden="true">
        <Image className="registration-ambient-sand" src="/assets/footer/arena-footer.webp" alt="" width={2172} height={244} />
        <div className="registration-ambient-left-scene">
          <Image className="registration-scene-left-bush" src="/assets/footer/arbustos-izquierda.webp" alt="" width={1400} height={933} />
          <Image className="registration-scene-left-foliage" src="/assets/footer/follaje-lateral-izquierdo.webp" alt="" width={933} height={1400} />
          <Image className="registration-scene-left-rocks" src="/assets/footer/rocas-izquierda.webp" alt="" width={1400} height={1050} />
          <Image className="registration-scene-left-flower" src="/assets/elements/elem-hibiscus-flower-red.webp" alt="" width={385} height={382} />
        </div>
        <div className="registration-ambient-right-scene">
          <Image className="registration-scene-right-palm" src="/assets/elements/elem-palm-tree-tall-curved.webp" alt="" width={346} height={544} />
          <Image className="registration-scene-right-foliage" src="/assets/footer/follaje-lateral-izquierdo.webp" alt="" width={933} height={1400} />
          <Image className="registration-scene-right-bush" src="/assets/footer/arbustos-inferiores-derechos.webp" alt="" width={1400} height={933} />
          <Image className="registration-scene-right-rocks" src="/assets/footer/rocas-extremo-derecho.webp" alt="" width={1400} height={467} />
          <Image className="registration-scene-surfboard" src="/assets/footer/tabla-surf.webp" alt="" width={933} height={1400} />
          <Image className="registration-scene-backpack" src="/assets/footer/mochila-radical.webp" alt="" width={1199} height={1312} />
          <Image className="registration-scene-lantern" src="/assets/footer/lampara-radical.webp" alt="" width={933} height={1400} />
        </div>
        <Image className="registration-ambient-birds" src="/assets/elements/elem-flying-birds-flock.webp" alt="" width={459} height={190} />
      </div>
      <div className="registration-corners" aria-hidden="true">
        <Image className="registration-corner registration-corner-palm" src="/assets/registration/corner-palm.webp" alt="" width={1536} height={1024} sizes="(min-width: 1440px) 470px, 32vw" />
        <Image className="registration-corner registration-corner-turquoise" src="/assets/registration/corner-turquoise-brush.webp" alt="" width={1774} height={887} sizes="(min-width: 1440px) 500px, 36vw" />
        <Image className="registration-corner registration-corner-yellow" src="/assets/registration/corner-yellow-brush.webp" alt="" width={1536} height={1024} sizes="(min-width: 1440px) 410px, 30vw" />
        <Image className="registration-corner registration-corner-surfboard" src="/assets/registration/corner-surfboard-garden.webp" alt="" width={1127} height={1396} sizes="(min-width: 1440px) 390px, 28vw" />
      </div>
    </main>
  );
}
