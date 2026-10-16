-- ZIPSIN Preview DB에 빠진 업데이트를 한 번에 넣는다 (2026-10-16 사용자 승인, 2차).
-- 다시 실행해도 안전하게: 이미 있는 표·칸·인덱스는 건너뛰고, 규칙(policy)·제약은 지우고 다시 만든다.
-- 전부 성공하거나, 하나라도 실패하면 전부 취소된다(begin/commit). 회원·기록 데이터는 지우지 않는다.
begin;

-- ===== 202610130011_contract_lifecycle_home =====
alter table public.profiles
  add column if not exists usage_purpose text
  check (usage_purpose in ('tenant', 'landlord', 'broker', 'management_other'));

update public.profiles profile
set usage_purpose = case
  when role.primary_role = 'tenant' then 'tenant'
  when role.primary_role = 'landlord' then 'landlord'
  when role.primary_role in ('principal_broker', 'associate_broker', 'assistant') then 'broker'
  else null
end
from public.user_roles role
where role.user_id = profile.user_id and profile.usage_purpose is null;

alter table public.user_roles drop constraint if exists user_roles_primary_role_check;
alter table public.user_roles add constraint user_roles_primary_role_check
  check (primary_role in ('principal_broker', 'associate_broker', 'assistant', 'landlord', 'tenant'));

create or replace function public.complete_usage_onboarding(
  p_usage_purpose text,
  p_primary_role text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_usage_purpose not in ('tenant', 'landlord', 'broker', 'management_other') then
    raise exception 'invalid_purpose';
  end if;
  if (p_usage_purpose = 'tenant' and p_primary_role is distinct from 'tenant')
    or (p_usage_purpose = 'landlord' and p_primary_role is distinct from 'landlord')
    or (p_usage_purpose = 'broker' and p_primary_role not in ('principal_broker', 'associate_broker', 'assistant'))
    or (p_usage_purpose = 'management_other' and p_primary_role is not null) then
    raise exception 'invalid_role_combination';
  end if;

  perform 1 from public.profiles
  where user_id = auth.uid() and phone_verified_at is not null
  for update;
  if not found then raise exception 'signup_incomplete'; end if;

  if not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'terms' and document_version = '2026-10-02' and accepted
  ) or not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'privacy' and document_version = '2026-10-02' and accepted
  ) or not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'age_over_14' and document_version = '2026-10-02' and accepted
  ) then raise exception 'signup_incomplete'; end if;

  update public.profiles
  set usage_purpose = p_usage_purpose, updated_at = now()
  where user_id = auth.uid();

  if p_primary_role is null then
    delete from public.user_roles where user_id = auth.uid();
  else
    insert into public.user_roles (user_id, primary_role)
    values (auth.uid(), p_primary_role)
    on conflict (user_id) do update set
      primary_role = excluded.primary_role,
      updated_at = now();
  end if;
end;
$$;

revoke all on function public.complete_usage_onboarding(text, text) from public, anon, authenticated;
grant execute on function public.complete_usage_onboarding(text, text) to authenticated;

alter table public.contracts add column if not exists idempotency_key uuid;
alter table public.contracts drop constraint if exists contracts_creator_idempotency_unique;
alter table public.contracts add constraint contracts_creator_idempotency_unique unique (created_by, idempotency_key);
create unique index if not exists contracts_one_active_per_home on public.contracts (home_id) where status = 'active';

create table if not exists public.contract_plan_states (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null,
  home_id uuid not null,
  subject_user_id uuid not null references auth.users(id) on delete restrict,
  plan_status text not null default 'undecided'
    check (plan_status in ('undecided', 'renewal_considering', 'move_out_preparing')),
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, subject_user_id),
  foreign key (contract_id, home_id) references public.contracts (id, home_id) on delete restrict
);

create table if not exists public.contract_plan_events (
  id bigint generated always as identity primary key,
  contract_id uuid not null,
  home_id uuid not null,
  subject_user_id uuid not null references auth.users(id) on delete restrict,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  previous_status text check (previous_status is null or previous_status in ('undecided', 'renewal_considering', 'move_out_preparing')),
  next_status text not null check (next_status in ('undecided', 'renewal_considering', 'move_out_preparing')),
  created_at timestamptz not null default now(),
  foreign key (contract_id, home_id) references public.contracts (id, home_id) on delete restrict
);

