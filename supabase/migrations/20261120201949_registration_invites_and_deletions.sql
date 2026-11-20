-- Invitaciones de inscripción con pago ya recibido (p. ej. una familia que pagó por adelantado)
-- y borrado de inscripciones por la cuenta maestra.

-- ─── Invitaciones ────────────────────────────────────────────────────────────
-- La cuenta maestra crea un enlace con N cupos, plan y abono por persona, y adjunta el
-- comprobante del pago grupal. Cada persona que lo usa queda inscrita con ese abono ya
-- aprobado. Los cupos usados se cuentan por las inscripciones vigentes que vienen del
-- enlace: si se elimina una, su cupo vuelve a quedar libre.
create table public.registration_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{20,64}$'),
  label text not null check (length(trim(label)) between 1 and 100),
  note text not null check (length(trim(note)) between 1 and 500),
  plan text not null check (plan in ('preventa', 'regular')),
  amount_per_person integer not null check (amount_per_person >= 50),
  slots integer not null check (slots between 1 and 20),
  receipt_path text not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  check (amount_per_person <= case plan when 'preventa' then 200 else 250 end)
);
create index registration_invites_created_by_idx on public.registration_invites(created_by);

alter table public.registration_invites enable row level security;
revoke all on public.registration_invites from public, anon, authenticated;
grant select, insert on public.registration_invites to authenticated;
grant update (revoked_at) on public.registration_invites to authenticated;

create policy registration_invites_master_read on public.registration_invites for select to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master'));
create policy registration_invites_master_insert on public.registration_invites for insert to authenticated
  with check (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master')
    and created_by = (select auth.uid())
    and revoked_at is null
    and receipt_path like (select auth.uid())::text || '/%'
    and exists (select 1 from storage.objects where bucket_id = 'registration-receipts' and name = receipt_path)
  );
create policy registration_invites_master_update on public.registration_invites for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master'))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master'));

alter table public.registrations add column invite_id uuid references public.registration_invites(id);
create index registrations_invite_idx on public.registrations(invite_id) where invite_id is not null;

-- Lo que ve quien abre el enlace (sin la nota interna ni el comprobante).
create function private.registration_invite_info(p_token text)
returns table (plan text, amount_per_person integer, slots_left integer, state text)
language sql stable security definer set search_path = '' as $$
  select i.plan, i.amount_per_person,
    greatest(i.slots - (select count(*) from public.registrations r where r.invite_id = i.id), 0)::integer,
    case
      when i.revoked_at is not null then 'revoked'
      when i.expires_at is not null and i.expires_at <= now() then 'expired'
      when (select count(*) from public.registrations r where r.invite_id = i.id) >= i.slots then 'full'
      else 'open'
    end
  from public.registration_invites i
  where i.token = p_token;
$$;
revoke all on function private.registration_invite_info(text) from public, anon;
grant execute on function private.registration_invite_info(text) to authenticated;

create function public.get_registration_invite(p_token text)
returns table (plan text, amount_per_person integer, slots_left integer, state text)
language sql stable security invoker set search_path = '' as $$
  select * from private.registration_invite_info(p_token);
$$;
revoke all on function public.get_registration_invite(text) from public, anon;
grant execute on function public.get_registration_invite(text) to authenticated;

