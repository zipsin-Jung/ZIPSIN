begin;

-- office_home_assignments remains historical data. Official access no longer
-- reads it, creates it, or exposes its assignment RPCs.
create or replace function public.can_access_office_home(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.homes home
    join public.office_memberships membership
      on membership.office_id = home.office_id
    where home.id = p_home_id
      and home.status = 'active'
      and membership.user_id = auth.uid()
      and membership.office_role in ('principal_broker', 'associate_broker', 'assistant')
      and membership.status = 'active'
      and membership.ended_at is null
      and membership.started_at <= now()
  );
$$;

create or replace function public.can_write_office_home(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.can_access_office_home(p_home_id);
$$;

-- Compatibility name retained for older policies and application versions.
create or replace function public.has_active_office_home_access(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.can_access_office_home(p_home_id);
$$;

create or replace function public.can_access_contract(p_contract_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.contracts contract
    join public.homes home on home.id = contract.home_id
    where contract.id = p_contract_id
      and contract.status = 'active'
      and home.status = 'active'
      and (
        public.can_access_office_home(contract.home_id)
        or exists (
          select 1
          from public.home_memberships membership
          where membership.contract_id = contract.id
            and membership.home_id = contract.home_id
            and membership.user_id = auth.uid()
            and membership.relationship_role in ('landlord', 'tenant')
            and membership.access_scope = 'current_contract'
            and membership.status = 'active'
            and membership.ended_at is null
            and membership.starts_at <= now()
            and (membership.expires_at is null or membership.expires_at > now())
        )
      )
  );
$$;

create or replace function public.has_active_home_access(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select public.can_access_office_home(p_home_id) or exists (
    select 1
    from public.contracts contract
    where contract.home_id = p_home_id
      and public.can_access_contract(contract.id)
  );
$$;

create or replace function public.can_access_record(p_record_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.records record
    join public.homes home on home.id = record.home_id
    where record.id = p_record_id
      and home.status = 'active'
      and (record.office_id is null or record.office_id = home.office_id)
      and (
        (record.record_space = 'office_internal'
          and record.office_id = home.office_id
          and public.can_access_office_home(record.home_id))
        or (record.record_space = 'current_contract'
          and record.contract_id is not null
          and public.can_access_contract(record.contract_id)
          and exists (
            select 1 from public.contracts contract
            where contract.id = record.contract_id
              and contract.home_id = record.home_id
          ))
      )
  );
$$;

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
    select 1
    from public.homes home
    where home.id = p_home_id
      and home.status = 'active'
      and home.office_id is not null
      and p_record_kind in ('note', 'photo', 'document', 'repair', 'schedule', 'task')
      and (
        (p_record_space = 'office_internal'
          and p_office_id = home.office_id
          and p_contract_id is null)
        or (p_record_space = 'current_contract'
          and (p_office_id is null or p_office_id = home.office_id)
          and p_contract_id is not null
          and exists (
            select 1 from public.contracts contract
            where contract.id = p_contract_id
              and contract.home_id = home.id
              and contract.status = 'active'
          ))
      )
      and (
        (public.can_write_office_home(home.id) and exists (
          select 1 from public.office_memberships membership
          where membership.office_id = home.office_id
            and membership.user_id = auth.uid()
            and membership.status = 'active'
            and membership.ended_at is null
            and membership.started_at <= now()
            and (membership.office_role in ('principal_broker', 'associate_broker')
              or (membership.office_role = 'assistant'
                and p_record_kind in ('photo', 'document', 'schedule', 'task')))
        ))
        or (p_record_space = 'current_contract'
          and public.can_access_contract(p_contract_id)
          and p_record_kind in ('note', 'photo', 'document', 'repair')
          and exists (
            select 1 from public.home_memberships membership
            where membership.contract_id = p_contract_id
              and membership.home_id = home.id
              and membership.user_id = auth.uid()
              and membership.relationship_role in ('landlord', 'tenant')
              and membership.access_scope = 'current_contract'
              and membership.status = 'active'
              and membership.ended_at is null
              and membership.starts_at <= now()
              and (membership.expires_at is null or membership.expires_at > now())
          ))
      )
  );
$$;

create or replace function public.create_home_for_office(
  p_office_id uuid,
  p_address_line1 text,
  p_address_detail text,
  p_home_label text,
  p_idempotency_key uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_home_id uuid;
  v_existing public.homes%rowtype;
  v_address text := btrim(p_address_line1);
  v_detail text := nullif(btrim(p_address_detail), '');
  v_label text := nullif(btrim(p_home_label), '');
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_office_id is null or p_idempotency_key is null or v_address is null
    or char_length(v_address) not between 5 and 200
    or char_length(v_detail) > 120 or char_length(v_label) > 80
    or v_address ~ '[[:cntrl:]]' or v_detail ~ '[[:cntrl:]]' or v_label ~ '[[:cntrl:]]'
  then raise exception 'invalid_input'; end if;

  perform 1 from public.office_memberships membership
  where membership.office_id = p_office_id
    and membership.user_id = v_user_id
    and membership.office_role = 'principal_broker'
    and membership.status = 'active'
    and membership.ended_at is null
    and membership.started_at <= now()
  for share;
  if not found then raise exception 'permission_denied'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_idempotency_key::text, 0));
  select * into v_existing from public.homes
  where created_by = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.office_id is distinct from p_office_id
      or v_existing.address_line1 is distinct from v_address
      or v_existing.address_detail is distinct from v_detail
      or v_existing.home_label is distinct from v_label
    then raise exception 'conflict'; end if;
    if v_existing.status <> 'active' then raise exception 'relation_ended'; end if;
    return v_existing.id;
  end if;

  insert into public.homes (
    office_id, address_line1, address_detail, home_label,
    address_fingerprint, created_by, idempotency_key
  ) values (
    p_office_id, v_address, v_detail, v_label,
    encode(extensions.digest(lower(v_address) || ':' || coalesce(v_detail, ''), 'sha256'), 'hex'),
    v_user_id, p_idempotency_key
  ) returning id into v_home_id;

  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id,
    office_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'create', 'home', v_home_id,
    p_office_id, v_home_id, 'allowed', 'home_created_for_office'
  );
  return v_home_id;
