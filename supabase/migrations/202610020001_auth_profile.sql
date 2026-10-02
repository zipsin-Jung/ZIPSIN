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
  challenge_id text not null,
  phone_e164 text not null,
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
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

create policy "consents_select_own" on public.consent_acceptances
  for select using ((select auth.uid()) = user_id);

create policy "phone_state_select_own" on public.phone_verification_states
  for select using ((select auth.uid()) = user_id);

create policy "roles_select_own" on public.user_roles
  for select using ((select auth.uid()) = user_id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.consent_acceptances from anon, authenticated;
revoke all on public.phone_verification_states from anon, authenticated;
revoke all on public.user_roles from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.consent_acceptances to authenticated;
grant select on public.phone_verification_states to authenticated;
grant select on public.user_roles to authenticated;

create or replace function public.complete_signup(
  p_display_name text,
  p_email text,
  p_challenge_id text,
  p_terms_version text,
  p_privacy_version text,
  p_marketing_sms boolean,
  p_marketing_email boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  verified public.phone_verification_states%rowtype;
begin
  if p_terms_version <> '2026-10-02' or p_privacy_version <> '2026-10-02' then
    raise exception 'invalid_document_version';
  end if;

  select * into verified
  from public.phone_verification_states
  where user_id = auth.uid()
    and challenge_id = p_challenge_id
    and verified_at is not null
    and expires_at > now()
    and consumed_at is null
  for update;

  if verified.user_id is null then
    raise exception 'phone_not_verified';
  end if;

  update public.phone_verification_states
  set consumed_at = now()
  where user_id = auth.uid() and challenge_id = p_challenge_id;

  insert into public.profiles (
    user_id, display_name, email, phone_e164, phone_verified_at
  ) values (
    auth.uid(), p_display_name, p_email, verified.phone_e164, verified.verified_at
  ) on conflict (user_id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    phone_e164 = excluded.phone_e164,
    phone_verified_at = excluded.phone_verified_at,
    updated_at = now();

  insert into public.consent_acceptances (
    user_id, document_type, document_version, accepted
  ) values
    (auth.uid(), 'terms', p_terms_version, true),
    (auth.uid(), 'privacy', p_privacy_version, true),
    (auth.uid(), 'age_over_14', p_terms_version, true),
    (auth.uid(), 'marketing_sms', p_terms_version, p_marketing_sms),
    (auth.uid(), 'marketing_email', p_terms_version, p_marketing_email)
  on conflict (user_id, document_type, document_version) do nothing;
end;
$$;

revoke all on function public.complete_signup(text, text, text, text, text, boolean, boolean) from public;
grant execute on function public.complete_signup(text, text, text, text, text, boolean, boolean) to authenticated;

create or replace function public.set_primary_role(p_primary_role text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_primary_role not in ('principal_broker', 'assistant', 'landlord', 'tenant') then
    raise exception 'invalid_role';
  end if;

  if not exists (
    select 1 from public.profiles
    where user_id = auth.uid() and phone_verified_at is not null
  ) or not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'terms' and document_version = '2026-10-02' and accepted
  ) or not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'privacy' and document_version = '2026-10-02' and accepted
  ) or not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'age_over_14' and document_version = '2026-10-02' and accepted
  ) then
    raise exception 'signup_incomplete';
  end if;

  insert into public.user_roles (user_id, primary_role)
  values (auth.uid(), p_primary_role)
  on conflict (user_id) do update set
    primary_role = excluded.primary_role,
    updated_at = now();
end;
$$;

revoke all on function public.set_primary_role(text) from public;
grant execute on function public.set_primary_role(text) to authenticated;
