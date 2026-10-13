alter table public.profiles
  add column usage_purpose text
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

alter table public.contracts add column idempotency_key uuid;
alter table public.contracts add constraint contracts_creator_idempotency_unique unique (created_by, idempotency_key);
create unique index contracts_one_active_per_home on public.contracts (home_id) where status = 'active';

create table public.contract_plan_states (
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

create table public.contract_plan_events (
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
