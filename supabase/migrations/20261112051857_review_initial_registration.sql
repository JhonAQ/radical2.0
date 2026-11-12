create function public.review_initial_registration(p_id uuid, p_status text, p_note text default null) returns void
language plpgsql security invoker set search_path = '' as $$
declare reg public.registrations%rowtype;
begin
 if not exists (select 1 from public.admin_users where user_id = (select auth.uid())) then raise exception 'Not authorized'; end if;
 if p_status not in ('approved','rejected','pending') then raise exception 'Invalid status'; end if;
 select * into reg from public.registrations where id = p_id for update;
 if not found then raise exception 'Registration not found'; end if;
 if p_status <> 'approved' and exists (select 1 from public.registration_payments where registration_id = p_id and status = 'approved' and kind = 'additional') then raise exception 'Review additional approved payments first'; end if;
 update public.registrations set status = p_status, review_note = nullif(left(trim(p_note),1000),''), reviewed_at = now(), reviewed_by = (select auth.uid()), updated_at = now() where id = p_id;
end; $$;
revoke all on function public.review_initial_registration(uuid,text,text) from public, anon;
grant execute on function public.review_initial_registration(uuid,text,text) to authenticated;
