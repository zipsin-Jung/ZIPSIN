begin;

create table public.chat_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id),
  blocked_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check (blocker_user_id <> blocked_user_id)
);
create unique index chat_blocks_one_active on public.chat_blocks(blocker_user_id, blocked_user_id) where ended_at is null;

create table public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id),
  room_id uuid not null references public.chat_rooms(id),
  message_id bigint not null references public.chat_messages(id),
  reason_code text not null check (reason_code in ('spam', 'harassment', 'privacy', 'fraud', 'other')),
  detail text check (detail is null or char_length(detail) <= 1000),
  status text not null default 'received' check (status in ('received', 'reviewing', 'resolved')),
  created_at timestamptz not null default now(),
  unique (reporter_user_id, message_id)
);

create table public.support_identities (
  id uuid primary key,
  identity_code text not null unique,
  display_name text not null,
  is_official boolean not null default true check (is_official),
  created_at timestamptz not null default now()
);
insert into public.support_identities (id, identity_code, display_name)
values ('00000000-0000-4000-8000-00000000005a', 'zipsin_support', '집신 고객지원');

create table public.support_authorizations (
  id uuid primary key default gen_random_uuid(),
  support_identity_id uuid not null references public.support_identities(id),
  user_id uuid not null references auth.users(id),
  authorization_role text not null check (authorization_role = 'representative'),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index support_authorizations_one_active_representative
  on public.support_authorizations(support_identity_id, authorization_role) where revoked_at is null;

alter table public.chat_room_memberships add column notifications_muted boolean not null default false;
alter table public.chat_rooms add column support_status text check (support_status in ('waiting', 'answered', 'resolved'));
alter table public.chat_messages
  add column sender_kind text not null default 'user' check (sender_kind in ('user', 'support')),
  add column support_identity_id uuid references public.support_identities(id),
  add constraint chat_messages_sender_identity check (
    (sender_kind = 'user' and support_identity_id is null)
    or (sender_kind = 'support' and support_identity_id is not null)
  );

alter table public.chat_blocks enable row level security;
alter table public.chat_reports enable row level security;
alter table public.support_identities enable row level security;
alter table public.support_authorizations enable row level security;
create policy chat_blocks_select_self on public.chat_blocks for select to authenticated
  using (blocker_user_id = auth.uid());
create policy chat_reports_select_self on public.chat_reports for select to authenticated
  using (reporter_user_id = auth.uid());
create policy support_identities_read on public.support_identities for select to authenticated using (is_official);
create policy support_authorizations_select_self on public.support_authorizations for select to authenticated
  using (user_id = auth.uid() and revoked_at is null);

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
        (room.room_type = 'direct' and not exists (
          select 1 from public.chat_blocks block
          join public.chat_room_memberships other_member on other_member.room_id = room.id
            and other_member.user_id <> auth.uid() and other_member.status = 'active' and other_member.ended_at is null
          where block.ended_at is null and (
            (block.blocker_user_id = auth.uid() and block.blocked_user_id = other_member.user_id)
            or (block.blocked_user_id = auth.uid() and block.blocker_user_id = other_member.user_id)
          )
        ))
        or room.room_type = 'group'
        or (room.room_type = 'support' and (
          room.created_by = auth.uid() or exists (
            select 1 from public.support_authorizations authz
            where authz.user_id = auth.uid() and authz.revoked_at is null
              and authz.authorization_role = 'representative'
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

create or replace function public.block_direct_user(p_other_user_id uuid) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_block_id uuid;
begin
  if v_user_id is null or p_other_user_id = v_user_id then raise exception 'invalid_input'; end if;
  perform 1 from public.chat_rooms room
    join public.chat_room_memberships mine on mine.room_id = room.id and mine.user_id = v_user_id
    join public.chat_room_memberships other on other.room_id = room.id and other.user_id = p_other_user_id
    where room.room_type = 'direct' and room.status = 'active'
      and mine.status = 'active' and mine.ended_at is null and other.status = 'active' and other.ended_at is null;
  if not found then raise exception 'permission_denied'; end if;
  insert into public.chat_blocks (blocker_user_id, blocked_user_id)
    values (v_user_id, p_other_user_id)
    on conflict (blocker_user_id, blocked_user_id) where ended_at is null
    do update set blocked_user_id = excluded.blocked_user_id
    returning id into v_block_id;
  return v_block_id;
end;
$$;

create or replace function public.report_chat_message(p_message_id bigint, p_reason_code text, p_detail text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_room_id uuid; v_report_id uuid;
begin
  select message.room_id into v_room_id from public.chat_messages message where message.id = p_message_id;
  if not found or not public.can_access_chat_room(v_room_id) then raise exception 'permission_denied'; end if;
  if p_reason_code not in ('spam', 'harassment', 'privacy', 'fraud', 'other')
    or char_length(coalesce(p_detail, '')) > 1000 then raise exception 'invalid_input'; end if;
  insert into public.chat_reports (reporter_user_id, room_id, message_id, reason_code, detail)
    values (v_user_id, v_room_id, p_message_id, p_reason_code, nullif(btrim(p_detail), ''))
    returning id into v_report_id;
  return v_report_id;
end;
$$;

create or replace function public.sync_support_representative_membership() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.revoked_at is null then
    insert into public.chat_room_memberships (room_id, user_id)
      select room.id, new.user_id from public.chat_rooms room where room.room_type = 'support' and room.status = 'active'
      on conflict (room_id, user_id) where status = 'active' and ended_at is null do nothing;
  end if;
  return new;
end;
$$;
create trigger support_authorization_memberships after insert on public.support_authorizations
  for each row execute function public.sync_support_representative_membership();

create or replace function public.open_support_conversation() returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_room_id uuid; v_key text; v_identity_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  select id into v_identity_id from public.support_identities where identity_code = 'zipsin_support' and is_official;
  v_key := 'support:' || v_user_id::text;
  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));
  insert into public.chat_rooms (room_type, title, relation_key, created_by, support_status)
    values ('support', '집신 고객지원', v_key, v_user_id, 'waiting')
    on conflict (relation_key) do update set relation_key = excluded.relation_key
    returning id into v_room_id;
  insert into public.chat_room_memberships (room_id, user_id, membership_role)
    values (v_room_id, v_user_id, 'owner')
    on conflict (room_id, user_id) where status = 'active' and ended_at is null do nothing;
  insert into public.chat_room_memberships (room_id, user_id)
    select v_room_id, authz.user_id from public.support_authorizations authz
    where authz.support_identity_id = v_identity_id and authz.revoked_at is null
    on conflict (room_id, user_id) where status = 'active' and ended_at is null do nothing;
  return v_room_id;
end;
$$;

create or replace function public.reply_as_zipsin_support(
  p_room_id uuid, p_body text, p_idempotency_key uuid
) returns bigint
language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_identity_id uuid; v_message_id bigint; v_body text := btrim(p_body);
begin
  select authz.support_identity_id into v_identity_id
    from public.support_authorizations authz
    where authz.user_id = v_user_id and authz.authorization_role = 'representative'
      and authz.revoked_at is null;
  if not found then raise exception 'permission_denied'; end if;
  perform 1 from public.chat_rooms room where room.id = p_room_id and room.room_type = 'support' and room.status = 'active';
  if not found or not public.can_access_chat_room(p_room_id) then raise exception 'permission_denied'; end if;
  if v_body = '' or char_length(v_body) > 2000 then raise exception 'invalid_input'; end if;
  insert into public.chat_messages (room_id, sender_user_id, body, idempotency_key, sender_kind, support_identity_id)
    values (p_room_id, v_user_id, v_body, p_idempotency_key, 'support', v_identity_id)
    on conflict (room_id, sender_user_id, idempotency_key) do update set idempotency_key = excluded.idempotency_key
    returning id into v_message_id;
  update public.chat_rooms set support_status = 'answered' where id = p_room_id;
  insert into public.notifications (user_id, notification_kind, room_id, message_id)
    select membership.user_id, 'chat_message', p_room_id, v_message_id
    from public.chat_room_memberships membership
    where membership.room_id = p_room_id and membership.user_id <> v_user_id
      and membership.status = 'active' and membership.ended_at is null and not membership.notifications_muted
    on conflict (user_id, notification_kind, message_id) do nothing;
  return v_message_id;
end;
$$;

create or replace function public.set_support_status(p_room_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_status not in ('waiting', 'answered', 'resolved') or not exists (
    select 1 from public.support_authorizations authz
    where authz.user_id = auth.uid() and authz.revoked_at is null
  ) then raise exception 'permission_denied'; end if;
  update public.chat_rooms set support_status = p_status where id = p_room_id and room_type = 'support';
  if not found then raise exception 'invalid_input'; end if;
end;
$$;

create or replace function public.set_chat_notifications_muted(p_room_id uuid, p_muted boolean) returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.chat_room_memberships set notifications_muted = p_muted
    where room_id = p_room_id and user_id = auth.uid() and status = 'active' and ended_at is null;
  if not found then raise exception 'permission_denied'; end if;
end;
$$;

create or replace function public.send_chat_message(p_room_id uuid, p_body text, p_idempotency_key uuid) returns bigint
language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_body text := btrim(p_body); v_message_id bigint;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if v_body = '' or char_length(v_body) > 2000 then raise exception 'invalid_input'; end if;
  if not public.can_send_chat_message(p_room_id) then raise exception 'permission_denied'; end if;
  insert into public.chat_messages (room_id, sender_user_id, body, idempotency_key, sender_kind)
    values (p_room_id, v_user_id, v_body, p_idempotency_key, 'user')
    on conflict (room_id, sender_user_id, idempotency_key) do update set idempotency_key = excluded.idempotency_key
    returning id into v_message_id;
  update public.chat_rooms set support_status = 'waiting'
    where id = p_room_id and room_type = 'support' and created_by = v_user_id;
  insert into public.notifications (user_id, notification_kind, room_id, message_id)
    select membership.user_id, 'chat_message', p_room_id, v_message_id
    from public.chat_room_memberships membership
    where membership.room_id = p_room_id and membership.user_id <> v_user_id
      and membership.status = 'active' and membership.ended_at is null and not membership.notifications_muted
    on conflict (user_id, notification_kind, message_id) do nothing;
  return v_message_id;
end;
$$;

revoke all on public.chat_blocks, public.chat_reports, public.support_identities, public.support_authorizations from public, anon, authenticated;
grant select on public.chat_blocks, public.chat_reports, public.support_identities, public.support_authorizations to authenticated;
revoke all on function public.block_direct_user(uuid) from public, anon, authenticated;
revoke all on function public.report_chat_message(bigint, text, text) from public, anon, authenticated;
revoke all on function public.open_support_conversation() from public, anon, authenticated;
revoke all on function public.reply_as_zipsin_support(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.set_support_status(uuid, text) from public, anon, authenticated;
revoke all on function public.set_chat_notifications_muted(uuid, boolean) from public, anon, authenticated;
grant execute on function public.block_direct_user(uuid) to authenticated;
grant execute on function public.report_chat_message(bigint, text, text) to authenticated;
grant execute on function public.open_support_conversation() to authenticated;
grant execute on function public.reply_as_zipsin_support(uuid, text, uuid) to authenticated;
grant execute on function public.set_support_status(uuid, text) to authenticated;
grant execute on function public.set_chat_notifications_muted(uuid, boolean) to authenticated;

commit;
