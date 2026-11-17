-- Entrada virtual: código único por inscripción (va en el QR) y registro de ingresos.

-- 12 caracteres de un alfabeto sin ambiguos (sin 0/O, 1/I/L): ~59 bits de azar.
-- Se muestra como XXXX-XXXX-XXXX; se guarda sin guiones.
create function private.generate_ticket_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  bytes bytea;
  code text;
begin
  loop
    bytes := uuid_send(gen_random_uuid());
    code := '';
    for i in 0..11 loop
      code := code || substr(alphabet, (get_byte(bytes, i) % 31) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.registrations where ticket_code = code);
  end loop;
  return code;
end; $$;

revoke all on function private.generate_ticket_code() from public, anon, authenticated;

alter table public.registrations add column ticket_code text;
update public.registrations set ticket_code = private.generate_ticket_code() where ticket_code is null;
alter table public.registrations
  alter column ticket_code set not null,
  add constraint registrations_ticket_code_format check (ticket_code ~ '^[2-9A-HJKMNP-Z]{12}$'),
  add constraint registrations_ticket_code_key unique (ticket_code);

-- El código siempre lo pone la base: se ignora cualquier valor enviado al insertar.
-- (La columna no está en los grants de update, así que el participante no puede cambiarlo.)
create function private.assign_ticket_code()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.ticket_code := private.generate_ticket_code();
  return new;
end; $$;

revoke all on function private.assign_ticket_code() from public, anon, authenticated;

create trigger registrations_assign_ticket_code
  before insert on public.registrations
  for each row execute function private.assign_ticket_code();

-- Si una entrada se filtra, un admin genera un código nuevo y el anterior deja de servir.
create function private.regenerate_ticket_code(p_registration_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare code text;
begin
  if not exists (select 1 from public.admin_users where user_id = (select auth.uid())) then raise exception 'Not authorized'; end if;
  code := private.generate_ticket_code();
  update public.registrations set ticket_code = code, updated_at = now() where id = p_registration_id;
  if not found then raise exception 'Registration not found'; end if;
  return code;
end; $$;

revoke all on function private.regenerate_ticket_code(uuid) from public, anon;
grant execute on function private.regenerate_ticket_code(uuid) to authenticated;

create function public.admin_regenerate_ticket_code(p_registration_id uuid)
returns text language sql security invoker set search_path = '' as $$
  select private.regenerate_ticket_code(p_registration_id);
$$;

revoke all on function public.admin_regenerate_ticket_code(uuid) from public, anon;
grant execute on function public.admin_regenerate_ticket_code(uuid) to authenticated;

-- Registro de ingresos (y en el futuro: bus, comidas, actividades).
create table public.registration_check_ins (
  id bigint generated always as identity primary key,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  kind text not null default 'ingreso' check (kind in ('ingreso')),
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id),
  note text check (note is null or length(note) <= 300)
);

create index registration_check_ins_registration_idx on public.registration_check_ins(registration_id, created_at desc);
create index registration_check_ins_kind_idx on public.registration_check_ins(kind, created_at desc);

alter table public.registration_check_ins enable row level security;
revoke all on public.registration_check_ins from public, anon, authenticated;
grant select on public.registration_check_ins to authenticated;

create policy check_ins_admin_read on public.registration_check_ins for select to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

-- Solo se escribe por esta función: el actor y la hora los pone la base.
-- No bloquea por saldo ni por estado: la app avisa y el admin decide.
create function private.check_in_registration(p_registration_id uuid, p_kind text default 'ingreso', p_note text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  new_id bigint;
begin
  if not exists (select 1 from public.admin_users where user_id = uid) then raise exception 'Not authorized'; end if;
  if not exists (select 1 from public.registrations where id = p_registration_id) then raise exception 'Registration not found'; end if;
  insert into public.registration_check_ins (registration_id, kind, actor_id, note)
  values (p_registration_id, coalesce(p_kind, 'ingreso'), uid, nullif(left(trim(coalesce(p_note, '')), 300), ''))
  returning id into new_id;
  return new_id;
end; $$;

revoke all on function private.check_in_registration(uuid, text, text) from public, anon;
grant execute on function private.check_in_registration(uuid, text, text) to authenticated;

create function public.admin_check_in_registration(p_registration_id uuid, p_kind text default 'ingreso', p_note text default null)
returns bigint language sql security invoker set search_path = '' as $$
  select private.check_in_registration(p_registration_id, p_kind, p_note);
$$;

revoke all on function public.admin_check_in_registration(uuid, text, text) from public, anon;
grant execute on function public.admin_check_in_registration(uuid, text, text) to authenticated;
