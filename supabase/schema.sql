-- ============================================================
-- LogicMoov Taxi — Fleet & Drivers schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists drivers (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  full_name         text not null,
  whatsapp_number   text not null,
  email             text,
  license_number    text,
  license_expiry    date,
  languages         text[] default '{}',
  photo_url         text,
  status            text not null default 'pending' check (status in ('pending', 'enabled', 'suspended'))
);

create table if not exists vehicles (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  driver_id          uuid references drivers(id) on delete set null,
  plate_number       text not null,
  vehicle_type       text not null,
  brand              text not null,
  model              text not null,
  year               int,
  color              text,
  seat_capacity      int not null,
  luggage_capacity   int,
  electric           boolean not null default false,
  inclusions         text[] not null default '{}',
  photo_urls         text[] default '{}'
);

insert into storage.buckets (id, name, public)
values ('fleet-photos', 'fleet-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('driver-compliance', 'driver-compliance', false)
on conflict (id) do nothing;

alter table drivers enable row level security;
alter table vehicles enable row level security;

create table if not exists driver_compliance_documents (
  id uuid primary key default gen_random_uuid(),
  driver_email text not null,
  document_type text not null check (document_type in ('transport_licence', 'fleet_insurance', 'taxi_registration', 'mechanical_inspection')),
  document_number text,
  issue_date date,
  expiry_date date,
  status text not null default 'missing' check (status in ('missing', 'pending', 'approved', 'rejected', 'expired')),
  file_name text,
  mime_type text,
  file_path text,
  public_url text,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewer_id text,
  rejection_reason text,
  replacement_of uuid,
  unique (driver_email, document_type)
);

create table if not exists driver_compliance_audit_log (
  id uuid primary key default gen_random_uuid(),
  driver_email text not null,
  document_type text,
  action text not null check (action in ('upload', 'replace', 'approve', 'reject', 'status_changed')),
  actor text not null check (actor in ('driver', 'admin')),
  details text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table driver_compliance_documents enable row level security;
alter table driver_compliance_audit_log enable row level security;

create policy "Drivers can read their own compliance records"
  on driver_compliance_documents for select
  using (driver_email = lower(current_setting('request.jwt.claims', true)::json->>'email'));

create policy "Drivers can insert their own compliance records"
  on driver_compliance_documents for insert
  with check (
    driver_email = lower(current_setting('request.jwt.claims', true)::json->>'email')
  );

create policy "Drivers can update their own compliance records"
  on driver_compliance_documents for update
  using (driver_email = lower(current_setting('request.jwt.claims', true)::json->>'email'))
  with check (driver_email = lower(current_setting('request.jwt.claims', true)::json->>'email'));

create policy "Admins can read all compliance records"
  on driver_compliance_documents for select
  using (coalesce((current_setting('request.jwt.claims', true)::json->>'role'), '') = 'admin');

create policy "Admins can update all compliance records"
  on driver_compliance_documents for update
  using (coalesce((current_setting('request.jwt.claims', true)::json->>'role'), '') = 'admin')
  with check (coalesce((current_setting('request.jwt.claims', true)::json->>'role'), '') = 'admin');

create policy "Drivers can read their own audit entries"
  on driver_compliance_audit_log for select
  using (driver_email = lower(current_setting('request.jwt.claims', true)::json->>'email'));

create policy "Admins can read all audit entries"
  on driver_compliance_audit_log for select
  using (coalesce((current_setting('request.jwt.claims', true)::json->>'role'), '') = 'admin');

create policy "System can insert audit entries"
  on driver_compliance_audit_log for insert
  with check (true);

create policy "Public can insert drivers"
  on drivers for insert
  with check (true);

create policy "Public can update drivers"
  on drivers for update
  using (true)
  with check (true);

create policy "Public can insert vehicles"
  on vehicles for insert
  with check (true);

create policy "Public can read drivers"
  on drivers for select
  using (true);

create policy "Public can read vehicles"
  on vehicles for select
  using (true);

create policy "Public can upload fleet photos"
  on storage.objects for insert
  with check (bucket_id = 'fleet-photos');

create policy "Public can read fleet photos"
  on storage.objects for select
  using (bucket_id = 'fleet-photos');

create policy "Authenticated drivers can upload compliance files"
  on storage.objects for insert
  with check (bucket_id = 'driver-compliance');

create policy "Authenticated drivers can read their own compliance files"
  on storage.objects for select
  using (bucket_id = 'driver-compliance');

create policy "Admins can manage compliance files"
  on storage.objects for update
  using (bucket_id = 'driver-compliance')
  with check (bucket_id = 'driver-compliance');
