create extension if not exists pgcrypto;

create table if not exists public.repair_records (
  id uuid primary key default gen_random_uuid(),
  title varchar(80) not null check (char_length(trim(title)) between 2 and 80),
  home_alias varchar(40) not null check (char_length(trim(home_alias)) between 2 and 40),
  category text not null check (category in ('plumbing','electrical','heating','interior','other')),
  status text not null check (status in ('received','in_progress','completed')),
  description text not null check (char_length(trim(description)) between 10 and 1000),
  repair_date date not null,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.repair_records enable row level security;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.repair_records to service_role;
create index if not exists repair_records_updated_at_idx on public.repair_records (updated_at desc);
create index if not exists repair_records_status_updated_at_idx on public.repair_records (status, updated_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists repair_records_set_updated_at on public.repair_records;
create trigger repair_records_set_updated_at before update on public.repair_records for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('repair-images', 'repair-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
