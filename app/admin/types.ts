export type Registration = {
  id: string;
  user_id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  document: string;
  birth_date: string;
  gender: string;
  phone: string;
  email: string;
  emergency_name: string;
  emergency_relation: string;
  emergency_phone: string;
  plan: string;
  price: number;
  amount: number;
  payment_type: string;
  status: string;
  receipt_path: string;
  payment_method?: string;
  original_receipt_path: string | null;
  review_note: string | null;
};

export type RegistrationPayment = {
  id: string;
  registration_id: string;
  amount: number;
  status: string;
  kind: string;
  method?: string;
  receipt_path: string | null;
  review_note: string | null;
  created_at: string;
  signedUrl?: string;
};

export type PaymentItem = {
  id: string;
  registrationId: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  kind: string;
  date: string;
};

export type AdminUser = {
  user_id: string;
  role: string;
  email: string;
};

export type ReviewEvent = {
  id: string;
  payment_id: string | null;
  created_at: string;
  old_status: string;
  new_status: string;
  note: string | null;
};

export const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Observado",
};

export const errorMessages: Record<string, string> = {
  login: "Correo o contraseña incorrectos.",
  reset: "Ingresa un correo válido.",
  reset_link:
    "El enlace de recuperación venció o ya fue utilizado. Solicita otro.",
  reset_service: "No se pudo enviar el enlace. Inténtalo más tarde.",
  reset_domain:
    "Solicita el enlace desde radical.ielp.org/admin para abrirlo en el mismo navegador.",
  master_only:
    "Solo la cuenta maestra puede cambiar un pago que ya fue aprobado.",
  access: "Esta cuenta no tiene acceso al panel.",
  review:
    "No se pudo actualizar la revisión. Revisa primero los abonos adicionales aprobados.",
  password: "Las contraseñas deben coincidir y tener al menos 6 caracteres.",
  admin_unverified:
    "La cuenta debe confirmar su correo antes de recibir acceso.",
  admin_not_found: "No encontramos una cuenta con ese correo.",
  admin_input:
    "Ingresa un correo válido y una contraseña de al menos 6 caracteres.",
  admin_create:
    "No se pudo crear el administrador. Comprueba que el correo no esté registrado.",
  configuration:
    "Falta configurar la clave de servidor de Supabase para gestionar administradores.",
  note: "Escribe una nota para explicar la observación al participante.",
  settings: "No se pudo guardar la configuración. Revisa la fecha e inténtalo de nuevo.",
  whatsapp: "El enlace no es válido. Debe ser una invitación de grupo, como https://chat.whatsapp.com/AbC123…",
  document_taken: "Ese documento ya pertenece a otra inscripción.",
  registration_data:
    "No se pudieron guardar los datos. Revisa que el documento (6 a 12 letras o números), el correo y los teléfonos sean válidos.",
  cash: "No se pudo registrar el efectivo. El monto no puede superar el saldo pendiente; si la inscripción aún no está aprobada, debe ser de S/ 50 como mínimo.",
  checkin: "No se pudo registrar el ingreso. Vuelve a escanear la entrada e inténtalo otra vez.",
  ticket: "Ese código no corresponde a ninguna entrada. Revisa que esté bien escrito.",
  invite_input:
    "Revisa la invitación: nombre, detalle, abono entre S/ 50 y el precio del plan, de 1 a 20 cupos y una fecha de vencimiento futura.",
  invite_receipt: "Sube la captura del pago (JPG, PNG o WebP, hasta 3,5 MB).",
  invite_create: "No se pudo guardar la invitación. Inténtalo de nuevo.",
  delete_registration: "No se pudo eliminar la inscripción.",
  delete_account: "No se pudo eliminar la cuenta.",
  delete_account_admin: "Esa cuenta es del equipo administrador: retírale el acceso desde Equipo.",
  payment_review:
    "No se pudo actualizar el abono. Comprueba que no supere el saldo pendiente y que la inscripción esté aprobada.",
};

export const successMessages: Record<string, string> = {
  reset_sent:
    "Si el correo tiene una cuenta, recibirá un enlace. Ábrelo en este mismo navegador para crear o restablecer tu contraseña.",
  review: "Revisión actualizada.",
  settings: "Configuración guardada.",
  whatsapp: "Enlace del grupo de WhatsApp guardado.",
  registration_data: "Datos de la inscripción actualizados.",
  cash: "Pago en efectivo registrado y aprobado.",
  checkin: "Ingreso registrado.",
  password: "Contraseña actualizada.",
  admin_existing: "Se concedió acceso a la cuenta existente.",
  admin_password: "Contraseña de la cuenta administradora actualizada.",
  admin: "Administrador creado. Comparte sus credenciales por un canal seguro.",
  removed: "Acceso de administrador retirado.",
  invite: "Invitación creada. Copia el enlace y envíalo.",
  invite_revoked: "Invitación desactivada. El enlace ya no sirve.",
  registration_deleted: "Inscripción eliminada.",
  account_deleted: "Cuenta eliminada.",
};

export const adminInputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-[#082e39] outline-none sm:text-sm focus:border-[#00a7ad] focus:ring-2 focus:ring-[#00a7ad]/20";

export const adminButtonClass =
  "inline-flex items-center justify-center rounded-xl bg-[#ffbc1f] px-5 py-3 text-sm font-bold text-[#082e39] transition hover:bg-[#ffca44]";
