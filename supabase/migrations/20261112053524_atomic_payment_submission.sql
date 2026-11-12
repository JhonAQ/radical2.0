revoke insert on public.registration_payments from authenticated, anon;
drop policy payment_insert on public.registration_payments;
grant usage on schema private to authenticated;
create function private.submit_registration_payment(p_registration_id uuid, p_kind text, p_amount integer, p_receipt_path text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare reg public.registrations%rowtype; paid integer; new_id uuid; uid uuid := (select auth.uid());
begin
 if uid is null then raise exception 'Not authorized'; end if;
 select * into reg from public.registrations where id = p_registration_id and user_id = uid for update;
 if not found then raise exception 'Registration not found'; end if;
 if p_receipt_path not like uid::text || '/%' or not exists (select 1 from storage.objects where bucket_id = 'registration-receipts' and name = p_receipt_path) then raise exception 'Receipt not found'; end if;
 if p_kind = 'additional' then
   if reg.status <> 'approved' or p_amount < 1 then raise exception 'Invalid payment'; end if;
   select reg.amount + coalesce(sum(amount),0) into paid from public.registration_payments where registration_id = reg.id and kind = 'additional' and status in ('approved','pending');
   if paid + p_amount > reg.price then raise exception 'Payment exceeds remaining balance'; end if;
 elsif p_kind = 'replacement' then
   if reg.status <> 'rejected' or p_amount < 50 or p_amount > reg.price or exists (select 1 from public.registration_payments where registration_id = reg.id and kind = 'replacement' and status = 'pending') then raise exception 'Invalid replacement'; end if;
 else raise exception 'Invalid payment type';
 end if;
 insert into public.registration_payments(registration_id,user_id,kind,amount,receipt_path) values (reg.id,uid,p_kind,p_amount,p_receipt_path) returning id into new_id;
 return new_id;
end; $$;
revoke all on function private.submit_registration_payment(uuid,text,integer,text) from public, anon;
grant execute on function private.submit_registration_payment(uuid,text,integer,text) to authenticated;
create function public.submit_registration_payment(p_registration_id uuid, p_kind text, p_amount integer, p_receipt_path text) returns uuid
language sql security invoker set search_path = '' as $$
 select private.submit_registration_payment(p_registration_id,p_kind,p_amount,p_receipt_path);
$$;
revoke all on function public.submit_registration_payment(uuid,text,integer,text) from public, anon;
grant execute on function public.submit_registration_payment(uuid,text,integer,text) to authenticated;
