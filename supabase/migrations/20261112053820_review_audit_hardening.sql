revoke update on public.registrations, public.registration_payments from authenticated;
grant update(status,review_note,reviewed_at,reviewed_by,updated_at,amount,payment_type,receipt_path) on public.registrations to authenticated;
grant update(status,review_note,reviewed_at,reviewed_by) on public.registration_payments to authenticated;
alter table public.registration_review_events add column old_amount integer, add column new_amount integer, add column old_receipt_path text, add column new_receipt_path text;
create or replace function private.record_registration_review() returns trigger language plpgsql security definer set search_path = '' as $$
declare rid uuid; pid uuid;
begin
 if new.reviewed_at is not distinct from old.reviewed_at and new.status is not distinct from old.status and new.amount is not distinct from old.amount and new.receipt_path is not distinct from old.receipt_path and new.review_note is not distinct from old.review_note then return new; end if;
 if (select auth.uid()) is null then return new; end if;
 if tg_table_name = 'registrations' then rid := new.id; pid := null; else rid := new.registration_id; pid := new.id; end if;
 insert into public.registration_review_events(registration_id,payment_id,actor_id,old_status,new_status,note,old_amount,new_amount,old_receipt_path,new_receipt_path) values (rid,pid,(select auth.uid()),old.status,new.status,new.review_note,old.amount,new.amount,old.receipt_path,new.receipt_path);
 return new;
end; $$;
