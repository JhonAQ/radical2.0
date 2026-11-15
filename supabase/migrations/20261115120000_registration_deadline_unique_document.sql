-- Un documento solo puede inscribirse una vez (evita doble inscripción con dos cuentas).
create unique index registrations_document_unique_idx on public.registrations (lower(document));

-- Configuración editable desde el panel admin (fila única).
create table public.camp_settings (
  id boolean primary key default true check (id),
  preventa_deadline timestamptz not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.camp_settings (preventa_deadline) values (timestamptz '2026-12-16 00:00:00-05');
create index camp_settings_updated_by_idx on public.camp_settings(updated_by);
alter table public.camp_settings enable row level security;
revoke all on public.camp_settings from public, anon, authenticated;
grant select on public.camp_settings to anon, authenticated;
grant update (preventa_deadline, updated_at, updated_by) on public.camp_settings to authenticated;
create policy camp_settings_read on public.camp_settings for select to anon, authenticated using (true);
create policy camp_settings_admin_update on public.camp_settings for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

-- La preventa solo se acepta antes del corte configurado.
drop policy registrations_insert on public.registrations;
create policy registrations_insert on public.registrations for insert to authenticated with check (
 user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and reviewed_by is null and review_note is null
 and (plan <> 'preventa' or now() < (select preventa_deadline from public.camp_settings))
 and lower(email) = lower((select auth.jwt())->>'email')
 and length(trim(first_name)) between 1 and 100 and length(trim(last_name)) between 1 and 100
 and document ~ '^[A-Za-z0-9]{6,12}$' and birth_date < current_date and gender in ('masculino','femenino','otro')
 and length(trim(phone)) between 9 and 25 and length(trim(emergency_phone)) between 9 and 25
 and length(trim(emergency_name)) between 1 and 150 and length(trim(emergency_relation)) between 1 and 50
 and receipt_path like (select auth.uid())::text || '/%'
 and exists (select 1 from storage.objects where bucket_id = 'registration-receipts' and name = receipt_path)
);

-- Edición de datos personales. El participante no puede cambiar documento ni correo; el admin sí.
create function private.update_registration_data(
  p_id uuid, p_as_admin boolean, p_first_name text, p_last_name text, p_birth_date date, p_gender text,
  p_phone text, p_emergency_name text, p_emergency_relation text, p_emergency_phone text,
  p_document text default null, p_email text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare reg public.registrations%rowtype; uid uuid := (select auth.uid()); who text;
begin
 if uid is null then raise exception 'Not authorized'; end if;
 if p_as_admin then
   if not exists (select 1 from public.admin_users where user_id = uid) then raise exception 'Not authorized'; end if;
   select * into reg from public.registrations where id = p_id for update;
   who := 'administración';
 else
   select * into reg from public.registrations where id = p_id and user_id = uid for update;
   who := 'el participante';
 end if;
 if not found then raise exception 'Registration not found'; end if;
 if length(trim(p_first_name)) not between 1 and 100 or length(trim(p_last_name)) not between 1 and 100
   or p_birth_date >= current_date or p_gender not in ('masculino','femenino','otro')
   or length(trim(p_phone)) not between 9 and 25 or length(trim(p_emergency_phone)) not between 9 and 25
   or length(trim(p_emergency_name)) not between 1 and 150 or length(trim(p_emergency_relation)) not between 1 and 50
 then raise exception 'Invalid data'; end if;
 if p_as_admin then
   if p_document is null or p_document !~ '^[A-Za-z0-9]{6,12}$' then raise exception 'Invalid document'; end if;
   if p_email is null or p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Invalid email'; end if;
 end if;
 update public.registrations set
   first_name = trim(p_first_name), last_name = trim(p_last_name), birth_date = p_birth_date, gender = p_gender,
   phone = trim(p_phone), emergency_name = trim(p_emergency_name), emergency_relation = trim(p_emergency_relation),
   emergency_phone = trim(p_emergency_phone),
   document = case when p_as_admin then p_document else document end,
   email = case when p_as_admin then trim(p_email) else email end,
   updated_at = now()
 where id = reg.id;
 insert into public.registration_review_events(registration_id, actor_id, old_status, new_status, note)
 values (reg.id, uid, reg.status, reg.status, 'Datos personales editados por ' || who);
end; $$;
revoke all on function private.update_registration_data(uuid,boolean,text,text,date,text,text,text,text,text,text,text) from public, anon;
grant execute on function private.update_registration_data(uuid,boolean,text,text,date,text,text,text,text,text,text,text) to authenticated;

create function public.update_my_registration(
  p_id uuid, p_first_name text, p_last_name text, p_birth_date date, p_gender text,
  p_phone text, p_emergency_name text, p_emergency_relation text, p_emergency_phone text
) returns void language sql security invoker set search_path = '' as $$
 select private.update_registration_data(p_id, false, p_first_name, p_last_name, p_birth_date, p_gender, p_phone, p_emergency_name, p_emergency_relation, p_emergency_phone);
$$;
revoke all on function public.update_my_registration(uuid,text,text,date,text,text,text,text,text) from public, anon;
grant execute on function public.update_my_registration(uuid,text,text,date,text,text,text,text,text) to authenticated;

create function public.admin_update_registration(
  p_id uuid, p_first_name text, p_last_name text, p_document text, p_email text, p_birth_date date, p_gender text,
  p_phone text, p_emergency_name text, p_emergency_relation text, p_emergency_phone text
) returns void language sql security invoker set search_path = '' as $$
 select private.update_registration_data(p_id, true, p_first_name, p_last_name, p_birth_date, p_gender, p_phone, p_emergency_name, p_emergency_relation, p_emergency_phone, p_document, p_email);
$$;
revoke all on function public.admin_update_registration(uuid,text,text,text,text,date,text,text,text,text,text) from public, anon;
grant execute on function public.admin_update_registration(uuid,text,text,text,text,date,text,text,text,text,text) to authenticated;
