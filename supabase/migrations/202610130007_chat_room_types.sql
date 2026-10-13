begin;

alter table public.chat_rooms
  add column direct_key text unique,
  add column relation_key text unique,
  add column relationship_id uuid references public.home_memberships(id),
  add constraint chat_rooms_type_check check (
    room_type in ('direct', 'group', 'home_shared', 'office_internal', 'repair_event', 'support')
  );

create or replace function public.can_chat_with_user(p_other_user_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select p_other_user_id is distinct from auth.uid() and (
    exists (
      select 1 from public.office_memberships mine
      join public.office_memberships other on other.office_id = mine.office_id
      where mine.user_id = auth.uid() and other.user_id = p_other_user_id
        and mine.status = 'active' and mine.ended_at is null and mine.started_at <= now()
        and other.status = 'active' and other.ended_at is null and other.started_at <= now()
    )
    or exists (
      select 1 from public.home_memberships mine
      join public.home_memberships other on other.home_id = mine.home_id
        and other.contract_id is not distinct from mine.contract_id
      where mine.user_id = auth.uid() and other.user_id = p_other_user_id
        and mine.status = 'active' and mine.ended_at is null and mine.starts_at <= now()
        and (mine.expires_at is null or mine.expires_at > now())
        and other.status = 'active' and other.ended_at is null and other.starts_at <= now()
        and (other.expires_at is null or other.expires_at > now())
    )
    or exists (
      select 1 from public.homes home
      join public.office_memberships office_member on office_member.office_id = home.office_id
      join public.home_memberships relation on relation.home_id = home.id
      where ((office_member.user_id = auth.uid() and relation.user_id = p_other_user_id)
          or (office_member.user_id = p_other_user_id and relation.user_id = auth.uid()))
        and office_member.status = 'active' and office_member.ended_at is null and office_member.started_at <= now()
        and relation.status = 'active' and relation.ended_at is null and relation.starts_at <= now()
        and (relation.expires_at is null or relation.expires_at > now())
    )
  );
$$;

create or replace function public.can_access_chat_room(p_room_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.chat_rooms room
    join public.chat_room_memberships room_member on room_member.room_id = room.id
    where room.id = p_room_id and room.status = 'active' and room.closed_at is null
      and room_member.user_id = auth.uid() and room_member.status = 'active'
      and room_member.ended_at is null and room_member.joined_at <= now()
      and (
        room.room_type in ('direct', 'group', 'support')
        or (room.room_type = 'office_internal' and exists (
          select 1 from public.office_memberships membership
          where membership.office_id = room.office_id and membership.user_id = auth.uid()
            and membership.status = 'active' and membership.ended_at is null and membership.started_at <= now()
        ))
        or (room.room_type = 'home_shared' and exists (
          select 1 from public.contracts contract
          where contract.id = room.contract_id and contract.home_id = room.home_id and contract.status = 'active'
            and (exists (
              select 1 from public.homes home
              join public.office_memberships office_member on office_member.office_id = home.office_id
              where home.id = room.home_id and office_member.user_id = auth.uid()
                and office_member.status = 'active' and office_member.ended_at is null and office_member.started_at <= now()
            ) or exists (
              select 1 from public.home_memberships relationship
              where relationship.home_id = room.home_id and relationship.contract_id = room.contract_id
                and relationship.user_id = auth.uid() and relationship.relationship_role in ('landlord', 'tenant')
                and relationship.status = 'active' and relationship.ended_at is null and relationship.starts_at <= now()
                and (relationship.expires_at is null or relationship.expires_at > now())
            ))
        ))
        or (room.room_type = 'repair_event' and exists (
          select 1 from public.home_memberships relationship
          where relationship.id = room.relationship_id and relationship.home_id = room.home_id
            and relationship.relationship_role = 'repairer' and relationship.access_scope = 'repair_event'
            and relationship.status = 'active' and relationship.ended_at is null
            and relationship.starts_at <= now() and relationship.expires_at > now()
            and (exists (
              select 1 from public.homes home
              join public.office_memberships office_member on office_member.office_id = home.office_id
              where home.id = room.home_id and office_member.user_id = auth.uid()
                and office_member.status = 'active' and office_member.ended_at is null and office_member.started_at <= now()
            ) or exists (
              select 1 from public.home_memberships participant
              where participant.home_id = room.home_id and participant.user_id = auth.uid()
                and participant.status = 'active' and participant.ended_at is null and participant.starts_at <= now()
                and (participant.expires_at is null or participant.expires_at > now())
                and (participant.id = room.relationship_id or (
                  participant.contract_id = room.contract_id
                  and participant.relationship_role in ('landlord', 'tenant')
                ))
            ))
        ))
      )
  );
$$;

create or replace function public.create_direct_room(p_other_user_id uuid) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_key text;
  v_room_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.can_chat_with_user(p_other_user_id) then raise exception 'permission_denied'; end if;
  v_key := least(v_user_id::text, p_other_user_id::text) || ':' || greatest(v_user_id::text, p_other_user_id::text);
  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));
  insert into public.chat_rooms (room_type, direct_key, created_by)
    values ('direct', v_key, v_user_id)
    on conflict (direct_key) do update set direct_key = excluded.direct_key
    returning id into v_room_id;
  insert into public.chat_room_memberships (room_id, user_id, membership_role)
    values (v_room_id, v_user_id, 'owner'), (v_room_id, p_other_user_id, 'member')
    on conflict (room_id, user_id) where status = 'active' and ended_at is null do nothing;
  return v_room_id;
