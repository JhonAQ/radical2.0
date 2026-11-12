create table public.registration_payments (
 id uuid primary key default gen_random_uuid(), registration_id uuid not null references public.registrations(id) on delete cascade,
 user_id uuid not null references auth.users(id), created_at timestamptz not null default now(),
 kind text not null check (kind in ('additional','replacement')), amount integer not null check (amount > 0 and amount <= 250),
 receipt_path text not null, status text not null default 'pending' check (status in ('pending','approved','rejected')),
 reviewed_at timestamptz, reviewed_by uuid references auth.users(id), review_note text
);
create index registration_payments_registration_idx on public.registration_payments(registration_id, created_at desc);
create index registration_payments_user_idx on public.registration_payments(user_id);
alter table public.registration_payments enable row level security;
grant select, insert, update on public.registration_payments to authenticated;
create policy payment_select on public.registration_payments for select to authenticated using (user_id = (select auth.uid()) or exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create policy payment_insert on public.registration_payments for insert to authenticated with check (
 user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and reviewed_by is null and review_note is null
 and receipt_path like (select auth.uid())::text || '/%'
 and exists (select 1 from storage.objects where bucket_id = 'registration-receipts' and name = receipt_path)
 and exists (select 1 from public.registrations r where r.id = registration_id and r.user_id = (select auth.uid()) and ((r.status = 'approved' and kind = 'additional' and amount <= r.price) or (r.status = 'rejected' and kind = 'replacement' and amount between 50 and r.price)))
);
create policy payment_admin_update on public.registration_payments for update to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create function public.review_registration_payment(p_id uuid, p_status text, p_note text default null) returns void
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
   if reg.status <> 'rejected' then raise exception 'Registration is not awaiting a replacement'; end if;
   update public.registrations set status = 'approved', amount = item.amount, receipt_path = item.receipt_path, reviewed_at = now(), reviewed_by = (select auth.uid()), updated_at = now() where id = reg.id;
 end if;
 if item.kind = 'replacement' and item.status = 'approved' and p_status <> 'approved' then raise exception 'Approved replacement cannot be changed'; end if;
 update public.registration_payments set status = p_status, review_note = nullif(left(trim(p_note),1000),''), reviewed_at = now(), reviewed_by = (select auth.uid()) where id = p_id;
end; $$;
revoke all on function public.review_registration_payment(uuid,text,text) from public, anon;
grant execute on function public.review_registration_payment(uuid,text,text) to authenticated;
