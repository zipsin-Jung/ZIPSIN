begin;

create table public.chat_attachments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id),
  message_id bigint not null references public.chat_messages(id),
  storage_path text not null unique,
  original_name text not null,
  media_type text not null,
  byte_size bigint not null,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  created_by uuid not null references auth.users(id),
  upload_expires_at timestamptz not null default (now() + interval '1 hour'),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, room_id, message_id)
);
create index chat_attachments_message on public.chat_attachments(message_id, created_at);
alter table public.chat_attachments enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-attachments', 'chat-attachments', false, 20971520,
  array['image/jpeg', 'image/png', 'image/heic', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 20971520,
  allowed_mime_types = excluded.allowed_mime_types;

create policy chat_attachments_select_member on public.chat_attachments for select to authenticated
  using (status = 'ready' and public.can_access_chat_room(room_id));

create or replace function public.prepare_chat_attachment_upload(
  p_room_id uuid, p_message_id bigint, p_original_name text, p_media_type text, p_byte_size bigint
) returns jsonb
language plpgsql security definer set search_path = public, storage
as $$
declare
  v_user_id uuid := auth.uid();
  v_attachment_id uuid := gen_random_uuid();
  v_path text;
  v_count integer;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_original_name is null or char_length(btrim(p_original_name)) not between 1 and 200
    or p_original_name ~ '[[:cntrl:]]'
    or p_media_type not in ('image/jpeg', 'image/png', 'image/heic', 'application/pdf')
    or p_byte_size <= 0 or p_byte_size > 20971520 then raise exception 'invalid_input'; end if;
  if not public.can_access_chat_room(p_room_id) then raise exception 'permission_denied'; end if;
  perform 1 from public.chat_messages message
    where message.id = p_message_id and message.room_id = p_room_id
      and message.sender_user_id = v_user_id;
  if not found then raise exception 'permission_denied'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_message_id::text, 0));
  select count(*) into v_count from public.chat_attachments
    where message_id = p_message_id and status in ('pending', 'ready')
      and (status = 'ready' or upload_expires_at > now());
  if v_count >= 10 then raise exception 'conflict'; end if;
  v_path := 'chat/' || p_room_id::text || '/' || p_message_id::text || '/' || v_attachment_id::text;
  insert into public.chat_attachments (
    id, room_id, message_id, storage_path, original_name, media_type, byte_size, created_by
  ) values (
    v_attachment_id, p_room_id, p_message_id, v_path, btrim(p_original_name), p_media_type, p_byte_size, v_user_id
  );
  return jsonb_build_object('attachmentId', v_attachment_id, 'storagePath', v_path);
end;
$$;

create or replace function public.complete_chat_attachment_upload(p_attachment_id uuid) returns void
language plpgsql security definer set search_path = public, storage
as $$
declare v_attachment public.chat_attachments%rowtype;
begin
  select * into v_attachment from public.chat_attachments
    where id = p_attachment_id and created_by = auth.uid() and status = 'pending' for update;
  if not found or v_attachment.upload_expires_at <= now() then raise exception 'permission_denied'; end if;
  if not public.can_access_chat_room(v_attachment.room_id) then raise exception 'permission_denied'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'chat-attachments' and name = v_attachment.storage_path)
    then raise exception 'invalid_input'; end if;
  update public.chat_attachments set status = 'ready', completed_at = now() where id = v_attachment.id;
end;
$$;

create or replace function public.fail_chat_attachment_upload(p_attachment_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.chat_attachments set status = 'failed'
    where id = p_attachment_id and created_by = auth.uid() and status = 'pending';
  if not found then raise exception 'permission_denied'; end if;
end;
$$;

create policy chat_attachments_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'chat-attachments' and exists (
  select 1 from public.chat_attachments attachment where attachment.storage_path = name
    and attachment.created_by = auth.uid() and attachment.status = 'pending'
    and attachment.upload_expires_at > now() and public.can_access_chat_room(attachment.room_id)
));
create policy chat_attachments_storage_select on storage.objects for select to authenticated
using (bucket_id = 'chat-attachments' and exists (
  select 1 from public.chat_attachments attachment where attachment.storage_path = name
    and attachment.status = 'ready' and public.can_access_chat_room(attachment.room_id)
));
create policy chat_attachments_storage_delete on storage.objects for delete to authenticated
using (bucket_id = 'chat-attachments' and exists (
  select 1 from public.chat_attachments attachment where attachment.storage_path = name
    and attachment.created_by = auth.uid() and attachment.status in ('pending', 'failed')
));

revoke all on public.chat_attachments from public, anon, authenticated;
grant select on public.chat_attachments to authenticated;
revoke all on function public.prepare_chat_attachment_upload(uuid, bigint, text, text, bigint) from public, anon, authenticated;
revoke all on function public.complete_chat_attachment_upload(uuid) from public, anon, authenticated;
revoke all on function public.fail_chat_attachment_upload(uuid) from public, anon, authenticated;
grant execute on function public.prepare_chat_attachment_upload(uuid, bigint, text, text, bigint) to authenticated;
grant execute on function public.complete_chat_attachment_upload(uuid) to authenticated;
grant execute on function public.fail_chat_attachment_upload(uuid) to authenticated;

commit;
