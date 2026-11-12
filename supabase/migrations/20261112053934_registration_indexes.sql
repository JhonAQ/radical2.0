create index registrations_reviewed_by_idx on public.registrations(reviewed_by);
create index registration_payments_reviewed_by_idx on public.registration_payments(reviewed_by);
create index registration_review_events_actor_idx on public.registration_review_events(actor_id);
create index registration_review_events_payment_idx on public.registration_review_events(payment_id);
drop policy registrations_insert on public.registrations;
create policy registrations_insert on public.registrations for insert to authenticated with check (
 user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and reviewed_by is null and review_note is null
 and lower(email) = lower((select auth.jwt())->>'email')
 and length(trim(first_name)) between 1 and 100 and length(trim(last_name)) between 1 and 100
 and document ~ '^[A-Za-z0-9]{6,12}$' and birth_date < current_date and gender in ('masculino','femenino','otro')
 and length(trim(phone)) between 9 and 25 and length(trim(emergency_phone)) between 9 and 25
 and length(trim(emergency_name)) between 1 and 150 and length(trim(emergency_relation)) between 1 and 50
 and receipt_path like (select auth.uid())::text || '/%'
 and exists (select 1 from storage.objects where bucket_id = 'registration-receipts' and name = receipt_path)
);
