-- Enlace del grupo de WhatsApp de campistas.
-- No va en camp_settings porque esa tabla es legible por anon: el enlace solo debe verlo
-- quien está inscrito (el grupo incluye menores). Admins lo leen y editan; los campistas
-- lo obtienen con get_camp_whatsapp_group().

create table public.camp_private_settings (
  id boolean primary key default true check (id),
  whatsapp_group_url text check (whatsapp_group_url is null or whatsapp_group_url ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9_-]+$'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
-- Placeholder hasta que el equipo cree el grupo; se cambia desde /admin/configuracion.
insert into public.camp_private_settings (whatsapp_group_url) values ('https://chat.whatsapp.com/RadicalCampPlaceholder');
create index camp_private_settings_updated_by_idx on public.camp_private_settings(updated_by);

alter table public.camp_private_settings enable row level security;
revoke all on public.camp_private_settings from public, anon, authenticated;
grant select on public.camp_private_settings to authenticated;
grant update (whatsapp_group_url, updated_at, updated_by) on public.camp_private_settings to authenticated;

create policy camp_private_settings_admin_read on public.camp_private_settings for select to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create policy camp_private_settings_admin_update on public.camp_private_settings for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

-- Campistas con inscripción en revisión o aprobada (no observada) reciben el enlace.
create function private.camp_whatsapp_group()
returns text language sql stable security definer set search_path = '' as $$
  select s.whatsapp_group_url
  from public.camp_private_settings s
  where s.id
    and exists (
      select 1 from public.registrations r
      where r.user_id = (select auth.uid()) and r.status in ('pending', 'approved')
    );
$$;

revoke all on function private.camp_whatsapp_group() from public, anon;
grant execute on function private.camp_whatsapp_group() to authenticated;

create function public.get_camp_whatsapp_group()
returns text language sql stable security invoker set search_path = '' as $$
  select private.camp_whatsapp_group();
$$;

revoke all on function public.get_camp_whatsapp_group() from public, anon;
grant execute on function public.get_camp_whatsapp_group() to authenticated;