end;
$$;

create or replace function public.create_group_room(p_title text, p_member_ids uuid[]) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member_id uuid;
  v_room_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if btrim(p_title) = '' or char_length(btrim(p_title)) > 80
    or cardinality(p_member_ids) < 1 or cardinality(p_member_ids) > 49
    or cardinality(p_member_ids) <> (select count(distinct value) from unnest(p_member_ids) value)
  then raise exception 'invalid_input'; end if;
  foreach v_member_id in array p_member_ids loop
    if not public.can_chat_with_user(v_member_id) then raise exception 'permission_denied'; end if;
  end loop;
  insert into public.chat_rooms (room_type, title, created_by)
    values ('group', btrim(p_title), v_user_id) returning id into v_room_id;
  insert into public.chat_room_memberships (room_id, user_id, membership_role)
    values (v_room_id, v_user_id, 'owner');
  insert into public.chat_room_memberships (room_id, user_id)
    select v_room_id, value from unnest(p_member_ids) value;
  return v_room_id;
end;
$$;

create or replace function public.create_relationship_room(
  p_room_type text,
  p_office_id uuid,
  p_home_id uuid,
  p_contract_id uuid,
  p_relationship_id uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_home_office_id uuid;
  v_key text;
  v_room_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_room_type = 'office_internal' then
    perform 1 from public.office_memberships membership
      where membership.office_id = p_office_id and membership.user_id = v_user_id
        and membership.status = 'active' and membership.ended_at is null and membership.started_at <= now();
    if not found then raise exception 'permission_denied'; end if;
    v_key := 'office:' || p_office_id::text;
  elsif p_room_type in ('home_shared', 'repair_event') then
    select office_id into v_home_office_id from public.homes where id = p_home_id and status = 'active';
    perform 1 from public.office_memberships membership
      where membership.office_id = v_home_office_id and membership.user_id = v_user_id
        and membership.status = 'active' and membership.ended_at is null and membership.started_at <= now();
    if not found then raise exception 'permission_denied'; end if;
    if p_room_type = 'home_shared' then
      perform 1 from public.contracts contract
        where contract.id = p_contract_id and contract.home_id = p_home_id and contract.status = 'active';
      if not found then raise exception 'relation_ended'; end if;
      v_key := 'home:' || p_home_id::text || ':contract:' || p_contract_id::text;
    else
      perform 1 from public.home_memberships relationship
        where relationship.id = p_relationship_id and relationship.home_id = p_home_id
          and relationship.contract_id is not distinct from p_contract_id
          and relationship.relationship_role = 'repairer' and relationship.access_scope = 'repair_event'
          and relationship.status = 'active' and relationship.ended_at is null
          and relationship.starts_at <= now() and relationship.expires_at > now();
      if not found then raise exception 'relation_ended'; end if;
      v_key := 'repair:' || p_relationship_id::text;
    end if;
  else
    raise exception 'invalid_input';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));
  insert into public.chat_rooms (room_type, office_id, home_id, contract_id, relationship_id, relation_key, created_by)
    values (p_room_type, coalesce(p_office_id, v_home_office_id), p_home_id, p_contract_id, p_relationship_id, v_key, v_user_id)
    on conflict (relation_key) do update set relation_key = excluded.relation_key
    returning id into v_room_id;

  if p_room_type = 'office_internal' then
    insert into public.chat_room_memberships (room_id, user_id, membership_role)
      select v_room_id, membership.user_id, case when membership.user_id = v_user_id then 'owner' else 'member' end
      from public.office_memberships membership where membership.office_id = p_office_id
        and membership.status = 'active' and membership.ended_at is null and membership.started_at <= now()
      on conflict (room_id, user_id) where status = 'active' and ended_at is null do nothing;
  else
    insert into public.chat_room_memberships (room_id, user_id, membership_role)
      select v_room_id, membership.user_id, case when membership.user_id = v_user_id then 'owner' else 'member' end
      from public.office_memberships membership where membership.office_id = v_home_office_id
        and membership.status = 'active' and membership.ended_at is null and membership.started_at <= now()
      on conflict (room_id, user_id) where status = 'active' and ended_at is null do nothing;
    insert into public.chat_room_memberships (room_id, user_id)
      select v_room_id, relationship.user_id from public.home_memberships relationship
      where relationship.home_id = p_home_id and relationship.status = 'active'
        and relationship.ended_at is null and relationship.starts_at <= now()
        and (relationship.expires_at is null or relationship.expires_at > now())
        and ((p_room_type = 'home_shared' and relationship.contract_id = p_contract_id and relationship.relationship_role in ('landlord', 'tenant'))
          or (p_room_type = 'repair_event' and (
            relationship.id = p_relationship_id or (
              relationship.contract_id = p_contract_id
              and relationship.relationship_role in ('landlord', 'tenant')
            )
          )))
      on conflict (room_id, user_id) where status = 'active' and ended_at is null do nothing;
  end if;
  return v_room_id;
