-- Follow-up only. Preserve 202610130001_office_home_records.sql.
-- Apply transactionally after a backup and data preflight, never automatically.
begin;

revoke insert, update, delete on public.homes from anon, authenticated;
revoke insert, update, delete on public.records from anon, authenticated;
revoke insert, update, delete on public.attachments from anon, authenticated;
drop policy if exists "homes_insert_creator" on public.homes;
drop policy if exists "homes_update_authorized" on public.homes;
drop policy if exists "records_insert_authorized" on public.records;
drop policy if exists "records_update_authorized" on public.records;
drop policy if exists "attachments_insert_authorized" on public.attachments;

-- Canonical private office ownership; address equality grants no access.
-- Unowned legacy homes are retained and excluded from pilot access until explicitly migrated.
alter table public.homes add column office_id uuid references public.offices(id) on delete restrict;
do $$
begin
  if exists (
    select home_id from (
      select home_id, office_id from public.office_home_assignments
      union select home_id, office_id from public.records where office_id is not null
      union select home_id, office_id from public.invitations where home_id is not null and office_id is not null
    ) evidence group by home_id having count(distinct office_id) > 1
  ) then raise exception 'ambiguous_home_office'; end if;
end;
$$;
update public.homes home set office_id = evidence.office_id from (
  select home_id, office_id from public.office_home_assignments
  union select home_id, office_id from public.records where office_id is not null
  union select home_id, office_id from public.invitations where home_id is not null and office_id is not null
) evidence where evidence.home_id = home.id;
alter table public.homes add constraint homes_id_office_unique unique (id, office_id);
alter table public.contracts add constraint contracts_id_home_unique unique (id, home_id);

alter table public.office_home_assignments add constraint assignments_home_office
  foreign key (home_id, office_id) references public.homes (id, office_id);
alter table public.records add constraint records_home_office
  foreign key (home_id, office_id) references public.homes (id, office_id);
alter table public.records add constraint records_contract_home
  foreign key (contract_id, home_id) references public.contracts (id, home_id);
alter table public.home_memberships add constraint memberships_contract_home
  foreign key (contract_id, home_id) references public.contracts (id, home_id);
alter table public.invitations add constraint invitations_home_office
  foreign key (home_id, office_id) references public.homes (id, office_id);
alter table public.invitations add constraint invitations_contract_home
  foreign key (contract_id, home_id) references public.contracts (id, home_id);

-- Ended rows remain history. Reinvitation/reassignment creates a new row.
-- Resolve generated names by column identity (Postgres truncates names at 63 bytes).
do $$
declare old_constraint record;
begin
  for old_constraint in
    select constraint_row.conrelid, constraint_row.conname from pg_constraint constraint_row
    join (values
      ('public.office_memberships'::regclass, array['office_id', 'user_id']),
      ('public.office_home_assignments'::regclass, array['office_id', 'home_id', 'assigned_user_id']),
      ('public.home_memberships'::regclass, array['home_id', 'contract_id', 'user_id', 'relationship_role'])
    ) expected(table_id, column_names) on expected.table_id = constraint_row.conrelid
    where constraint_row.contype = 'u' and (
      select array_agg(attribute.attname::text order by column_key.ordinality)
      from unnest(constraint_row.conkey) with ordinality column_key(attnum, ordinality)
      join pg_attribute attribute on attribute.attrelid = constraint_row.conrelid
        and attribute.attnum = column_key.attnum
    ) = expected.column_names
  loop
    execute format('alter table %s drop constraint %I', old_constraint.conrelid::regclass, old_constraint.conname);
  end loop;
end;
$$;
create unique index office_memberships_active_unique on public.office_memberships (office_id, user_id)
  where status = 'active' and ended_at is null;
create unique index office_assignments_active_unique on public.office_home_assignments (office_id, home_id, assigned_user_id)
  where status = 'active' and ended_at is null;
create unique index home_memberships_active_unique on public.home_memberships (home_id, contract_id, user_id, relationship_role) nulls not distinct
  where status = 'active' and ended_at is null;