alter table public.contract_plan_states enable row level security;
alter table public.contract_plan_events enable row level security;

drop policy if exists "contract_plan_states_select_authorized" on public.contract_plan_states;
drop policy if exists "contract_plan_events_select_authorized" on public.contract_plan_events;
revoke all on public.contract_plan_states from anon, authenticated;
revoke all on public.contract_plan_events from anon, authenticated;

create or replace function public.get_contract_party_plan_statuses(
  p_contract_id uuid
) returns table (
  relationship_role text,
  plan_status text,
  is_current_user boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_contract_id is null or not public.can_access_contract(p_contract_id) then
    raise exception 'permission_denied';
  end if;

  return query
  select membership.relationship_role,
    coalesce(state.plan_status, 'undecided') as plan_status,
    membership.user_id = v_user_id as is_current_user
  from public.home_memberships membership
  left join public.contract_plan_states state
    on state.contract_id = membership.contract_id
   and state.subject_user_id = membership.user_id
  where membership.contract_id = p_contract_id
    and membership.relationship_role in ('landlord', 'tenant')
    and membership.access_scope = 'current_contract'
    and membership.status = 'active'
    and membership.ended_at is null
    and membership.starts_at <= now()
    and (membership.expires_at is null or membership.expires_at > now());
end;
$$;

create or replace function public.upsert_active_contract_for_home(
  p_home_id uuid,
  p_contract_kind text,
  p_starts_on date,
  p_ends_on date,
  p_idempotency_key uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_home public.homes%rowtype;
  v_contract public.contracts%rowtype;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_home_id is null or p_idempotency_key is null
    or p_contract_kind not in ('owner_occupied', 'jeonse', 'monthly_rent', 'other')
    or (p_starts_on is not null and p_ends_on is not null and p_ends_on < p_starts_on) then
    raise exception 'invalid_input';
  end if;

  select * into v_home from public.homes home
  where home.id = p_home_id and home.status = 'active' and home.office_id is not null
  for share;
  if not found then raise exception 'permission_denied'; end if;

  perform 1 from public.office_memberships membership
  where membership.office_id = v_home.office_id
    and membership.user_id = v_user_id
    and membership.office_role in ('principal_broker', 'associate_broker')
    and membership.status = 'active'
    and membership.ended_at is null
    and membership.started_at <= now()
  for share;
  if not found then raise exception 'permission_denied'; end if;

  select * into v_contract from public.contracts contract
  where contract.home_id = p_home_id and contract.status = 'active'
  for update;

  if found then
    if v_contract.contract_kind is distinct from p_contract_kind then raise exception 'conflict'; end if;
    update public.contracts
    set starts_on = p_starts_on, ends_on = p_ends_on, updated_at = now()
    where id = v_contract.id
    returning * into v_contract;
  else
    select * into v_contract from public.contracts contract
    where contract.created_by = v_user_id and contract.idempotency_key = p_idempotency_key;
    if found then
      if v_contract.home_id is distinct from p_home_id or v_contract.contract_kind is distinct from p_contract_kind
        or v_contract.starts_on is distinct from p_starts_on or v_contract.ends_on is distinct from p_ends_on then
        raise exception 'conflict';
      end if;
      return v_contract.id;
    end if;

    insert into public.contracts (home_id, contract_kind, status, starts_on, ends_on, created_by, idempotency_key)
    values (p_home_id, p_contract_kind, 'active', p_starts_on, p_ends_on, v_user_id, p_idempotency_key)
    returning * into v_contract;
  end if;

  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, office_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'upsert', 'contract', v_contract.id, v_home.office_id, p_home_id, 'allowed', 'contract_dates_saved'
  );
  return v_contract.id;
end;
$$;

create or replace function public.set_own_contract_plan(
  p_contract_id uuid,
  p_plan_status text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_contract public.contracts%rowtype;
  v_previous_status text;
  v_state_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_contract_id is null or p_plan_status not in ('undecided', 'renewal_considering', 'move_out_preparing') then
    raise exception 'invalid_input';
  end if;

  select * into v_contract from public.contracts contract
  where contract.id = p_contract_id and contract.status = 'active'
  for share;
  if not found then raise exception 'relation_ended'; end if;

  perform 1 from public.home_memberships membership
  where membership.contract_id = v_contract.id
    and membership.home_id = v_contract.home_id
    and membership.user_id = auth.uid()
    and membership.relationship_role in ('landlord', 'tenant')
    and membership.access_scope = 'current_contract'
    and membership.status = 'active'
    and membership.ended_at is null
    and membership.starts_at <= now()
    and (membership.expires_at is null or membership.expires_at > now())
  for share;
  if not found then raise exception 'relation_ended'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_contract_id::text || ':' || v_user_id::text, 0)
  );

  select state.plan_status into v_previous_status
  from public.contract_plan_states state
  where state.contract_id = p_contract_id and state.subject_user_id = v_user_id
  for update;

  insert into public.contract_plan_states (
    contract_id, home_id, subject_user_id, plan_status, updated_by
  ) values (
    v_contract.id, v_contract.home_id, v_user_id, p_plan_status, v_user_id
  ) on conflict (contract_id, subject_user_id) do update set
    plan_status = excluded.plan_status,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning id into v_state_id;

  if v_previous_status is distinct from p_plan_status then
    insert into public.contract_plan_events (
      contract_id, home_id, subject_user_id, actor_user_id, previous_status, next_status
    ) values (
      v_contract.id, v_contract.home_id, v_user_id, v_user_id, v_previous_status, p_plan_status
    );
  end if;

  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'update', 'contract_plan', v_state_id, v_contract.home_id, 'allowed', p_plan_status
  );
  return v_state_id;
