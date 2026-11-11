"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, CreditCard, FileText, IdCard, Ticket, UserRound, UsersRound, Wallet, Phone } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import "./RegistrationFlow.css";

type PlanId = "preventa" | "regular";
type Participant = { firstName: string; lastName: string; document: string; birthDate: string; gender: string };
type Contact = { phone: string; emergencyName: string; emergencyRelation: string; emergencyPhone: string };
const plans = {
  preventa: { name: "Preventa", price: 200, date: "Hasta el 15 de diciembre", brush: "/assets/elements/brush-planes-amarillo.png", desktopBrush: "/assets/elements/elem-brush-banner-orange.webp" },
  regular: { name: "Regular", price: 250, date: "Desde el 16 de diciembre", brush: "/assets/elements/brush-planes-turquesa.png", desktopBrush: "/assets/elements/brush-planes-turquesa.png" },
} as const;
const benefits = ["Hospedaje", "Alimentación completa", "Programación y materiales", "Amistad del evento", "Acceso a todas las actividades"];
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
  { label: "Mi entrada", icon: CheckCircle2 },
] as const;
const titles = ["ELIGE TU PLAN\nDE INSCRIPCIÓN", "INFORMACIÓN\nPERSONAL", "CONTACTO Y\nEMERGENCIA", "ELIGE TU ABONO", "REVISA TUS DATOS", "TU ESPACIO RADICAL"];
const subtitles = ["Asegura tu cupo y vive el siguiente nivel en Radical 2.0.", "Datos del campista", "Cómo comunicarnos contigo y a quién llamar en una emergencia.", "Puedes separar tu cupo con S/50 o pagar el plan completo.", "Confirma que todo esté listo antes de enviar tu inscripción.", "Así se verá el estado de tu inscripción y tu entrada digital."];
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

