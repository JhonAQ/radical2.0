alter table public.registrations add column original_receipt_path text;
update public.registrations set original_receipt_path = receipt_path where original_receipt_path is null;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.preserve_original_receipt() returns trigger language plpgsql set search_path = '' as $$
begin
 if tg_op = 'INSERT' then new.original_receipt_path := new.receipt_path;
 else new.original_receipt_path := old.original_receipt_path; end if;
 return new;
end; $$;
revoke all on function private.preserve_original_receipt() from public, anon, authenticated;
create trigger preserve_original_receipt before insert or update on public.registrations for each row execute function private.preserve_original_receipt();
drop policy receipt_delete_own on storage.objects;
create policy receipt_delete_own on storage.objects for delete to authenticated using (
 bucket_id = 'registration-receipts' and (storage.foldername(name))[1] = (select auth.uid())::text
 and not exists (select 1 from public.registrations r where r.user_id = (select auth.uid()) and (r.receipt_path = objects.name or r.original_receipt_path = objects.name))
 and not exists (select 1 from public.registration_payments p where p.user_id = (select auth.uid()) and p.receipt_path = objects.name)
);
create table public.registration_review_events (
 id bigint generated always as identity primary key, registration_id uuid not null references public.registrations(id) on delete cascade,
 payment_id uuid references public.registration_payments(id) on delete cascade, actor_id uuid references auth.users(id),
 created_at timestamptz not null default now(), old_status text, new_status text not null, note text
);
create index registration_review_events_registration_idx on public.registration_review_events(registration_id, created_at desc);
alter table public.registration_review_events enable row level security;
grant select on public.registration_review_events to authenticated;
create policy review_events_admin_read on public.registration_review_events for select to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create function private.record_registration_review() returns trigger language plpgsql security definer set search_path = '' as $$
declare rid uuid; pid uuid;
begin
 if new.reviewed_at is not distinct from old.reviewed_at then return new; end if;
 if (select auth.uid()) is null then return new; end if;
 if tg_table_name = 'registrations' then rid := new.id; pid := null; else rid := new.registration_id; pid := new.id; end if;
 insert into public.registration_review_events(registration_id,payment_id,actor_id,old_status,new_status,note) values (rid,pid,(select auth.uid()),old.status,new.status,new.review_note);
 return new;
end; $$;
revoke all on function private.record_registration_review() from public, anon, authenticated;
create trigger registrations_review_audit after update on public.registrations for each row execute function private.record_registration_review();
create trigger payments_review_audit after update on public.registration_payments for each row execute function private.record_registration_review();