-- Canje: crea la inscripción ya aprobada con el abono de la invitación.
-- Va por función (no por la política de insert) porque el participante no puede crear
-- una inscripción aprobada, y la preventa pagada se respeta aunque ya haya cerrado.
create function private.redeem_registration_invite(
  p_token text, p_first_name text, p_last_name text, p_document text, p_birth_date date, p_gender text,
  p_phone text, p_emergency_name text, p_emergency_relation text, p_emergency_phone text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  mail text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  inv public.registration_invites%rowtype;
  used integer;
  price integer;
  doc text := regexp_replace(coalesce(p_document, ''), '\s', '', 'g');
  label text;
  new_id uuid;
begin
  if uid is null or mail = '' then raise exception 'Not authenticated'; end if;
  select * into inv from public.registration_invites where token = p_token for update;
  if not found then raise exception 'invite_not_found'; end if;
  if inv.revoked_at is not null or (inv.expires_at is not null and inv.expires_at <= now()) then raise exception 'invite_closed'; end if;
  select count(*) into used from public.registrations where invite_id = inv.id;
  if used >= inv.slots then raise exception 'invite_full'; end if;
  if exists (select 1 from public.registrations where user_id = uid) then raise exception 'already_registered'; end if;

  if length(trim(coalesce(p_first_name, ''))) not between 1 and 100 or length(trim(coalesce(p_last_name, ''))) not between 1 and 100
    or doc !~ '^[A-Za-z0-9]{6,12}$' or p_birth_date is null or p_birth_date >= current_date
    or coalesce(p_gender, '') not in ('masculino', 'femenino', 'otro')
    or length(trim(coalesce(p_phone, ''))) not between 9 and 25 or length(trim(coalesce(p_emergency_phone, ''))) not between 9 and 25
    or length(trim(coalesce(p_emergency_name, ''))) not between 1 and 150 or length(trim(coalesce(p_emergency_relation, ''))) not between 1 and 50
  then raise exception 'invalid_data'; end if;

  price := case inv.plan when 'preventa' then 200 else 250 end;
  label := left('Invitación «' || inv.label || '»: ' || inv.note, 1000);

  insert into public.registrations (
    user_id, first_name, last_name, document, birth_date, gender, phone, email,
    emergency_name, emergency_relation, emergency_phone, plan, price, amount, payment_type,
    receipt_path, status, reviewed_at, reviewed_by, review_note, invite_id
  ) values (
    uid, trim(p_first_name), trim(p_last_name), doc, p_birth_date, p_gender, trim(p_phone), mail,
    trim(p_emergency_name), trim(p_emergency_relation), trim(p_emergency_phone), inv.plan, price, inv.amount_per_person,
    case when inv.amount_per_person = price then 'full' else 'reserve' end,
    inv.receipt_path, 'approved', now(), inv.created_by, label, inv.id
  ) returning id into new_id;

  insert into public.registration_review_events (registration_id, actor_id, old_status, new_status, note, new_amount, new_receipt_path)
  values (new_id, inv.created_by, null, 'approved', label, inv.amount_per_person, inv.receipt_path);
  return new_id;
end; $$;
revoke all on function private.redeem_registration_invite(text, text, text, text, date, text, text, text, text, text) from public, anon;
grant execute on function private.redeem_registration_invite(text, text, text, text, date, text, text, text, text, text) to authenticated;

create function public.redeem_registration_invite(
  p_token text, p_first_name text, p_last_name text, p_document text, p_birth_date date, p_gender text,
  p_phone text, p_emergency_name text, p_emergency_relation text, p_emergency_phone text
) returns uuid language sql security invoker set search_path = '' as $$
  select private.redeem_registration_invite(p_token, p_first_name, p_last_name, p_document, p_birth_date, p_gender,
    p_phone, p_emergency_name, p_emergency_relation, p_emergency_phone);
$$;
revoke all on function public.redeem_registration_invite(text, text, text, text, date, text, text, text, text, text) from public, anon;
grant execute on function public.redeem_registration_invite(text, text, text, text, date, text, text, text, text, text) to authenticated;

-- ─── Borrado de inscripciones (solo cuenta maestra) ───────────────────────────
-- Antes de borrar se guarda una copia (inscripción, abonos e historial) por si hace falta
-- consultar qué se eliminó. Abonos, historial e ingresos se borran en cascada.
create table public.registration_deletions (
  id bigint generated always as identity primary key,
  registration_id uuid not null,
  user_id uuid,
  full_name text not null,
  document text not null,
  email text not null,
  snapshot jsonb not null,
  deleted_by uuid references auth.users(id),
  deleted_at timestamptz not null default now()
);
create index registration_deletions_deleted_by_idx on public.registration_deletions(deleted_by);
alter table public.registration_deletions enable row level security;
revoke all on public.registration_deletions from public, anon, authenticated;
grant select on public.registration_deletions to authenticated;
create policy registration_deletions_master_read on public.registration_deletions for select to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master'));

-- Devuelve las rutas de comprobantes que dejó de usar alguien, para borrarlas del almacenamiento.
create function private.delete_registration(p_id uuid)
returns text[] language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  reg public.registrations%rowtype;
  paths text[];
begin
  if not exists (select 1 from public.admin_users where user_id = uid and role = 'master') then raise exception 'Not authorized'; end if;
  select * into reg from public.registrations where id = p_id for update;
  if not found then raise exception 'Registration not found'; end if;

  insert into public.registration_deletions (registration_id, user_id, full_name, document, email, snapshot, deleted_by)
  values (reg.id, reg.user_id, reg.first_name || ' ' || reg.last_name, reg.document, reg.email,
    jsonb_build_object(
      'registration', to_jsonb(reg),
      'payments', coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at) from public.registration_payments p where p.registration_id = reg.id), '[]'::jsonb),
      'events', coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at) from public.registration_review_events e where e.registration_id = reg.id), '[]'::jsonb)
    ), uid);

  select array_agg(distinct x) into paths from (
    select reg.receipt_path as x union select reg.original_receipt_path
    union select p.receipt_path from public.registration_payments p where p.registration_id = reg.id
  ) s where x is not null;

  delete from public.registrations where id = reg.id;

  -- Solo se devuelven archivos que ya nadie usa (el comprobante de una invitación lo comparten varios).
  return coalesce((
    select array_agg(x) from unnest(paths) x
    where not exists (select 1 from public.registrations r where r.receipt_path = x or r.original_receipt_path = x)
      and not exists (select 1 from public.registration_payments p where p.receipt_path = x)
      and not exists (select 1 from public.registration_invites i where i.receipt_path = x)
  ), '{}');
end; $$;
revoke all on function private.delete_registration(uuid) from public, anon;
grant execute on function private.delete_registration(uuid) to authenticated;

create function public.admin_delete_registration(p_id uuid)
returns text[] language sql security invoker set search_path = '' as $$
  select private.delete_registration(p_id);
$$;
revoke all on function public.admin_delete_registration(uuid) from public, anon;
grant execute on function public.admin_delete_registration(uuid) to authenticated;
