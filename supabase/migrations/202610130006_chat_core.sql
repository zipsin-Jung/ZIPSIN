begin;

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  room_type text not null,
  title text,
  office_id uuid references public.offices(id),
  home_id uuid references public.homes(id),
  contract_id uuid references public.contracts(id),
  created_by uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check ((status = 'active' and closed_at is null) or (status = 'closed' and closed_at is not null))
);

create table public.chat_room_memberships (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id),
  user_id uuid not null references auth.users(id),
  membership_role text not null default 'member' check (membership_role in ('owner', 'member')),
  status text not null default 'active' check (status in ('active', 'ended')),
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  check ((status = 'active' and ended_at is null) or (status = 'ended' and ended_at is not null))
);
create unique index chat_room_memberships_one_active
  on public.chat_room_memberships(room_id, user_id) where status = 'active' and ended_at is null;

create table public.chat_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.chat_rooms(id),
  sender_user_id uuid not null references auth.users(id),
  body text not null check (char_length(body) between 1 and 2000 and body = btrim(body)),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (room_id, sender_user_id, idempotency_key)
);
create index chat_messages_room_page on public.chat_messages(room_id, id desc);

create table public.chat_read_states (
  room_id uuid not null references public.chat_rooms(id),
  user_id uuid not null references auth.users(id),
  last_read_message_id bigint not null references public.chat_messages(id),
  read_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  notification_kind text not null check (notification_kind in ('chat_message')),
  room_id uuid not null references public.chat_rooms(id),
  message_id bigint not null references public.chat_messages(id),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, notification_kind, message_id)
);
create index notifications_user_unread on public.notifications(user_id, id desc) where read_at is null;

alter table public.chat_rooms enable row level security;
alter table public.chat_room_memberships enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_read_states enable row level security;
alter table public.notifications enable row level security;

create or replace function public.can_access_chat_room(p_room_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.chat_room_memberships membership
    join public.chat_rooms room on room.id = membership.room_id
    where membership.room_id = p_room_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.ended_at is null
      and membership.joined_at <= now()
      and room.status = 'active'
      and room.closed_at is null
  );
$$;

create or replace function public.can_send_chat_message(p_room_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select public.can_access_chat_room(p_room_id); $$;

create policy chat_rooms_select_member on public.chat_rooms for select to authenticated
  using (public.can_access_chat_room(id));
create policy chat_memberships_select_member on public.chat_room_memberships for select to authenticated
  using (public.can_access_chat_room(room_id));
create policy chat_messages_select_member on public.chat_messages for select to authenticated
  using (public.can_access_chat_room(room_id));
create policy chat_read_states_select_self on public.chat_read_states for select to authenticated
  using (user_id = auth.uid() and public.can_access_chat_room(room_id));
create policy notifications_select_self on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update_self on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.send_chat_message(
  p_room_id uuid,
  p_body text,
  p_idempotency_key uuid
) returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_body text := btrim(p_body);
  v_message_id bigint;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if v_body = '' or char_length(v_body) > 2000 then raise exception 'invalid_input'; end if;
  if not public.can_send_chat_message(p_room_id) then raise exception 'permission_denied'; end if;

  insert into public.chat_messages (room_id, sender_user_id, body, idempotency_key)
  values (p_room_id, v_user_id, v_body, p_idempotency_key)
  on conflict (room_id, sender_user_id, idempotency_key)
  do update set idempotency_key = excluded.idempotency_key
  returning id into v_message_id;

  insert into public.notifications (user_id, notification_kind, room_id, message_id)
  select membership.user_id, 'chat_message', p_room_id, v_message_id
  from public.chat_room_memberships membership
  where membership.room_id = p_room_id
    and membership.user_id <> v_user_id
    and membership.status = 'active' and membership.ended_at is null
  on conflict (user_id, notification_kind, message_id) do nothing;
  return v_message_id;
end;
$$;

create or replace function public.mark_chat_read(
  p_room_id uuid,
  p_last_read_message_id bigint
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.can_access_chat_room(p_room_id) then raise exception 'permission_denied'; end if;
  perform 1 from public.chat_messages message
    where message.id = p_last_read_message_id and message.room_id = p_room_id;
  if not found then raise exception 'invalid_input'; end if;

  insert into public.chat_read_states (room_id, user_id, last_read_message_id, read_at)
  values (p_room_id, v_user_id, p_last_read_message_id, now())
  on conflict (room_id, user_id) do update
    set last_read_message_id = greatest(public.chat_read_states.last_read_message_id, excluded.last_read_message_id),
        read_at = case when excluded.last_read_message_id >= public.chat_read_states.last_read_message_id then now() else public.chat_read_states.read_at end;

  update public.notifications set read_at = coalesce(read_at, now())
  where user_id = v_user_id and room_id = p_room_id
    and message_id <= p_last_read_message_id;
end;
$$;

revoke all on public.chat_rooms from public, anon, authenticated;
revoke all on public.chat_room_memberships from public, anon, authenticated;
revoke all on public.chat_messages from public, anon, authenticated;
revoke all on public.chat_read_states from public, anon, authenticated;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.chat_rooms, public.chat_room_memberships, public.chat_messages, public.chat_read_states, public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
revoke all on function public.can_access_chat_room(uuid) from public, anon, authenticated;
revoke all on function public.can_send_chat_message(uuid) from public, anon, authenticated;
revoke all on function public.send_chat_message(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.mark_chat_read(uuid, bigint) from public, anon, authenticated;
grant execute on function public.can_access_chat_room(uuid) to authenticated;
grant execute on function public.can_send_chat_message(uuid) to authenticated;
grant execute on function public.send_chat_message(uuid, text, uuid) to authenticated;
grant execute on function public.mark_chat_read(uuid, bigint) to authenticated;

commit;
