-- La configuración del campamento (fecha de preventa y grupo de WhatsApp) solo la cambia la cuenta maestra.
-- Los admins siguen pudiendo leer el enlace privado del grupo.
drop policy if exists camp_settings_admin_update on public.camp_settings;
create policy camp_settings_admin_update on public.camp_settings
  for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master'))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master'));

drop policy if exists camp_private_settings_admin_update on public.camp_private_settings;
create policy camp_private_settings_admin_update on public.camp_private_settings
  for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master'))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'master'));
