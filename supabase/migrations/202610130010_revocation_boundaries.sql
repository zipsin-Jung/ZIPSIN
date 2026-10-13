begin;

create or replace function public.has_current_chat_peer(p_room_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.chat_room_memberships peer
    where peer.room_id = p_room_id
      and peer.user_id <> auth.uid()
      and peer.status = 'active'
      and peer.ended_at is null
      and peer.joined_at <= now()
      and public.can_chat_with_user(peer.user_id)
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
        (room.room_type = 'direct' and public.has_current_chat_peer(room.id) and not exists (
          select 1 from public.chat_blocks block
          join public.chat_room_memberships other_member on other_member.room_id = room.id
            and other_member.user_id <> auth.uid() and other_member.status = 'active' and other_member.ended_at is null
          where block.ended_at is null and (
            (block.blocker_user_id = auth.uid() and block.blocked_user_id = other_member.user_id)
            or (block.blocked_user_id = auth.uid() and block.blocker_user_id = other_member.user_id)
          )
        ))
        or (room.room_type = 'group' and public.has_current_chat_peer(room.id))
        or (room.room_type = 'support' and (
          room.created_by = auth.uid() or exists (
            select 1 from public.support_authorizations authorization
            where authorization.user_id = auth.uid() and authorization.revoked_at is null
              and authorization.authorization_role = 'representative'
          )
        ))
        or (room.room_type = 'office_internal' and exists (
          select 1 from public.office_memberships membership
          where membership.office_id = room.office_id and membership.user_id = auth.uid()
            and membership.status = 'active' and membership.ended_at is null and membership.started_at <= now()
        ))
        or (room.room_type = 'home_shared' and exists (
          select 1 from public.contracts contract
          where contract.id = room.contract_id and contract.home_id = room.home_id and contract.status = 'active'
            and (exists (
              select 1 from public.homes home join public.office_memberships office_member on office_member.office_id = home.office_id
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
              select 1 from public.homes home join public.office_memberships office_member on office_member.office_id = home.office_id
              where home.id = room.home_id and office_member.user_id = auth.uid()
                and office_member.status = 'active' and office_member.ended_at is null and office_member.started_at <= now()
            ) or exists (
              select 1 from public.home_memberships participant
              where participant.home_id = room.home_id and participant.user_id = auth.uid()
                and participant.status = 'active' and participant.ended_at is null and participant.starts_at <= now()
                and (participant.expires_at is null or participant.expires_at > now())
                and (participant.id = room.relationship_id or (
                  participant.contract_id = room.contract_id and participant.relationship_role in ('landlord', 'tenant')
                ))
            ))
        ))
      )
  );
$$;

revoke all on function public.has_current_chat_peer(uuid) from public, anon, authenticated;

commit;
