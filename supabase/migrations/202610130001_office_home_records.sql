create extension if not exists pgcrypto;

create table public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  created_by uuid not null references auth.users(id),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.office_memberships (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  office_role text not null check (office_role in (
    'principal_broker',
    'associate_broker',
    'assistant'
  )),
  status text not null default 'active' check (status in ('active', 'ended')),
  invited_by uuid references auth.users(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (office_id, user_id),
  check ((status = 'active' and ended_at is null) or status = 'ended')
);

create table public.homes (
  id uuid primary key default gen_random_uuid(),
  address_line1 text not null check (char_length(trim(address_line1)) between 5 and 200),
  address_detail text,
  address_fingerprint text not null,
  created_by uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homes_address_fingerprint_idx on public.homes (address_fingerprint);

create table public.office_home_assignments (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete restrict,
  home_id uuid not null references public.homes(id) on delete restrict,
  assigned_user_id uuid not null references auth.users(id) on delete restrict,
  assigned_by uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (office_id, home_id, assigned_user_id),
  check ((status = 'active' and ended_at is null) or status = 'ended')
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete restrict,
  contract_kind text not null check (contract_kind in ('owner_occupied', 'jeonse', 'monthly_rent', 'other')),
  status text not null default 'draft' check (status in ('draft', 'active', 'ended', 'cancelled')),
  starts_on date,
  ends_on date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.home_memberships (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  relationship_role text not null check (relationship_role in ('landlord', 'tenant', 'repairer')),
  status text not null default 'active' check (status in ('pending', 'active', 'ended', 'revoked')),
  access_scope text not null default 'current_contract'
    check (access_scope in ('current_contract', 'shared_history', 'repair_event')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (home_id, contract_id, user_id, relationship_role),
  check ((status = 'active' and ended_at is null) or status <> 'active')
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  invitation_kind text not null check (invitation_kind in ('office_member', 'home_member', 'repair_event')),
  office_id uuid references public.offices(id) on delete restrict,
  home_id uuid references public.homes(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete restrict,
  intended_role text not null,
  invited_identifier_hash text not null,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete restrict,
  office_id uuid references public.offices(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete restrict,
  record_space text not null check (record_space in (
    'office_internal',
    'current_contract',
    'shared_history'
  )),
  record_kind text not null check (record_kind in ('note', 'photo', 'document', 'repair', 'schedule', 'task')),
  title text not null check (char_length(trim(title)) between 1 and 120),
  body text,
  created_by uuid not null references auth.users(id),
  idempotency_key uuid not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, idempotency_key),
  check ((record_space = 'office_internal' and office_id is not null)
    or (record_space = 'current_contract' and contract_id is not null)
    or record_space = 'shared_history')
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete restrict,
  storage_path text not null unique,
  original_name text not null,
  media_type text not null,
  byte_size bigint not null check (byte_size > 0),
  checksum_sha256 text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed', 'quarantined')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.access_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  office_id uuid references public.offices(id),
  home_id uuid references public.homes(id),
  outcome text not null check (outcome in ('allowed', 'denied')),
  reason_code text not null,
  created_at timestamptz not null default now()
);

alter table public.offices enable row level security;
alter table public.office_memberships enable row level security;
alter table public.homes enable row level security;
alter table public.office_home_assignments enable row level security;
alter table public.contracts enable row level security;
alter table public.home_memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.records enable row level security;
alter table public.attachments enable row level security;
alter table public.access_audit_events enable row level security;

create or replace function public.is_active_office_member(p_office_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.office_memberships
    where office_id = p_office_id
      and user_id = auth.uid()
      and status = 'active'
      and ended_at is null
  );
$$;

create or replace function public.is_principal_office_member(p_office_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.office_memberships
    where office_id = p_office_id
      and user_id = auth.uid()
      and office_role = 'principal_broker'
      and status = 'active'
      and ended_at is null
  );
$$;

create or replace function public.can_perform_office_action(
  p_office_id uuid,
  p_action text
) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.office_memberships
    where office_id = p_office_id
      and user_id = auth.uid()
      and status = 'active'
      and ended_at is null
      and (
        p_action in ('upload_photo', 'manage_schedule', 'organize_document')
        or (
          p_action in ('explain_property', 'negotiate_terms', 'approve_contract')
          and office_role in ('principal_broker', 'associate_broker')
        )
        or (p_action in ('manage_members', 'manage_billing') and office_role = 'principal_broker')
      )
  );
$$;

create or replace function public.has_active_home_access(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.office_home_assignments assignment
    join public.office_memberships membership
      on membership.office_id = assignment.office_id
     and membership.user_id = auth.uid()
     and membership.status = 'active'
     and membership.ended_at is null
    where assignment.home_id = p_home_id
      and assignment.status = 'active'
      and assignment.ended_at is null
      and (
        assignment.assigned_user_id = auth.uid()
        or membership.office_role = 'principal_broker'
      )
  ) or exists (
    select 1
    from public.home_memberships
    where home_id = p_home_id
      and user_id = auth.uid()
      and status = 'active'
      and ended_at is null
      and (expires_at is null or expires_at > now())
  );
$$;

create or replace function public.has_active_office_home_access(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.office_home_assignments assignment
    join public.office_memberships membership
      on membership.office_id = assignment.office_id
     and membership.user_id = auth.uid()
     and membership.status = 'active'
     and membership.ended_at is null
    where assignment.home_id = p_home_id
      and assignment.status = 'active'
      and assignment.ended_at is null
      and (
        assignment.assigned_user_id = auth.uid()
        or membership.office_role = 'principal_broker'
      )
  );
$$;

create or replace function public.can_access_contract(p_contract_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.contracts contract
    where contract.id = p_contract_id
      and (
        public.has_active_office_home_access(contract.home_id)
        or exists (
          select 1
          from public.home_memberships
          where contract_id = p_contract_id
            and home_id = contract.home_id
            and user_id = auth.uid()
            and status = 'active'
            and ended_at is null
            and (expires_at is null or expires_at > now())
        )
      )
  );
$$;

create or replace function public.can_access_record(p_record_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.records record
    where record.id = p_record_id
      and (
        (
          record.record_space = 'office_internal'
          and record.office_id is not null
          and public.is_active_office_member(record.office_id)
          and public.has_active_home_access(record.home_id)
        )
        or (
          record.record_space = 'current_contract'
          and record.contract_id is not null
          and public.can_access_contract(record.contract_id)
          and exists (
            select 1 from public.contracts contract
            where contract.id = record.contract_id
              and contract.home_id = record.home_id
              and contract.status in ('draft', 'active')
          )
        )
        or (
          record.record_space = 'shared_history'
          and public.has_active_home_access(record.home_id)
        )
      )
  );
$$;

revoke all on function public.is_active_office_member(uuid) from public;
revoke all on function public.is_principal_office_member(uuid) from public;
revoke all on function public.can_perform_office_action(uuid, text) from public;
revoke all on function public.has_active_home_access(uuid) from public;
revoke all on function public.has_active_office_home_access(uuid) from public;
revoke all on function public.can_access_contract(uuid) from public;
revoke all on function public.can_access_record(uuid) from public;
grant execute on function public.is_active_office_member(uuid) to authenticated;
grant execute on function public.is_principal_office_member(uuid) to authenticated;
grant execute on function public.can_perform_office_action(uuid, text) to authenticated;
grant execute on function public.has_active_home_access(uuid) to authenticated;
grant execute on function public.has_active_office_home_access(uuid) to authenticated;
grant execute on function public.can_access_contract(uuid) to authenticated;
grant execute on function public.can_access_record(uuid) to authenticated;

create policy "offices_select_member" on public.offices
  for select using (public.is_active_office_member(id));

create policy "office_memberships_select_member" on public.office_memberships
  for select using (public.is_active_office_member(office_id));

create policy "homes_select_authorized" on public.homes
  for select using (public.has_active_home_access(id));

create policy "homes_insert_creator" on public.homes
  for insert with check (created_by = auth.uid());

create policy "homes_update_authorized" on public.homes
  for update using (public.has_active_home_access(id))
  with check (public.has_active_home_access(id));

create policy "office_assignments_select_member" on public.office_home_assignments
  for select using (public.is_active_office_member(office_id));

create policy "contracts_select_authorized" on public.contracts
  for select using (public.can_access_contract(id));

create policy "home_memberships_select_related" on public.home_memberships
  for select using (user_id = auth.uid() or public.has_active_office_home_access(home_id));

create policy "records_select_authorized" on public.records
  for select using (public.can_access_record(id));

create policy "records_insert_authorized" on public.records
  for insert with check (
    created_by = auth.uid()
    and public.has_active_home_access(home_id)
    and (
      record_space <> 'office_internal'
      or (office_id is not null and public.is_active_office_member(office_id))
    )
  );

create policy "records_update_authorized" on public.records
  for update using (public.can_access_record(id))
  with check (public.can_access_record(id));

create policy "attachments_select_authorized" on public.attachments
  for select using (public.can_access_record(record_id));

create policy "attachments_insert_authorized" on public.attachments
  for insert with check (created_by = auth.uid() and public.can_access_record(record_id));

revoke all on public.offices from anon, authenticated;
revoke all on public.office_memberships from anon, authenticated;
revoke all on public.homes from anon, authenticated;
revoke all on public.office_home_assignments from anon, authenticated;
revoke all on public.contracts from anon, authenticated;
revoke all on public.home_memberships from anon, authenticated;
revoke all on public.invitations from anon, authenticated;
revoke all on public.records from anon, authenticated;
revoke all on public.attachments from anon, authenticated;
revoke all on public.access_audit_events from anon, authenticated;

grant select on public.offices to authenticated;
grant select on public.office_memberships to authenticated;
grant select, insert, update on public.homes to authenticated;
grant select on public.office_home_assignments to authenticated;
grant select on public.contracts to authenticated;
grant select on public.home_memberships to authenticated;
grant select, insert, update on public.records to authenticated;
grant select, insert on public.attachments to authenticated;
grant select, insert on public.access_audit_events to service_role;
