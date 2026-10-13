begin;

alter table public.invitations add column access_scope text;
alter table public.invitations add column relationship_expires_at timestamptz;
alter table public.invitations add constraint invitations_relationship_scope check (
  (invitation_kind = 'office_member' and access_scope is null and relationship_expires_at is null)
  or (invitation_kind = 'home_member' and access_scope = 'current_contract'
    and intended_role in ('landlord', 'tenant') and relationship_expires_at is null)
  or (invitation_kind = 'repair_event' and access_scope = 'repair_event'
    and intended_role = 'repairer' and relationship_expires_at is not null)
);

create or replace function public.create_relationship_invitation(
  p_home_id uuid,
  p_contract_id uuid,
  p_role text,
  p_scope text,
  p_token text,
  p_expires_at timestamptz,
  p_relationship_expires_at timestamptz
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_office_id uuid;
  v_invitation_id uuid;
  v_kind text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if char_length(p_token) < 32 or p_expires_at <= now()
    or p_expires_at > now() + interval '7 days' then raise exception 'invalid_input'; end if;

  select home.office_id into v_office_id
  from public.homes home
  join public.office_memberships membership on membership.office_id = home.office_id
  where home.id = p_home_id and home.status = 'active'
    and membership.user_id = v_user_id
    and membership.office_role in ('principal_broker', 'associate_broker')
    and membership.status = 'active' and membership.ended_at is null
    and membership.started_at <= now()
  for share of home, membership;
  if not found then raise exception 'permission_denied'; end if;

  if p_role in ('landlord', 'tenant') and p_scope = 'current_contract' then
    perform 1 from public.contracts contract
    where contract.id = p_contract_id and contract.home_id = p_home_id
      and contract.status = 'active' for share;
    if not found then raise exception 'relation_ended'; end if;
    if p_relationship_expires_at is not null then raise exception 'invalid_input'; end if;
    v_kind := 'home_member';
  elsif p_role = 'repairer' and p_scope = 'repair_event' then
    if p_relationship_expires_at is null or p_relationship_expires_at <= now()
      or p_relationship_expires_at > now() + interval '30 days'
    then raise exception 'invalid_input'; end if;
    if p_contract_id is not null and not exists (
      select 1 from public.contracts contract
      where contract.id = p_contract_id and contract.home_id = p_home_id
        and contract.status = 'active'
    ) then raise exception 'relation_ended'; end if;
    v_kind := 'repair_event';
  else
    raise exception 'invalid_input';
  end if;

  insert into public.invitations (
    token_hash, invitation_kind, office_id, home_id, contract_id,
    intended_role, access_scope, relationship_expires_at,
    invited_identifier_hash, created_by, expires_at
  ) values (
    encode(extensions.digest(p_token, 'sha256'), 'hex'), v_kind, v_office_id, p_home_id, p_contract_id,
    p_role, p_scope, p_relationship_expires_at,
    encode(extensions.digest('relationship:' || p_token, 'sha256'), 'hex'), v_user_id, p_expires_at
  ) returning id into v_invitation_id;

  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, office_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'invite', 'home_relationship', v_invitation_id,
    v_office_id, p_home_id, 'allowed', v_kind
  );
  return v_invitation_id;
end;
$$;

create or replace function public.accept_relationship_invitation(p_token text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.invitations%rowtype;
  v_membership_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if char_length(p_token) < 32 then raise exception 'invalid_input'; end if;

  select * into v_invitation from public.invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and invitation_kind in ('home_member', 'repair_event')
  for update;
  if not found then raise exception 'invalid_input'; end if;
  if v_invitation.revoked_at is not null then raise exception 'invitation_revoked'; end if;
  if v_invitation.accepted_at is not null then raise exception 'invitation_used'; end if;
  if v_invitation.expires_at <= now() then raise exception 'invitation_expired'; end if;

  if v_invitation.invitation_kind = 'home_member' then
    perform 1 from public.contracts contract
    where contract.id = v_invitation.contract_id
      and contract.home_id = v_invitation.home_id
      and contract.status = 'active' for share;
    if not found then raise exception 'relation_ended'; end if;
  elsif v_invitation.relationship_expires_at <= now() then
    raise exception 'invitation_expired';
  end if;

  insert into public.home_memberships (
    home_id, contract_id, user_id, relationship_role,
    status, access_scope, starts_at, expires_at
  ) values (
    v_invitation.home_id, v_invitation.contract_id, v_user_id, v_invitation.intended_role,
    'active', v_invitation.access_scope, now(), v_invitation.relationship_expires_at
  ) returning id into v_membership_id;

  update public.invitations set accepted_at = now(), accepted_by = v_user_id
  where id = v_invitation.id;
  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, office_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'accept_invitation', 'home_relationship', v_membership_id,
    v_invitation.office_id, v_invitation.home_id, 'allowed', v_invitation.access_scope
  );
  return v_membership_id;
end;
$$;

create or replace function public.preview_relationship_invitation(p_token text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
  v_office_name text;
  v_state text := 'ready';
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(p_token) < 32 then raise exception 'invalid_input'; end if;
  select * into v_invitation from public.invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and invitation_kind in ('home_member', 'repair_event');
  if not found then raise exception 'invalid_input'; end if;
  if v_invitation.revoked_at is not null then v_state := 'invitation_revoked';
  elsif v_invitation.accepted_at is not null then v_state := 'invitation_used';
  elsif v_invitation.expires_at <= now()
    or (v_invitation.relationship_expires_at is not null
      and v_invitation.relationship_expires_at <= now())
  then v_state := 'invitation_expired'; end if;
  select name into v_office_name from public.offices where id = v_invitation.office_id;
  return jsonb_build_object(
    'officeName', v_office_name,
    'role', v_invitation.intended_role,
    'scope', v_invitation.access_scope,
    'state', v_state
  );
end;
$$;

create or replace function public.end_home_relationship(p_membership_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.home_memberships%rowtype;
  v_office_id uuid;
  v_can_manage boolean := false;
begin
  select * into v_membership from public.home_memberships
  where id = p_membership_id for update;
  if not found then raise exception 'invalid_input'; end if;
  if v_membership.status <> 'active' or v_membership.ended_at is not null
    then raise exception 'relation_ended'; end if;
  select office_id into v_office_id from public.homes where id = v_membership.home_id;
  select exists (
    select 1 from public.office_memberships membership
    where membership.office_id = v_office_id and membership.user_id = v_user_id
      and membership.office_role in ('principal_broker', 'associate_broker')
      and membership.status = 'active' and membership.ended_at is null
      and membership.started_at <= now()
  ) into v_can_manage;
  if v_user_id is distinct from v_membership.user_id and not v_can_manage
    then raise exception 'permission_denied'; end if;
  update public.home_memberships
    set status = 'ended', ended_at = now()
    where id = v_membership.id;
  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, office_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'end_relationship', 'home_relationship', v_membership.id,
    v_office_id, v_membership.home_id, 'allowed', 'relationship_ended'
  );
end;
$$;

revoke all on function public.create_relationship_invitation(uuid, uuid, text, text, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.accept_relationship_invitation(text) from public, anon, authenticated;
revoke all on function public.preview_relationship_invitation(text) from public, anon, authenticated;
revoke all on function public.end_home_relationship(uuid) from public, anon, authenticated;
grant execute on function public.create_relationship_invitation(uuid, uuid, text, text, text, timestamptz, timestamptz) to authenticated;
grant execute on function public.accept_relationship_invitation(text) to authenticated;
grant execute on function public.preview_relationship_invitation(text) to authenticated;
grant execute on function public.end_home_relationship(uuid) to authenticated;

commit;
