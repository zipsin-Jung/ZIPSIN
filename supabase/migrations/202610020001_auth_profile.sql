create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  phone_e164 text,
  phone_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consent_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in (
    'terms', 'privacy', 'age_over_14', 'marketing_sms', 'marketing_email'
  )),
  document_version text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, document_type, document_version)
);

create table public.phone_verification_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  verified_at timestamptz not null default now(),
  provider_reference_hash text
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  primary_role text not null check (primary_role in (
    'principal_broker', 'assistant', 'landlord', 'tenant'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.consent_acceptances enable row level security;
alter table public.phone_verification_states enable row level security;
alter table public.user_roles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "consents_select_own" on public.consent_acceptances
  for select using ((select auth.uid()) = user_id);
create policy "consents_insert_own" on public.consent_acceptances
  for insert with check ((select auth.uid()) = user_id);
create policy "consents_update_own" on public.consent_acceptances
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "phone_state_select_own" on public.phone_verification_states
  for select using ((select auth.uid()) = user_id);

create policy "roles_select_own" on public.user_roles
  for select using ((select auth.uid()) = user_id);
create policy "roles_insert_own" on public.user_roles
  for insert with check ((select auth.uid()) = user_id);
create policy "roles_update_own" on public.user_roles
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.phone_verification_states from anon, authenticated;
grant select on public.phone_verification_states to authenticated;