end;
$$;

create or replace function public.invite_chat_member(p_room_id uuid, p_user_id uuid) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership_id uuid;
begin
  perform 1 from public.chat_room_memberships owner_membership
    join public.chat_rooms room on room.id = owner_membership.room_id
    where owner_membership.room_id = p_room_id and owner_membership.user_id = v_user_id
      and owner_membership.membership_role = 'owner' and owner_membership.status = 'active'
      and owner_membership.ended_at is null and room.room_type = 'group' and room.status = 'active';
  if not found then raise exception 'permission_denied'; end if;
  if not public.can_chat_with_user(p_user_id) then raise exception 'permission_denied'; end if;
  insert into public.chat_room_memberships (room_id, user_id)
    values (p_room_id, p_user_id) returning id into v_membership_id;
  return v_membership_id;
end;
$$;

create or replace function public.leave_chat_room(p_room_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  update public.chat_room_memberships
    set status = 'ended', ended_at = now()
    where room_id = p_room_id and user_id = v_user_id
      and status = 'active' and ended_at is null;
  if not found then raise exception 'relation_ended'; end if;
end;
$$;

revoke all on function public.can_chat_with_user(uuid) from public, anon, authenticated;
revoke all on function public.create_direct_room(uuid) from public, anon, authenticated;
revoke all on function public.create_group_room(text, uuid[]) from public, anon, authenticated;
revoke all on function public.create_relationship_room(text, uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.invite_chat_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public.leave_chat_room(uuid) from public, anon, authenticated;
grant execute on function public.can_chat_with_user(uuid) to authenticated;
grant execute on function public.create_direct_room(uuid) to authenticated;
grant execute on function public.create_group_room(text, uuid[]) to authenticated;
grant execute on function public.create_relationship_room(text, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.invite_chat_member(uuid, uuid) to authenticated;
grant execute on function public.leave_chat_room(uuid) to authenticated;

commit;