export function RegistrationFlow({ initialPlan }: { initialPlan: PlanId | null }) {
  const [step, setStep] = useState(0);
  const navigationLocked = useRef(false);
  const navigationTimer = useRef<number | null>(null);
  const [plan, setPlan] = useState<PlanId | null>(initialPlan ?? "preventa");
  const [participant, setParticipant] = useState<Participant>({ firstName: "", lastName: "", document: "", birthDate: "", gender: "" });
  const [contact, setContact] = useState<Contact>({ phone: "", emergencyName: "", emergencyRelation: "", emergencyPhone: "" });
  const [payment, setPayment] = useState<"reserve" | "full">("reserve");
  const [receiptName, setReceiptName] = useState("");
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const receiptPreviewRef = useRef<string | null>(null);
  const receiptSelectionRef = useRef(0);
  const [consent, setConsent] = useState(false);
  const [validationStep, setValidationStep] = useState<number | null>(null);
  const [birthDateInvalid, setBirthDateInvalid] = useState(false);
  const selected = plan ? plans[plan] : null;
  const amount = payment === "reserve" ? 50 : selected?.price ?? 0;
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
    phone: !contact.phone.trim() ? "Ingresa el celular del campista." : /^\d{9,15}$/.test(contact.phone.replace(/[\s+()-]/g, "")) ? "" : "Ingresa un celular válido.",
    emergencyName: contact.emergencyName.trim() ? "" : "Ingresa el nombre del contacto.",
    emergencyRelation: contact.emergencyRelation ? "" : "Selecciona el parentesco.",
    emergencyPhone: !contact.emergencyPhone.trim() ? "Ingresa el celular de emergencia." : /^\d{9,15}$/.test(contact.emergencyPhone.replace(/[\s+()-]/g, "")) ? "" : "Ingresa un celular válido.",
  } : {};

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

    const rejectFile = (message: string) => {
      if (selection !== receiptSelectionRef.current) return;
      if (receiptPreviewRef.current) URL.revokeObjectURL(receiptPreviewRef.current);
      receiptPreviewRef.current = null;
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
    setReceiptPreviewUrl(previewUrl);
    setReceiptName(file.name);
    input.value = "";
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

  function next(event?: FormEvent) {
    event?.preventDefault();
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
    if (step === 4 && !consent) {
      setValidationStep(step);
      return;
    }
    if (!lockNavigation(1550)) return;
    setValidationStep(null);
    setStep((current) => Math.min(current + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
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

  return (
    <main className="registration-page">
      <div className="registration-shell">
        <header className="registration-header">
          <Link href="/" aria-label="Volver al inicio de Radical 2.0" className="registration-logo"><BrandLogo variant="secundario" width={150} priority /></Link>
          <Link href="/#inscribirme" className="registration-home"><ArrowLeft size={16} /> <span>Volver</span></Link>
        </header>

        <div className="registration-content">
          <div className="registration-grid">
            <section className="registration-main" aria-labelledby="registration-title">
              <RegistrationProgress currentStep={step} className="registration-progress--desktop" />
              <RegistrationProgress currentStep={step} className="registration-progress--mobile" />
              <div className="registration-heading" key={step}>
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
                <div className="registration-form-grid"><label className={`registration-field-wide ${contactErrors.phone ? "registration-field-invalid" : ""}`}><span className="registration-field-label"><Phone /> Celular del campista</span><input aria-required="true" aria-invalid={contactErrors.phone ? true : undefined} aria-describedby={contactErrors.phone ? "participant-phone-error" : undefined} type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => updateContact("phone", e.target.value)} placeholder="+51 987 654 321" /><FieldValidationMessage id="participant-phone-error" message={contactErrors.phone} /></label></div>
                <div className="registration-emergency"><h2>Contacto de emergencia</h2><div className="registration-form-grid"><label className={contactErrors.emergencyName ? "registration-field-invalid" : ""}><span className="registration-field-label"><UserRound /> Nombre completo</span><input aria-required="true" aria-invalid={contactErrors.emergencyName ? true : undefined} aria-describedby={contactErrors.emergencyName ? "emergency-name-error" : undefined} autoComplete="off" value={contact.emergencyName} onChange={(e) => updateContact("emergencyName", e.target.value)} placeholder="Nombre y apellidos" /><FieldValidationMessage id="emergency-name-error" message={contactErrors.emergencyName} /></label><label className={contactErrors.emergencyRelation ? "registration-field-invalid" : ""}><span className="registration-field-label"><UsersRound /> Parentesco</span><select aria-required="true" aria-invalid={contactErrors.emergencyRelation ? true : undefined} aria-describedby={contactErrors.emergencyRelation ? "emergency-relation-error" : undefined} value={contact.emergencyRelation} onChange={(e) => updateContact("emergencyRelation", e.target.value)}><option value="">Selecciona</option><option>Madre</option><option>Padre</option><option>Familiar</option><option>Apoderado</option><option>Otro</option></select><FieldValidationMessage id="emergency-relation-error" message={contactErrors.emergencyRelation} /></label><label className={`registration-field-wide ${contactErrors.emergencyPhone ? "registration-field-invalid" : ""}`}><span className="registration-field-label"><Phone /> Celular de emergencia</span><input aria-required="true" aria-invalid={contactErrors.emergencyPhone ? true : undefined} aria-describedby={contactErrors.emergencyPhone ? "emergency-phone-error" : undefined} type="tel" value={contact.emergencyPhone} onChange={(e) => updateContact("emergencyPhone", e.target.value)} placeholder="+51 987 987 654" /><FieldValidationMessage id="emergency-phone-error" message={contactErrors.emergencyPhone} /></label></div></div>
              </form>}

              {step === 3 && <div className="registration-payment">
                <div className="registration-payment-choices" role="radiogroup" aria-label="Monto del abono">
                  <label className={payment === "reserve" ? "is-selected" : ""}><input type="radio" name="payment" checked={payment === "reserve"} onChange={() => setPayment("reserve")} /><span className="registration-radio" /><span><strong>Reserva tu cupo</strong><small>Paga el saldo después</small></span><b>S/50</b></label>
                  <label className={payment === "full" ? "is-selected" : ""}><input type="radio" name="payment" checked={payment === "full"} onChange={() => setPayment("full")} /><span className="registration-radio" /><span><strong>Pago completo</strong><small>Todo listo de una vez</small></span><b>S/{selected?.price}</b></label>
                </div>
                <div className="registration-payment-info"><CreditCard size={23} /><div><strong>Pago por Yape y validación manual</strong><p>El QR oficial y el envío del comprobante se habilitarán al conectar el sistema de inscripciones. Aquí puedes explorar cómo funcionará el flujo.</p></div></div>
                <label className="registration-receipt">Comprobante de pago <span>Imagen JPG, PNG o WebP · máximo 10 MB. La vista previa queda en este dispositivo.</span><input type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={receiptError ? true : undefined} aria-describedby={receiptError ? "receipt-error" : "receipt-hint"} onChange={handleReceiptChange} /><span id="receipt-hint" className="registration-receipt-drop">{receiptName ? <><FileText size={20} /> Cambiar imagen · {receiptName}</> : <><FileText size={20} /> Elegir imagen</>}</span>{receiptPreviewUrl && <span className="registration-receipt-preview"><Image src={receiptPreviewUrl} alt={`Vista previa del comprobante ${receiptName}`} width={800} height={600} unoptimized /></span>}{receiptError && <span id="receipt-error" className="registration-receipt-error" role="alert">{receiptError}</span>}</label>
              </div>}

              {step === 4 && <div className="registration-review">
                <div className="registration-review-row"><span>Participante</span><strong>{participant.firstName} {participant.lastName}</strong></div>
                <div className="registration-review-row"><span>Documento</span><strong>{participant.document}</strong></div>
                <div className="registration-review-row"><span>Nacimiento</span><strong>{participant.birthDate}</strong></div>
                <div className="registration-review-row"><span>Contacto</span><strong>{contact.phone}</strong></div>
                <div className="registration-review-row"><span>Emergencia</span><strong>{contact.emergencyName} · {contact.emergencyRelation}<br />{contact.emergencyPhone}</strong></div>
                <div className="registration-review-row"><span>Plan</span><strong>{selected?.name} · S/{selected?.price}</strong></div>
                <div className="registration-review-row"><span>Primer abono</span><strong>S/{amount}</strong></div>
                <div className="registration-review-row"><span>Saldo posterior</span><strong>S/{remaining}</strong></div>
                <label className={`registration-consent ${showStepErrors && !consent ? "registration-field-invalid" : ""}`}><input type="checkbox" aria-invalid={showStepErrors && !consent ? true : undefined} aria-describedby={showStepErrors && !consent ? "consent-error" : undefined} checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>Revisé mis datos y entiendo que esta es una vista previa; todavía no se ha enviado una inscripción ni un pago.</span>{showStepErrors && !consent && <FieldValidationMessage id="consent-error" message="Confirma que revisaste la información." />}</label>
              </div>}

              {step === 5 && <div className="registration-ticket-preview">
                <div className="registration-ticket-icon"><Ticket size={38} /></div>
                <span className="registration-preview-tag">VISTA PREVIA · SIN INSCRIPCIÓN ACTIVA</span>
                <h2>Tu campamento, en un solo lugar</h2>
                <p>Cuando el sistema esté conectado, aquí aparecerán el estado de tus abonos, la revisión de tu comprobante y tu entrada con QR una vez aprobada.</p>
                <div className="registration-ticket-status"><Clock3 size={19} /><span>Entrada digital disponible después de la aprobación</span></div>
              </div>}

              <div className="registration-actions">
                {step > 0 && <button type="button" className="registration-back" onClick={back}><ArrowLeft size={18} /> Atrás</button>}
                {step < 5 && <button type="button" className="registration-next" onClick={() => next()}><span>{step === 4 ? "Ver vista previa" : "Continuar"}</span><ArrowRight size={23} /></button>}
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
    </main>
  );
}
