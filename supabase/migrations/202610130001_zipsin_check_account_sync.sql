create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_state text not null default 'pending' check (onboarding_state in ('pending', 'complete')),
  user_type text check (user_type in ('house_hunter', 'tenant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signup_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('zipsin_check')),
  created_at timestamptz not null default now(),
  unique (user_id, source)
);

create table public.transfer_manifests (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  request_key text not null check (length(request_key) between 8 and 128),
  status text not null default 'prepared' check (status in ('prepared', 'transferring', 'partial', 'complete', 'failed')),
  expected_counts_json jsonb not null default '{}'::jsonb,
  confirmed_counts_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, request_key)
);

create table public.candidate_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  manifest_id uuid references public.transfer_manifests(id) on delete set null,
  local_candidate_id text not null check (length(local_candidate_id) between 1 and 128),
  alias text not null check (length(alias) between 1 and 80),
  listing_json jsonb not null default '{}'::jsonb,
  terms_json jsonb not null default '{}'::jsonb,
  contact_json jsonb not null default '{}'::jsonb,
  commute_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, local_candidate_id)
);

create table public.candidate_answers (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_drafts(id) on delete cascade,
  item_id text not null,
  status text not null check (status in ('confirmed', 'caution', 'unverified', 'expert')),
  source text not null check (source in ('observed', 'explained', 'document', 'expert')),
  memo text check (memo is null or length(memo) <= 120),
  action_checks_json jsonb not null default '{}'::jsonb,
  unique (candidate_id, item_id)
);

create table public.candidate_photos (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_drafts(id) on delete cascade,
  item_id text not null,
  storage_path text not null,
  bytes integer not null check (bytes > 0 and bytes <= 10485760),
  mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  created_at timestamptz not null default now(),
  unique (candidate_id, item_id, storage_path)
);

create table public.transfer_items (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references public.transfer_manifests(id) on delete cascade,
  local_candidate_id text not null,
  item_type text not null check (item_type in ('candidate', 'answer', 'photo')),
  item_key text not null,
  status text not null check (status in ('pending', 'complete', 'failed')),
  error_code text,
  updated_at timestamptz not null default now(),
  unique (manifest_id, item_key)
);

alter table public.profiles enable row level security;
alter table public.signup_attributions enable row level security;
alter table public.transfer_manifests enable row level security;
alter table public.candidate_drafts enable row level security;
alter table public.candidate_answers enable row level security;
alter table public.candidate_photos enable row level security;
alter table public.transfer_items enable row level security;

create policy "profiles_owner_all" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "attributions_owner_all" on public.signup_attributions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "manifests_owner_all" on public.transfer_manifests for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "drafts_owner_all" on public.candidate_drafts for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "answers_owner_all" on public.candidate_answers for all
  using (exists (select 1 from public.candidate_drafts d where d.id = candidate_id and d.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.candidate_drafts d where d.id = candidate_id and d.owner_user_id = auth.uid()));
create policy "photos_owner_all" on public.candidate_photos for all
  using (exists (select 1 from public.candidate_drafts d where d.id = candidate_id and d.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.candidate_drafts d where d.id = candidate_id and d.owner_user_id = auth.uid()));
create policy "transfer_items_owner_all" on public.transfer_items for all
  using (exists (select 1 from public.transfer_manifests m where m.id = manifest_id and m.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.transfer_manifests m where m.id = manifest_id and m.owner_user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('candidate-photos', 'candidate-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "candidate_photos_owner_select" on storage.objects for select
  using (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
create policy "candidate_photos_owner_insert" on storage.objects for insert
  with check (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and array_length(storage.foldername(name),1)=2 and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
create policy "candidate_photos_owner_update" on storage.objects for update
  using (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()))
  with check (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and array_length(storage.foldername(name),1)=2 and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
create policy "candidate_photos_owner_delete" on storage.objects for delete
  using (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
