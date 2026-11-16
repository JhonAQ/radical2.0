-- Pagos en efectivo registrados por un admin (verificados en persona).

alter table public.registration_payments
  add column method text not null default 'yape' check (method in ('yape', 'efectivo')),
  alter column receipt_path drop not null,
  add constraint registration_payments_receipt_required check (method = 'efectivo' or receipt_path is not null);

alter table public.registrations
  add column payment_method text not null default 'yape' check (payment_method in ('yape', 'efectivo'));

-- El admin registra efectivo sobre la inscripción:
--  * inscripción aprobada  -> abono adicional aprobado (sin comprobante), hasta el saldo.
--  * pendiente / observada -> el efectivo pasa a ser el pago inicial y la inscripción se aprueba;
--    los reemplazos pendientes se cierran porque ya no hacen falta.
create function private.register_cash_payment(p_registration_id uuid, p_amount integer, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  reg public.registrations%rowtype;
  uid uuid := (select auth.uid());
  paid integer;
  note text := nullif(left(trim(coalesce(p_note, '')), 500), '');
  label text;
  pay_id uuid;
begin
  if not exists (select 1 from public.admin_users where user_id = uid) then raise exception 'Not authorized'; end if;
  select * into reg from public.registrations where id = p_registration_id for update;
  if not found then raise exception 'Registration not found'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid amount'; end if;
  label := 'Pago en efectivo' || coalesce(': ' || note, '');

  if reg.status = 'approved' then
    select reg.amount + coalesce(sum(amount), 0) into paid
      from public.registration_payments
      where registration_id = reg.id and kind = 'additional' and status = 'approved';
    if paid + p_amount > reg.price then raise exception 'Payment exceeds remaining balance'; end if;

    insert into public.registration_payments
      (registration_id, user_id, kind, method, amount, receipt_path, status, review_note, reviewed_at, reviewed_by)
    values (reg.id, reg.user_id, 'additional', 'efectivo', p_amount, null, 'approved', label, now(), uid)
    returning id into pay_id;

    insert into public.registration_review_events
      (registration_id, payment_id, actor_id, old_status, new_status, note, new_amount)
    values (reg.id, pay_id, uid, null, 'approved', label, p_amount);
  else
    if p_amount < 50 or p_amount > reg.price then raise exception 'Invalid initial amount'; end if;

    update public.registration_payments
      set status = 'rejected', review_note = 'Resuelto con pago en efectivo.', reviewed_at = now(), reviewed_by = uid
      where registration_id = reg.id and kind = 'replacement' and status = 'pending';

    -- El trigger de auditoría registra este cambio (estado, monto y nota).
    update public.registrations
      set amount = p_amount,
          payment_type = case when p_amount = reg.price then 'full' else 'reserve' end,
          payment_method = 'efectivo',
          status = 'approved',
          review_note = label,
          reviewed_at = now(),
          reviewed_by = uid,
          updated_at = now()
      where id = reg.id;
  end if;
end; $$;

revoke all on function private.register_cash_payment(uuid, integer, text) from public, anon;
grant execute on function private.register_cash_payment(uuid, integer, text) to authenticated;

create function public.admin_register_cash_payment(p_registration_id uuid, p_amount integer, p_note text default null)
returns void language sql security invoker set search_path = '' as $$
  select private.register_cash_payment(p_registration_id, p_amount, p_note);
$$;

revoke all on function public.admin_register_cash_payment(uuid, integer, text) from public, anon;
grant execute on function public.admin_register_cash_payment(uuid, integer, text) to authenticated;
