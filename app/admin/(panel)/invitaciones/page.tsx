import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createInvite, revokeInvite } from "../../actions";
import { adminButtonClass, adminInputClass } from "../../types";
import { FlashMessage } from "../../components/FlashMessage";
import { PendingFieldset } from "../../components/PendingFieldset";
import { CopyLinkButton } from "../../components/CopyLinkButton";
import { ConfirmSubmitButton } from "../../components/ConfirmSubmitButton";
import { PageHeader } from "../../components/PageHeader";

export const metadata = { title: "Invitaciones | Radical 2.0" };

const isPast = (iso: string | null) => (iso ? new Date(iso).getTime() <= Date.now() : false);

const dateFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short" });

export default async function InvitacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; nuevo?: string }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: membership } = user
    ? await client.from("admin_users").select("role").eq("user_id", user.id).maybeSingle()
    : { data: null };
  if (membership?.role !== "master") redirect("/admin");

  const head = await headers();
  const host = head.get("x-forwarded-host") || head.get("host") || "radical.ielp.org";
  const proto = head.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const [{ data: invites }, { data: used }] = await Promise.all([
    client
      .from("registration_invites")
      .select("id,token,label,note,plan,amount_per_person,slots,receipt_path,expires_at,revoked_at,created_at")
      .order("created_at", { ascending: false }),
    client.from("registrations").select("id,first_name,last_name,invite_id").not("invite_id", "is", null),
  ]);
  const byInvite = new Map<string, { id: string; name: string }[]>();
  for (const r of used ?? []) {
    const list = byInvite.get(r.invite_id!) ?? [];
    list.push({ id: r.id, name: `${r.first_name} ${r.last_name}` });
    byInvite.set(r.invite_id!, list);
  }
  const receiptUrls = new Map<string, string>();
  await Promise.all(
    (invites ?? []).map(async (i) => {
      const { data } = await client.storage.from("registration-receipts").createSignedUrl(i.receipt_path, 600);
      if (data?.signedUrl) receiptUrls.set(i.id, data.signedUrl);
    }),
  );

  return (
    <div className="max-w-3xl space-y-4 lg:space-y-6">
      <PageHeader
        title="Invitaciones con pago recibido"
        description="Para quien ya pagó por otro medio (por ejemplo, una familia que yapeó a una directora). Cada persona entra con su cuenta de Google desde el enlace, llena sus datos y su inscripción queda aprobada con el abono indicado, sin subir comprobante. Si eliminas una inscripción hecha con el enlace, su cupo vuelve a quedar libre."
        mobileDescription="Para quien ya pagó por otro medio: entra con el enlace, llena sus datos y queda aprobada sin subir comprobante."
      />
      <FlashMessage error={params.error} success={params.success} />

      <form action={createInvite} className="space-y-4 rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
        <PendingFieldset className="contents">
          <h2 className="text-base font-bold text-[#082e39]">Nueva invitación</h2>
          <label className="block text-sm font-semibold text-[#082e39]">
            Nombre del grupo
            <input name="label" required maxLength={100} placeholder="Familia Quispe (3 hermanos)" className={`${adminInputClass} mt-2`} />
          </label>
          <label className="block text-sm font-semibold text-[#082e39]">
            Detalle interno del pago
            <textarea
              name="note"
              required
              maxLength={500}
              rows={2}
              placeholder="La hna. Pilar recibió S/ 150 por Yape el 20/11 y los depositó a la cuenta del campamento."
              className={`${adminInputClass} mt-2`}
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">Solo lo ve el equipo. Queda en la nota y el historial de cada inscripción.</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-[#082e39]">
              Plan
              <select name="plan" defaultValue="preventa" className={`${adminInputClass} mt-2`}>
                <option value="preventa">Preventa (S/ 200)</option>
                <option value="regular">Regular (S/ 250)</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-[#082e39]">
              Abono por persona (S/)
              <input name="amount" type="number" required min={50} max={250} step={1} defaultValue={50} className={`${adminInputClass} mt-2`} />
            </label>
            <label className="block text-sm font-semibold text-[#082e39]">
              Cupos
              <input name="slots" type="number" required min={1} max={20} step={1} defaultValue={3} className={`${adminInputClass} mt-2`} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#082e39]">
              Vence (opcional)
              <input name="expires" type="date" className={`${adminInputClass} mt-2`} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Vale hasta las 12 de la noche de ese día.</span>
            </label>
            <label className="block text-sm font-semibold text-[#082e39]">
              Captura del pago
              <input name="receipt" type="file" required accept="image/jpeg,image/png,image/webp" className={`${adminInputClass} mt-2 py-2`} />
              <span className="mt-1 block text-xs font-normal text-slate-500">JPG, PNG o WebP, hasta 3,5 MB.</span>
            </label>
          </div>
          <button className={adminButtonClass}>Crear enlace</button>
        </PendingFieldset>
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#082e39]">Enlaces creados</h2>
        {(invites ?? []).length === 0 && <p className="text-sm text-slate-500">Aún no hay invitaciones.</p>}
        {(invites ?? []).map((invite) => {
          const people = byInvite.get(invite.id) ?? [];
          const expired = isPast(invite.expires_at);
          const state = invite.revoked_at ? "Desactivado" : expired ? "Vencido" : people.length >= invite.slots ? "Completo" : "Activo";
          const active = state === "Activo";
          const url = `${origin}/invitacion/${invite.token}`;
          return (
            <article
              key={invite.id}
              className={`rounded-xl border bg-white p-5 shadow-sm ${params.nuevo === invite.id ? "border-[#00a7ad] ring-2 ring-[#00a7ad]/20" : "border-[#e2e8e4]"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#082e39]">{invite.label}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {invite.plan === "preventa" ? "Preventa" : "Regular"} · S/ {invite.amount_per_person} por persona · {people.length} de {invite.slots} cupos usados
                    {invite.expires_at && ` · vence el ${dateFmt.format(new Date(invite.expires_at))}`}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                    active ? "bg-emerald-50 text-emerald-800 ring-emerald-200/70" : "bg-slate-100 text-slate-600 ring-slate-200"
                  }`}
                >
                  {state}
                </span>
              </div>
              <p className="mt-3 rounded-lg bg-[#f6f8f5] px-3 py-2 text-xs text-[#36504c]">{invite.note}</p>
              {active && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">{url}</code>
                  <CopyLinkButton url={url} />
                </div>
              )}
              {people.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {people.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/inscripciones/${p.id}`} className="font-semibold text-[#0a5562] hover:underline">
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                {receiptUrls.get(invite.id) && (
                  <a href={receiptUrls.get(invite.id)} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0a5562] hover:underline">
                    Ver captura del pago
                  </a>
                )}
                {!invite.revoked_at && (
                  <form action={revokeInvite}>
                    <input type="hidden" name="id" value={invite.id} />
                    <ConfirmSubmitButton
                      message="¿Desactivar este enlace? Quienes ya se inscribieron siguen inscritos; nadie más podrá usarlo."
                      className="font-bold text-red-700 hover:underline"
                    >
                      Desactivar enlace
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
