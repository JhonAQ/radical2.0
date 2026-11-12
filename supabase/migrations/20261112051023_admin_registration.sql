create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('master', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
grant select on public.admin_users to authenticated;
create policy admin_users_read_own on public.admin_users for select to authenticated using (user_id = (select auth.uid()));

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null, last_name text not null, document text not null,
  birth_date date not null, gender text not null,
  phone text not null, email text not null, emergency_name text not null,
  emergency_relation text not null, emergency_phone text not null,
  plan text not null check (plan in ('preventa', 'regular')),
  price integer not null check (price in (200, 250)),
  amount integer not null check (amount >= 50 and amount <= price),
  payment_type text not null check (payment_type in ('reserve','full')),
  receipt_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz, reviewed_by uuid references auth.users(id), review_note text,
  check ((plan = 'preventa' and price = 200) or (plan = 'regular' and price = 250)),
  check (payment_type <> 'full' or amount = price)
);
create index registrations_status_created_idx on public.registrations(status, created_at desc);
alter table public.registrations enable row level security;
grant select, insert, update on public.registrations to authenticated;
create policy registrations_select on public.registrations for select to authenticated using (user_id = (select auth.uid()) or exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create policy registrations_insert on public.registrations for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and reviewed_by is null and review_note is null and receipt_path like (select auth.uid())::text || '/%');
create policy registrations_admin_update on public.registrations for update to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('registration-receipts', 'registration-receipts', false, 10485760, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy receipt_insert on storage.objects for insert to authenticated with check (bucket_id = 'registration-receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy receipt_read on storage.objects for select to authenticated using (bucket_id = 'registration-receipts' and ((storage.foldername(name))[1] = (select auth.uid())::text or exists (select 1 from public.admin_users where user_id = (select auth.uid()))));
create policy receipt_delete_own on storage.objects for delete to authenticated using (bucket_id = 'registration-receipts' and (storage.foldername(name))[1] = (select auth.uid())::text and not exists (select 1 from public.registrations where user_id = (select auth.uid()) and receipt_path = name));