end;
$$;

create or replace function public.create_home_record(
  p_home_id uuid, p_office_id uuid, p_contract_id uuid, p_space text, p_kind text,
  p_title text, p_body text, p_idempotency_key uuid, p_task_due_at timestamptz, p_task_assigned_to uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_record_id uuid;
  v_existing public.records%rowtype;
  v_title text := btrim(p_title);
  v_body text := nullif(btrim(p_body), '');
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or char_length(v_title) not between 1 and 120
    or char_length(v_body) > 10000 then raise exception 'invalid_input'; end if;
  if not public.can_create_record(p_home_id, p_office_id, p_contract_id, p_space, p_kind)
    then raise exception 'permission_denied'; end if;
  if p_kind = 'task' and (p_space <> 'office_internal' or p_office_id is null)
    then raise exception 'invalid_input'; end if;
  if p_kind <> 'task' and (p_task_due_at is not null or p_task_assigned_to is not null)
    then raise exception 'invalid_input'; end if;
  if p_task_assigned_to is not null and not exists (
    select 1 from public.office_memberships membership
    where membership.office_id = p_office_id
      and membership.user_id = p_task_assigned_to
      and membership.status = 'active'
      and membership.ended_at is null
      and membership.started_at <= now()
  ) then raise exception 'relation_ended'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_idempotency_key::text, 0));
  select * into v_existing from public.records
  where created_by = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.home_id is distinct from p_home_id
      or v_existing.office_id is distinct from p_office_id
      or v_existing.contract_id is distinct from p_contract_id
      or v_existing.record_space is distinct from p_space
      or v_existing.record_kind is distinct from p_kind
      or v_existing.title is distinct from v_title
      or v_existing.body is distinct from v_body
    then raise exception 'conflict'; end if;
    return v_existing.id;
  end if;

  insert into public.records (
    home_id, office_id, contract_id, record_space, record_kind, title, body,
    created_by, idempotency_key, task_status, task_due_at, task_assigned_to
  ) values (
    p_home_id, p_office_id, p_contract_id, p_space, p_kind, v_title, v_body,
    v_user_id, p_idempotency_key, case when p_kind = 'task' then 'todo' else null end,
    p_task_due_at, p_task_assigned_to
  ) returning id into v_record_id;

  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, office_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'create', 'record', v_record_id, p_office_id, p_home_id, 'allowed', 'home_record_created'
  );
  return v_record_id;
end;
$$;

create or replace function public.update_task_state(p_record_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_record public.records%rowtype;
begin
  if p_status not in ('todo', 'in_progress', 'done') then raise exception 'invalid_input'; end if;
  select * into v_record from public.records
  where id = p_record_id and record_kind = 'task' for update;
  if not found then raise exception 'invalid_input'; end if;
  if v_record.office_id is null or v_record.record_space <> 'office_internal'
    or not public.can_write_office_home(v_record.home_id)
  then raise exception 'permission_denied'; end if;
  update public.records set task_status = p_status, updated_at = now() where id = v_record.id;
  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, office_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'update_task_state', 'record', v_record.id,
    v_record.office_id, v_record.home_id, 'allowed', p_status
  );
end;
$$;

drop policy if exists "homes_update_authorized" on public.homes;
create policy "homes_update_authorized" on public.homes
  for update using (public.can_write_office_home(id))
  with check (public.can_write_office_home(id));

drop policy if exists "office_assignments_select_authorized" on public.office_home_assignments;
drop policy if exists "office_assignments_select_member" on public.office_home_assignments;

revoke all on function public.can_access_office_home(uuid) from public, anon, authenticated;
revoke all on function public.can_write_office_home(uuid) from public, anon, authenticated;
grant execute on function public.can_access_office_home(uuid) to authenticated;
grant execute on function public.can_write_office_home(uuid) to authenticated;

revoke all on function public.assign_office_member_to_home(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.end_office_home_assignment(uuid) from public, anon, authenticated;

commit;