alter table public.office_memberships add constraint office_memberships_lifecycle check (
  (status = 'active' and ended_at is null) or (status = 'ended' and ended_at is not null and ended_at >= started_at)
);
alter table public.office_home_assignments add constraint office_home_assignments_lifecycle check (
  (status = 'active' and ended_at is null) or (status = 'ended' and ended_at is not null and ended_at >= started_at)
);
alter table public.home_memberships add constraint home_memberships_lifecycle check (
  (status in ('active', 'pending') and ended_at is null)
  or (status in ('ended', 'revoked') and ended_at is not null and ended_at >= starts_at)
);
alter table public.home_memberships add constraint home_memberships_scope check (
  (access_scope = 'current_contract' and contract_id is not null and relationship_role in ('landlord', 'tenant'))
  or (access_scope = 'shared_history' and contract_id is null and relationship_role in ('landlord', 'tenant'))
  or (access_scope = 'repair_event' and relationship_role = 'repairer')
);
alter table public.home_memberships add constraint home_memberships_expiry check (expires_at is null or expires_at > starts_at);
alter table public.records add constraint records_pilot_scope check (
  (record_space = 'office_internal' and office_id is not null and contract_id is null)
  or (record_space = 'current_contract' and contract_id is not null)
  or (record_space = 'shared_history' and contract_id is null)
);
alter table public.invitations add constraint invitations_scope check (
  (invitation_kind = 'office_member' and office_id is not null and home_id is null and contract_id is null
    and intended_role in ('associate_broker', 'assistant'))
  or (invitation_kind = 'home_member' and office_id is not null and home_id is not null and contract_id is not null
    and intended_role in ('landlord', 'tenant'))
  or (invitation_kind = 'repair_event' and office_id is not null and home_id is not null and intended_role = 'repairer')
);
alter table public.invitations add constraint invitations_consumption check (
  ((accepted_at is null and accepted_by is null)
   or (accepted_at is not null and accepted_by is not null and accepted_at >= created_at and accepted_at < expires_at))
  and (revoked_at is null or accepted_at is null)
  and (revoked_at is null or revoked_at >= created_at)
);

create or replace function public.guard_relationship_update() returns trigger
language plpgsql set search_path = public
as $$
begin
  if old.status in ('ended', 'revoked') and (
    new.status is distinct from old.status or new.ended_at is distinct from old.ended_at
  ) then raise exception 'relation_ended'; end if;
  if (to_jsonb(new) - 'status' - 'ended_at') is distinct from (to_jsonb(old) - 'status' - 'ended_at') then
    raise exception 'immutable_relationship_identity';
  end if;
  return new;
end;
$$;
create trigger office_memberships_immutable_identity before update on public.office_memberships
  for each row execute function public.guard_relationship_update();
create trigger office_assignments_immutable_identity before update on public.office_home_assignments
  for each row execute function public.guard_relationship_update();
create trigger home_memberships_immutable_identity before update on public.home_memberships
  for each row execute function public.guard_relationship_update();

create or replace function public.guard_active_assignment() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.status = 'active' then
    -- Lock membership so a concurrent termination cannot race a new assignment.
    perform 1 from public.office_memberships membership
    where membership.office_id = new.office_id and membership.user_id = new.assigned_user_id
      and membership.status = 'active' and membership.ended_at is null and membership.started_at <= now()
    for share;
    if not found then raise exception 'relation_ended'; end if;
  end if;
  return new;
end;
$$;
create trigger office_assignments_active_member before insert or update on public.office_home_assignments
  for each row execute function public.guard_active_assignment();

create or replace function public.guard_contract_update() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.home_id is distinct from old.home_id
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at
    or new.contract_kind is distinct from old.contract_kind then
    raise exception 'immutable_contract_identity';
  end if;
  if old.status in ('ended', 'cancelled') and new.status is distinct from old.status then
    raise exception 'relation_ended';
  end if;
  return new;
end;
$$;
create trigger contracts_immutable_identity before update on public.contracts
  for each row execute function public.guard_contract_update();

create or replace function public.guard_record_update() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.home_id is distinct from old.home_id
    or new.office_id is distinct from old.office_id
    or new.contract_id is distinct from old.contract_id
    or new.record_space is distinct from old.record_space
    or new.record_kind is distinct from old.record_kind
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    or new.idempotency_key is distinct from old.idempotency_key then
    raise exception 'immutable_record_identity';
  end if;
  return new;
end;
$$;
create trigger records_immutable_identity before update on public.records
  for each row execute function public.guard_record_update();

create or replace function public.guard_invitation_update() returns trigger
language plpgsql set search_path = public
as $$
begin
  if (to_jsonb(new) - 'revoked_at' - 'accepted_at' - 'accepted_by')
    is distinct from (to_jsonb(old) - 'revoked_at' - 'accepted_at' - 'accepted_by') then
    raise exception 'immutable_invitation_identity';
  end if;
  if old.accepted_at is not null and (
    new.accepted_at is distinct from old.accepted_at or new.accepted_by is distinct from old.accepted_by
    or new.revoked_at is distinct from old.revoked_at
  ) then raise exception 'invitation_used'; end if;
  if old.revoked_at is not null and (
    new.revoked_at is distinct from old.revoked_at or new.accepted_at is distinct from old.accepted_at
    or new.accepted_by is distinct from old.accepted_by
  ) then raise exception 'invitation_revoked'; end if;
  return new;
end;
$$;
create trigger invitations_immutable_identity before update on public.invitations
  for each row execute function public.guard_invitation_update();

create or replace function public.guard_home_office_update() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.office_id is distinct from old.office_id
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'immutable_home_identity';
  end if;
  return new;
end;
$$;
create trigger homes_immutable_identity before update on public.homes
  for each row execute function public.guard_home_office_update();

