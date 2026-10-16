-- 계약 종료와 사무소 구성원 내보내기.
-- 기록은 지우지 않고 상태만 끝냄으로 바꿔 사람의 접근만 끊습니다.
begin;

create or replace function public.end_active_contract(p_contract_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_contract public.contracts%rowtype;
  v_office_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_contract_id is null then raise exception 'invalid_input'; end if;

  select * into v_contract from public.contracts contract
  where contract.id = p_contract_id
  for update;
  if not found then raise exception 'invalid_input'; end if;
  if v_contract.status <> 'active' then raise exception 'relation_ended'; end if;

  select home.office_id into v_office_id from public.homes home
  where home.id = v_contract.home_id and home.office_id is not null;
  if v_office_id is null then raise exception 'permission_denied'; end if;

  perform 1 from public.office_memberships membership
  where membership.office_id = v_office_id
    and membership.user_id = v_user_id
    and membership.office_role in ('principal_broker', 'associate_broker')
    and membership.status = 'active'
    and membership.ended_at is null
    and membership.started_at <= now()
  for share;
  if not found then raise exception 'permission_denied'; end if;

  update public.home_memberships
    set status = 'ended', ended_at = now()
    where contract_id = v_contract.id
      and status in ('pending', 'active')
      and ended_at is null;

  update public.invitations
    set revoked_at = now()
    where contract_id = v_contract.id
      and accepted_at is null
      and revoked_at is null;

  update public.contracts
    set status = 'ended', updated_at = now()
    where id = v_contract.id;

  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, office_id, home_id, outcome, reason_code
  ) values (
    v_user_id, 'end_contract', 'contract', v_contract.id, v_office_id, v_contract.home_id, 'allowed', 'contract_ended'
  );
end;
$$;

create or replace function public.end_office_membership(p_membership_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_target public.office_memberships%rowtype;
  v_remaining_principals integer;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_membership_id is null then raise exception 'invalid_input'; end if;

  select * into v_target from public.office_memberships membership
  where membership.id = p_membership_id
  for update;
  if not found then raise exception 'invalid_input'; end if;
  if v_target.status <> 'active' or v_target.ended_at is not null then raise exception 'relation_ended'; end if;

  perform 1 from public.office_memberships membership
  where membership.office_id = v_target.office_id
    and membership.user_id = v_user_id
    and membership.office_role = 'principal_broker'
    and membership.status = 'active'
    and membership.ended_at is null
    and membership.started_at <= now()
  for share;
  if not found then raise exception 'permission_denied'; end if;

  if v_target.office_role = 'principal_broker' then
    select count(*) into v_remaining_principals from public.office_memberships membership
    where membership.office_id = v_target.office_id
      and membership.office_role = 'principal_broker'
      and membership.status = 'active'
      and membership.ended_at is null
      and membership.id <> v_target.id;
    if v_remaining_principals = 0 then raise exception 'last_principal'; end if;
  end if;

  update public.office_memberships
    set status = 'ended', ended_at = now()
    where id = v_target.id;

  update public.office_home_assignments
    set status = 'ended', ended_at = now()
    where office_id = v_target.office_id
      and assigned_user_id = v_target.user_id
      and status = 'active';

  insert into public.access_audit_events (
    actor_user_id, action, resource_type, resource_id, office_id, outcome, reason_code
  ) values (
    v_user_id, 'end_office_membership', 'office_membership', v_target.id, v_target.office_id, 'allowed', 'office_membership_ended'
  );
end;
$$;

revoke all on function public.end_active_contract(uuid) from public, anon, authenticated;
revoke all on function public.end_office_membership(uuid) from public, anon, authenticated;
grant execute on function public.end_active_contract(uuid) to authenticated;
grant execute on function public.end_office_membership(uuid) to authenticated;

commit;