end;
$$;

revoke all on function public.upsert_active_contract_for_home(uuid, text, date, date, uuid) from public, anon, authenticated;
revoke all on function public.set_own_contract_plan(uuid, text) from public, anon, authenticated;
revoke all on function public.get_contract_party_plan_statuses(uuid) from public, anon, authenticated;
grant execute on function public.upsert_active_contract_for_home(uuid, text, date, date, uuid) to authenticated;
grant execute on function public.set_own_contract_plan(uuid, text) to authenticated;
grant execute on function public.get_contract_party_plan_statuses(uuid) to authenticated;


-- ===== 202610130101_zipsin_check_account_sync =====
create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists onboarding_state text not null default 'pending'
    check (onboarding_state in ('pending', 'complete')),
  add column if not exists user_type text
    check (user_type in ('house_hunter', 'tenant'));

create table if not exists public.signup_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('zipsin_check')),
  created_at timestamptz not null default now(),
  unique (user_id, source)
);

create or replace function public.complete_check_onboarding(p_user_type text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if p_user_type not in ('house_hunter', 'tenant') then
    raise exception 'invalid_user_type';
  end if;

  insert into public.profiles (user_id, user_type, onboarding_state)
  values (auth.uid(), p_user_type, 'complete')
  on conflict (user_id) do update set
    user_type = excluded.user_type,
    onboarding_state = excluded.onboarding_state,
    updated_at = now();

  insert into public.signup_attributions (user_id, source)
  values (auth.uid(), 'zipsin_check')
  on conflict (user_id, source) do nothing;
end;
$$;

revoke all on function public.complete_check_onboarding(text) from public;
grant execute on function public.complete_check_onboarding(text) to authenticated;

create table if not exists public.transfer_manifests (
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

create table if not exists public.candidate_drafts (
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

create table if not exists public.candidate_answers (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_drafts(id) on delete cascade,
  item_id text not null,
  status text not null check (status in ('confirmed', 'caution', 'unverified', 'expert')),
  source text not null check (source in ('observed', 'explained', 'document', 'expert')),
  memo text check (memo is null or length(memo) <= 120),
  action_checks_json jsonb not null default '{}'::jsonb,
  unique (candidate_id, item_id)
);

create table if not exists public.candidate_photos (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_drafts(id) on delete cascade,
  item_id text not null,
  storage_path text not null,
  bytes integer not null check (bytes > 0 and bytes <= 10485760),
  mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  created_at timestamptz not null default now(),
  unique (candidate_id, item_id, storage_path)
);

create table if not exists public.transfer_items (
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

alter table public.signup_attributions enable row level security;
alter table public.transfer_manifests enable row level security;
alter table public.candidate_drafts enable row level security;
alter table public.candidate_answers enable row level security;
alter table public.candidate_photos enable row level security;
alter table public.transfer_items enable row level security;

drop policy if exists "attributions_owner_all" on public.signup_attributions;
create policy "attributions_owner_all" on public.signup_attributions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "manifests_owner_all" on public.transfer_manifests;
create policy "manifests_owner_all" on public.transfer_manifests for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists "drafts_owner_all" on public.candidate_drafts;
create policy "drafts_owner_all" on public.candidate_drafts for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists "answers_owner_all" on public.candidate_answers;
create policy "answers_owner_all" on public.candidate_answers for all
  using (exists (select 1 from public.candidate_drafts d where d.id = candidate_id and d.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.candidate_drafts d where d.id = candidate_id and d.owner_user_id = auth.uid()));
drop policy if exists "photos_owner_all" on public.candidate_photos;
create policy "photos_owner_all" on public.candidate_photos for all
  using (exists (select 1 from public.candidate_drafts d where d.id = candidate_id and d.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.candidate_drafts d where d.id = candidate_id and d.owner_user_id = auth.uid()));
drop policy if exists "transfer_items_owner_all" on public.transfer_items;
create policy "transfer_items_owner_all" on public.transfer_items for all
  using (exists (select 1 from public.transfer_manifests m where m.id = manifest_id and m.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.transfer_manifests m where m.id = manifest_id and m.owner_user_id = auth.uid()));

grant select, insert on public.signup_attributions to authenticated;
grant select, insert, update, delete on public.transfer_manifests to authenticated;
grant select, insert, update, delete on public.candidate_drafts to authenticated;
grant select, insert, update, delete on public.candidate_answers to authenticated;
grant select, insert, update, delete on public.candidate_photos to authenticated;
grant select, insert, update, delete on public.transfer_items to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('candidate-photos', 'candidate-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "candidate_photos_owner_select" on storage.objects;
create policy "candidate_photos_owner_select" on storage.objects for select
  using (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
drop policy if exists "candidate_photos_owner_insert" on storage.objects;
create policy "candidate_photos_owner_insert" on storage.objects for insert
  with check (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and array_length(storage.foldername(name),1)=2 and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
drop policy if exists "candidate_photos_owner_update" on storage.objects;
create policy "candidate_photos_owner_update" on storage.objects for update
  using (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()))
  with check (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and array_length(storage.foldername(name),1)=2 and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
drop policy if exists "candidate_photos_owner_delete" on storage.objects;
create policy "candidate_photos_owner_delete" on storage.objects for delete
  using (bucket_id = 'candidate-photos' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));


-- ===== 202610130102_photo_cleanup_queue =====
alter table public.candidate_photos add column if not exists local_photo_id text;
create unique index if not exists candidate_photos_local_unique on public.candidate_photos(candidate_id, local_photo_id) where local_photo_id is not null;

create table if not exists public.photo_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','complete','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, storage_path)
);
alter table public.photo_cleanup_queue enable row level security;
drop policy if exists "cleanup_owner_read" on public.photo_cleanup_queue;
create policy "cleanup_owner_read" on public.photo_cleanup_queue for select using (owner_user_id=auth.uid());
drop policy if exists "cleanup_owner_insert" on public.photo_cleanup_queue;
create policy "cleanup_owner_insert" on public.photo_cleanup_queue for insert with check (owner_user_id=auth.uid());


-- ===== 202610140001_phone_verification_hardening =====
alter table public.phone_verification_states
  add column if not exists purpose text not null default 'signup' check (purpose in ('signup', 'recovery')),
  add column if not exists code_digest text not null default '',
  add column if not exists attempts integer not null default 0 check (attempts between 0 and 5),
  add column if not exists provider_message_id text,
  add column if not exists last_error_code text;

create or replace function public.issue_phone_challenge(
  p_user_id uuid,
  p_challenge_id text,
  p_phone_e164 text,
  p_code_digest text,
  p_expires_at timestamptz,
  p_provider_message_id text,
  p_purpose text default 'signup'
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_purpose not in ('signup', 'recovery') or p_expires_at > now() + interval '5 minutes 5 seconds' then
    raise exception 'invalid_challenge';
  end if;
  insert into public.phone_verification_states (
    user_id, challenge_id, phone_e164, purpose, code_digest, attempts,
    sent_at, expires_at, verified_at, consumed_at, provider_message_id, last_error_code
  ) values (
    p_user_id, p_challenge_id, p_phone_e164, p_purpose, p_code_digest, 0,
    now(), p_expires_at, null, null, p_provider_message_id, null
  ) on conflict (user_id) do update set
    challenge_id = excluded.challenge_id,
    phone_e164 = excluded.phone_e164,
    purpose = excluded.purpose,
    code_digest = excluded.code_digest,
    attempts = 0,
    sent_at = now(),
    expires_at = excluded.expires_at,
    verified_at = null,
    consumed_at = null,
    provider_message_id = excluded.provider_message_id,
    last_error_code = null;
end;
$$;

create or replace function public.verify_phone_challenge(
  p_user_id uuid,
  p_challenge_id text,
  p_code_digest text,
  p_purpose text default 'signup'
) returns text
language plpgsql security definer set search_path = public as $$
declare state public.phone_verification_states%rowtype;
begin
  select * into state from public.phone_verification_states
  where user_id = p_user_id and challenge_id = p_challenge_id and purpose = p_purpose for update;
  if state.user_id is null then return 'not_found'; end if;
  if state.consumed_at is not null then return 'used'; end if;
  if state.expires_at <= now() then return 'expired'; end if;
  if state.attempts >= 5 then return 'attempts_exceeded'; end if;
  if state.code_digest <> p_code_digest then
    update public.phone_verification_states set attempts = attempts + 1,
      last_error_code = case when attempts + 1 >= 5 then 'attempts_exceeded' else 'mismatch' end
    where user_id = p_user_id;
    if state.attempts + 1 >= 5 then return 'attempts_exceeded'; end if;
    return 'mismatch';
  end if;
  update public.phone_verification_states set verified_at = now(), last_error_code = null
  where user_id = p_user_id and challenge_id = p_challenge_id and consumed_at is null;
  return 'verified';
end;
$$;

revoke all on function public.issue_phone_challenge(uuid, text, text, text, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.verify_phone_challenge(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.issue_phone_challenge(uuid, text, text, text, timestamptz, text, text) to service_role;
grant execute on function public.verify_phone_challenge(uuid, text, text, text) to service_role;


-- ===== 202610140002_phone_account_recovery =====
create table if not exists public.account_recovery_challenges (
  id text primary key,
  phone_e164 text not null,
  user_id uuid references auth.users(id) on delete set null,
  code_digest text not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  provider_message_id text,
  created_at timestamptz not null default now()
);

alter table public.account_recovery_challenges enable row level security;
revoke all on public.account_recovery_challenges from public, anon, authenticated;
grant select, insert, update on public.account_recovery_challenges to service_role;

do $$
begin
  if not exists (
    select 1 from public.profiles where phone_verified_at is not null and phone_e164 is not null
    group by phone_e164 having count(*) > 1
  ) then
    create unique index if not exists profiles_one_verified_phone
      on public.profiles(phone_e164)
      where phone_verified_at is not null and phone_e164 is not null;
  end if;
end $$;


-- ===== 202610140003_auth_recovery_security =====
create table if not exists public.auth_sms_send_events (
  id bigint generated always as identity primary key,
  scope text not null,
  key_digest text not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_sms_send_events_lookup on public.auth_sms_send_events(scope, key_digest, created_at desc);
alter table public.auth_sms_send_events enable row level security;
revoke all on public.auth_sms_send_events from public, anon, authenticated;
grant select, insert, delete on public.auth_sms_send_events to service_role;

create or replace function public.reserve_auth_sms_send(
  p_scope text, p_key_digest text, p_min_interval_seconds integer,
  p_hour_limit integer, p_day_limit integer
) returns boolean language plpgsql security definer set search_path = public as $$
declare last_sent timestamptz; hour_count integer; day_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_scope || ':' || p_key_digest, 0));
  delete from public.auth_sms_send_events where created_at < now() - interval '25 hours';
  select max(created_at), count(*) filter (where created_at > now() - interval '1 hour'),
    count(*) filter (where created_at > now() - interval '24 hours')
    into last_sent, hour_count, day_count from public.auth_sms_send_events
    where scope = p_scope and key_digest = p_key_digest;
  if last_sent is not null and last_sent > now() - make_interval(secs => p_min_interval_seconds) then return false; end if;
  if hour_count >= p_hour_limit or day_count >= p_day_limit then return false; end if;
  insert into public.auth_sms_send_events(scope, key_digest) values (p_scope, p_key_digest);
  return true;
end; $$;

revoke all on function public.reserve_auth_sms_send(text,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.reserve_auth_sms_send(text,text,integer,integer,integer) to service_role;

create or replace function public.issue_account_recovery_challenge(
  p_id text, p_phone_e164 text, p_user_id uuid, p_code_digest text, p_expires_at timestamptz
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('recovery:' || p_phone_e164, 0));
  update public.account_recovery_challenges set consumed_at = now()
    where phone_e164 = p_phone_e164 and consumed_at is null;
  insert into public.account_recovery_challenges(id, phone_e164, user_id, code_digest, expires_at)
    values (p_id, p_phone_e164, p_user_id, p_code_digest, p_expires_at);
end; $$;

create or replace function public.verify_account_recovery_challenge(
  p_id text, p_code_digest text
) returns table(status text, user_id uuid) language plpgsql security definer set search_path = public as $$
declare state public.account_recovery_challenges%rowtype;
begin
  select * into state from public.account_recovery_challenges where id = p_id for update;
  if state.id is null then return query select 'not_found'::text, null::uuid; return; end if;
  if state.consumed_at is not null then return query select 'used'::text, null::uuid; return; end if;
  if state.expires_at <= now() then return query select 'expired'::text, null::uuid; return; end if;
  if state.attempts >= 5 then return query select 'attempts_exceeded'::text, null::uuid; return; end if;
  if state.code_digest <> p_code_digest then
    update public.account_recovery_challenges set attempts = attempts + 1 where id = p_id;
    return query select case when state.attempts + 1 >= 5 then 'attempts_exceeded' else 'mismatch' end::text, null::uuid; return;
  end if;
  update public.account_recovery_challenges set consumed_at = now() where id = p_id;
  return query select 'verified'::text, state.user_id; return;
end; $$;
revoke all on function public.issue_account_recovery_challenge(text,text,uuid,text,timestamptz) from public, anon, authenticated;
revoke all on function public.verify_account_recovery_challenge(text,text) from public, anon, authenticated;
grant execute on function public.issue_account_recovery_challenge(text,text,uuid,text,timestamptz) to service_role;
grant execute on function public.verify_account_recovery_challenge(text,text) to service_role;

create table if not exists public.account_recovery_sessions (
  token_digest text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null, consumed_at timestamptz, created_at timestamptz not null default now()
);
alter table public.account_recovery_sessions enable row level security;
revoke all on public.account_recovery_sessions from public, anon, authenticated;
grant select, insert, update on public.account_recovery_sessions to service_role;
create or replace function public.consume_account_recovery_session(p_token_digest text)
returns uuid language plpgsql security definer set search_path = public as $$
declare session_user uuid;
begin
  select user_id into session_user from public.account_recovery_sessions
    where token_digest = p_token_digest and consumed_at is null and expires_at > now() for update;
  if session_user is null then return null; end if;
  update public.account_recovery_sessions set consumed_at = now() where token_digest = p_token_digest;
  return session_user;
end; $$;
revoke all on function public.consume_account_recovery_session(text) from public, anon, authenticated;
grant execute on function public.consume_account_recovery_session(text) to service_role;

create or replace function public.account_has_verified_phone(p_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where user_id = p_user_id and phone_verified_at is not null)
$$;
revoke all on function public.account_has_verified_phone(uuid) from public, anon;
grant execute on function public.account_has_verified_phone(uuid) to authenticated, service_role;

create or replace function public.set_primary_role(p_primary_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_primary_role not in ('principal_broker','assistant','landlord','tenant') then raise exception 'invalid_role'; end if;
  if not public.account_has_verified_phone(auth.uid())
    or not exists(select 1 from public.consent_acceptances where user_id=auth.uid() and document_type='terms' and accepted)
    or not exists(select 1 from public.consent_acceptances where user_id=auth.uid() and document_type='privacy' and accepted)
  then raise exception 'signup_incomplete'; end if;
  insert into public.user_roles(user_id,primary_role) values(auth.uid(),p_primary_role)
    on conflict(user_id) do update set primary_role=excluded.primary_role,updated_at=now();
end; $$;

create or replace function public.complete_check_onboarding(p_user_type text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.account_has_verified_phone(auth.uid()) then raise exception 'phone_verification_required'; end if;
  if p_user_type not in ('house_hunter', 'tenant') then raise exception 'invalid_user_type'; end if;
  update public.profiles set user_type=p_user_type,onboarding_state='complete',updated_at=now() where user_id=auth.uid();
  insert into public.signup_attributions(user_id,source) values(auth.uid(),'zipsin_check') on conflict do nothing;
end; $$;

drop policy if exists "candidate_photos_owner_select" on storage.objects;
create policy "candidate_photos_owner_select" on storage.objects for select using (
  bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "candidate_photos_owner_insert" on storage.objects;
create policy "candidate_photos_owner_insert" on storage.objects for insert with check (
  bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text
  and array_length(storage.foldername(name),1)=2 and exists(select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
drop policy if exists "candidate_photos_owner_update" on storage.objects;
create policy "candidate_photos_owner_update" on storage.objects for update
  using (bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text)
  with check (bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "candidate_photos_owner_delete" on storage.objects;
create policy "candidate_photos_owner_delete" on storage.objects for delete using (
  bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "manifests_owner_all" on public.transfer_manifests;
create policy "manifests_owner_all" on public.transfer_manifests for all
  using (owner_user_id=auth.uid() and public.account_has_verified_phone(auth.uid()))
  with check (owner_user_id=auth.uid() and public.account_has_verified_phone(auth.uid()));
drop policy if exists "drafts_owner_all" on public.candidate_drafts;
create policy "drafts_owner_all" on public.candidate_drafts for all
  using (owner_user_id=auth.uid() and public.account_has_verified_phone(auth.uid()))
  with check (owner_user_id=auth.uid() and public.account_has_verified_phone(auth.uid()));
drop policy if exists "answers_owner_all" on public.candidate_answers;
create policy "answers_owner_all" on public.candidate_answers for all
  using (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.candidate_drafts d where d.id=candidate_id and d.owner_user_id=auth.uid()))
  with check (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.candidate_drafts d where d.id=candidate_id and d.owner_user_id=auth.uid()));
drop policy if exists "photos_owner_all" on public.candidate_photos;
create policy "photos_owner_all" on public.candidate_photos for all
  using (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.candidate_drafts d where d.id=candidate_id and d.owner_user_id=auth.uid()))
  with check (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.candidate_drafts d where d.id=candidate_id and d.owner_user_id=auth.uid()));
drop policy if exists "transfer_items_owner_all" on public.transfer_items;
create policy "transfer_items_owner_all" on public.transfer_items for all
  using (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.transfer_manifests m where m.id=manifest_id and m.owner_user_id=auth.uid()))
  with check (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.transfer_manifests m where m.id=manifest_id and m.owner_user_id=auth.uid()));

create or replace function public.complete_signup(
  p_display_name text, p_email text, p_challenge_id text, p_terms_version text,
  p_privacy_version text, p_marketing_sms boolean, p_marketing_email boolean
) returns void language plpgsql security definer set search_path = public as $$
declare verified public.phone_verification_states%rowtype;
begin
  if p_terms_version <> '2026-10-02' or p_privacy_version <> '2026-10-02' then raise exception 'invalid_document_version'; end if;
  select * into verified from public.phone_verification_states where user_id=auth.uid() and challenge_id=p_challenge_id
    and verified_at is not null and expires_at>now() and consumed_at is null for update;
  if verified.user_id is null then raise exception 'phone_not_verified'; end if;
  perform pg_advisory_xact_lock(hashtextextended('verified-phone:' || verified.phone_e164, 0));
  if exists(select 1 from public.profiles where phone_e164=verified.phone_e164 and phone_verified_at is not null and user_id<>auth.uid())
  then raise exception 'phone_already_registered'; end if;
  update public.phone_verification_states set consumed_at=now() where user_id=auth.uid() and challenge_id=p_challenge_id;
  insert into public.profiles(user_id,display_name,email,phone_e164,phone_verified_at)
    values(auth.uid(),p_display_name,p_email,verified.phone_e164,verified.verified_at)
    on conflict(user_id) do update set display_name=excluded.display_name,email=excluded.email,phone_e164=excluded.phone_e164,phone_verified_at=excluded.phone_verified_at,updated_at=now();
  insert into public.consent_acceptances(user_id,document_type,document_version,accepted) values
    (auth.uid(),'terms',p_terms_version,true),(auth.uid(),'privacy',p_privacy_version,true),
    (auth.uid(),'marketing_sms',p_terms_version,p_marketing_sms),(auth.uid(),'marketing_email',p_terms_version,p_marketing_email)
    on conflict(user_id,document_type,document_version) do nothing;
end; $$;


-- ===== 202610150001_usage_onboarding_without_age_consent =====
-- 2026-10-15 브랜치 통합: 단일 화면 가입(DEC-025, shared-auth)은 별도 만 14세 확인 동의를 받지 않는다.
-- 계약 중심 집 홈의 사용 목적 저장(202610130011)은 age_over_14 동의를 요구해 새 가입자가 목적 저장에서 막힌다.
-- 같은 서명으로 함수를 교체해 terms·privacy 동의와 휴대전화 인증만 확인한다. 과거 마이그레이션은 수정하지 않는다.

create or replace function public.complete_usage_onboarding(
  p_usage_purpose text,
  p_primary_role text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_usage_purpose not in ('tenant', 'landlord', 'broker', 'management_other') then
    raise exception 'invalid_purpose';
  end if;
  if (p_usage_purpose = 'tenant' and p_primary_role is distinct from 'tenant')
    or (p_usage_purpose = 'landlord' and p_primary_role is distinct from 'landlord')
    or (p_usage_purpose = 'broker' and p_primary_role not in ('principal_broker', 'associate_broker', 'assistant'))
    or (p_usage_purpose = 'management_other' and p_primary_role is not null) then
    raise exception 'invalid_role_combination';
  end if;

  perform 1 from public.profiles
  where user_id = auth.uid() and phone_verified_at is not null
  for update;
  if not found then raise exception 'signup_incomplete'; end if;

  if not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'terms' and document_version = '2026-10-02' and accepted
  ) or not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'privacy' and document_version = '2026-10-02' and accepted
  ) then raise exception 'signup_incomplete'; end if;

  update public.profiles
  set usage_purpose = p_usage_purpose, updated_at = now()
  where user_id = auth.uid();

  if p_primary_role is null then
    delete from public.user_roles where user_id = auth.uid();
  else
    insert into public.user_roles (user_id, primary_role)
    values (auth.uid(), p_primary_role)
    on conflict (user_id) do update set
      primary_role = excluded.primary_role,
      updated_at = now();
  end if;
end;
$$;

revoke all on function public.complete_usage_onboarding(text, text) from public, anon, authenticated;
grant execute on function public.complete_usage_onboarding(text, text) to authenticated;


-- ===== 202610160001_profiles_service_role_read =====
-- 2026-10-16: 서버 전용 service_role이 profiles를 읽을 수 있게 한다.
-- 아이디 찾기(이메일 → 아이디)와 비밀번호 재설정(이름 + 휴대폰)이 서버에서 profiles를 조회한다.
-- Preview 로그: "permission denied for table profiles" (code 42501).
-- anon·authenticated 권한은 바꾸지 않는다. 쓰기 권한은 주지 않는다(저장은 security definer 함수가 맡는다).
grant select on public.profiles to service_role;


commit;
select '완료: 빠진 업데이트 적용' as 결과;
