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

alter table drivers enable row level security;
alter table vehicles enable row level security;

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