-- A principal can see all active homes in their office, even with no active assignee.
create or replace function public.has_active_office_home_access(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.homes home
    join public.office_memberships membership on membership.office_id = home.office_id
    where home.id = p_home_id and home.status = 'active'
      and membership.user_id = auth.uid() and membership.status = 'active'
      and membership.ended_at is null and membership.started_at <= now()
      and (membership.office_role = 'principal_broker' or exists (
        select 1 from public.office_home_assignments assignment
        where assignment.home_id = home.id and assignment.office_id = home.office_id
          and assignment.assigned_user_id = auth.uid() and assignment.status = 'active'
          and assignment.ended_at is null and assignment.started_at <= now()
      ))
  );
$$;

create or replace function public.can_access_contract(p_contract_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.contracts contract join public.homes home on home.id = contract.home_id
    where contract.id = p_contract_id and home.status = 'active'
      and home.office_id is not null and contract.status = 'active'
      and (public.has_active_office_home_access(contract.home_id) or exists (
        select 1 from public.home_memberships membership
        where membership.contract_id = contract.id and membership.home_id = contract.home_id
          and membership.user_id = auth.uid() and membership.status = 'active'
          and membership.ended_at is null and membership.starts_at <= now()
          and (membership.expires_at is null or membership.expires_at > now())
          and membership.access_scope = 'current_contract'
          and membership.relationship_role in ('landlord', 'tenant')
      ))
  );
$$;

create or replace function public.has_active_home_access(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_active_office_home_access(p_home_id) or exists (
    select 1 from public.contracts contract
    where contract.home_id = p_home_id and public.can_access_contract(contract.id)
  );
$$;

create or replace function public.can_access_record(p_record_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.records record join public.homes home on home.id = record.home_id
    where record.id = p_record_id and home.status = 'active'
      and (record.office_id is null or record.office_id = home.office_id)
      and (
        (record.record_space = 'office_internal' and record.office_id = home.office_id
          and public.has_active_office_home_access(record.home_id))
        or (record.record_space = 'current_contract' and record.contract_id is not null
          and public.can_access_contract(record.contract_id) and exists (
            select 1 from public.contracts contract
            where contract.id = record.contract_id and contract.home_id = record.home_id
          ))
      )
  );
$$;

-- Shared authorization helper for later mutation RPCs. Account role alone grants no access.
create or replace function public.can_create_record(
  p_home_id uuid,
  p_office_id uuid,
  p_contract_id uuid,
  p_record_space text,
  p_record_kind text
) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.homes home
    where home.id = p_home_id and home.status = 'active' and home.office_id is not null
      and p_record_kind in ('note', 'photo', 'document', 'repair', 'schedule', 'task')
      and (
        (p_record_space = 'office_internal' and p_office_id = home.office_id and p_contract_id is null)
        or (p_record_space = 'current_contract' and (p_office_id is null or p_office_id = home.office_id)
          and p_contract_id is not null and exists (
            select 1 from public.contracts contract
            where contract.id = p_contract_id and contract.home_id = home.id and contract.status = 'active'
          ))
      )
      and (
        (public.has_active_office_home_access(home.id) and exists (
          select 1 from public.office_memberships membership
          where membership.office_id = home.office_id and membership.user_id = auth.uid()
            and membership.status = 'active' and membership.ended_at is null
            and (membership.office_role in ('principal_broker', 'associate_broker')
              or (membership.office_role = 'assistant' and p_record_kind in ('photo', 'document', 'schedule', 'task')))
        ))
        or (p_record_space = 'current_contract' and public.can_access_contract(p_contract_id)
          and p_record_kind in ('note', 'photo', 'document', 'repair') and exists (
            select 1 from public.home_memberships membership
            where membership.contract_id = p_contract_id and membership.home_id = home.id
              and membership.user_id = auth.uid() and membership.status = 'active'
              and membership.ended_at is null and membership.starts_at <= now()
              and (membership.expires_at is null or membership.expires_at > now())
              and membership.access_scope = 'current_contract'
              and membership.relationship_role in ('landlord', 'tenant')
          ))
      )
  );
$$;

drop policy if exists "office_assignments_select_member" on public.office_home_assignments;
create policy "office_assignments_select_authorized" on public.office_home_assignments
  for select to authenticated using (public.has_active_office_home_access(home_id));
drop policy if exists "home_memberships_select_related" on public.home_memberships;
create policy "home_memberships_select_authorized" on public.home_memberships
  for select to authenticated using (
    public.has_active_office_home_access(home_id)
    or (user_id = auth.uid() and status = 'active' and ended_at is null
      and contract_id is not null and public.can_access_contract(contract_id))
  );

revoke all on function public.guard_relationship_update() from public, anon, authenticated;
revoke all on function public.guard_record_update() from public, anon, authenticated;
revoke all on function public.guard_invitation_update() from public, anon, authenticated;
revoke all on function public.guard_home_office_update() from public, anon, authenticated;
revoke all on function public.guard_contract_update() from public, anon, authenticated;
revoke all on function public.guard_active_assignment() from public, anon, authenticated;
revoke all on function public.can_create_record(uuid, uuid, uuid, text, text) from public;
grant execute on function public.can_create_record(uuid, uuid, uuid, text, text) to authenticated;

commit;
