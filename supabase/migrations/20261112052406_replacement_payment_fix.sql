create or replace function public.review_registration_payment(p_id uuid, p_status text, p_note text default null) returns void
language plpgsql security invoker set search_path = '' as $$
declare item public.registration_payments%rowtype; reg public.registrations%rowtype; paid integer;
begin
 if not exists (select 1 from public.admin_users where user_id = (select auth.uid())) then raise exception 'Not authorized'; end if;
 if p_status not in ('approved','rejected','pending') then raise exception 'Invalid status'; end if;
 select * into item from public.registration_payments where id = p_id for update;
 if not found then raise exception 'Payment not found'; end if;
 select * into reg from public.registrations where id = item.registration_id for update;
 if p_status = 'approved' and item.kind = 'additional' then
   if reg.status <> 'approved' then raise exception 'Registration is not approved'; end if;
   select reg.amount + coalesce(sum(amount),0) into paid from public.registration_payments where registration_id = reg.id and kind = 'additional' and status = 'approved' and id <> item.id;
   if paid + item.amount > reg.price then raise exception 'Payment exceeds remaining balance'; end if;
 end if;
 if item.kind = 'replacement' and p_status = 'approved' then
   if item.status = 'approved' then return; end if;
   if reg.status <> 'rejected' then raise exception 'Registration is not awaiting a replacement'; end if;
   update public.registrations set status = 'approved', amount = item.amount, payment_type = case when item.amount = reg.price then 'full' else 'reserve' end, receipt_path = item.receipt_path, review_note = nullif(left(trim(p_note),1000),''), reviewed_at = now(), reviewed_by = (select auth.uid()), updated_at = now() where id = reg.id;
 end if;
 if item.kind = 'replacement' and item.status = 'approved' and p_status <> 'approved' then raise exception 'Approved replacement cannot be changed'; end if;
 update public.registration_payments set status = p_status, review_note = nullif(left(trim(p_note),1000),''), reviewed_at = now(), reviewed_by = (select auth.uid()) where id = p_id;
end; $$;
