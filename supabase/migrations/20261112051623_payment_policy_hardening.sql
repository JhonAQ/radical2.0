drop policy payment_insert on public.registration_payments;
create policy payment_insert on public.registration_payments for insert to authenticated with check (
 user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and reviewed_by is null and review_note is null
 and receipt_path like (select auth.uid())::text || '/%'
 and exists (select 1 from storage.objects where bucket_id = 'registration-receipts' and name = registration_payments.receipt_path)
 and exists (select 1 from public.registrations r where r.id = registration_payments.registration_id and r.user_id = (select auth.uid()) and
 ((r.status = 'approved' and registration_payments.kind = 'additional' and registration_payments.amount <= r.price) or
 (r.status = 'rejected' and registration_payments.kind = 'replacement' and registration_payments.amount between 50 and r.price)))
);
drop policy receipt_delete_own on storage.objects;
create policy receipt_delete_own on storage.objects for delete to authenticated using (
 bucket_id = 'registration-receipts' and (storage.foldername(name))[1] = (select auth.uid())::text
 and not exists (select 1 from public.registrations r where r.user_id = (select auth.uid()) and r.receipt_path = objects.name)
 and not exists (select 1 from public.registration_payments p where p.user_id = (select auth.uid()) and p.receipt_path = objects.name)
);
