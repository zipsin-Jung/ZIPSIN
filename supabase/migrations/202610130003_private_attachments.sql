begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('home-records', 'home-records', false, 20971520,
  array['image/jpeg', 'image/png', 'image/heic', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 20971520,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.prepare_attachment_upload(
  p_record_id uuid, p_original_name text, p_media_type text, p_byte_size bigint
) returns jsonb
language plpgsql security definer set search_path = public, storage
as $$
declare v_user_id uuid := auth.uid(); v_attachment_id uuid := gen_random_uuid();
  v_path text; v_home_id uuid; v_count integer;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_original_name is null or char_length(btrim(p_original_name)) not between 1 and 200
    or p_original_name ~ '[[:cntrl:]]'
    or p_media_type not in ('image/jpeg', 'image/png', 'image/heic', 'application/pdf')
    or p_byte_size <= 0 or p_byte_size > 20971520 then raise exception 'invalid_input'; end if;
  if not public.can_access_record(p_record_id) then raise exception 'permission_denied'; end if;
  select home_id into v_home_id from public.records where id = p_record_id;
  perform pg_advisory_xact_lock(hashtextextended(p_record_id::text, 0));
  select count(*) into v_count from public.attachments
    where record_id = p_record_id and status in ('pending', 'ready');
  if v_count >= 10 then raise exception 'conflict'; end if;
  v_path := v_user_id::text || '/' || p_record_id::text || '/' || gen_random_uuid()::text;
  insert into public.attachments (id, record_id, storage_path, original_name, media_type, byte_size, created_by)
  values (v_attachment_id, p_record_id, v_path, btrim(p_original_name), p_media_type, p_byte_size, v_user_id);
  insert into public.access_audit_events (actor_user_id, action, resource_type, resource_id, home_id, outcome, reason_code)
  values (v_user_id, 'prepare_upload', 'attachment', v_attachment_id, v_home_id, 'allowed', 'private_upload_prepared');
  return jsonb_build_object('attachmentId', v_attachment_id, 'storagePath', v_path);
end;
$$;

create or replace function public.complete_attachment_upload(
  p_attachment_id uuid, p_checksum_sha256 text
) returns void
language plpgsql security definer set search_path = public, storage
as $$
declare v_attachment public.attachments%rowtype; v_count integer; v_home_id uuid;
begin
  select * into v_attachment from public.attachments
  where id = p_attachment_id and created_by = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'permission_denied'; end if;
  if not public.can_access_record(v_attachment.record_id) then raise exception 'permission_denied'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'home-records' and name = v_attachment.storage_path)
    then raise exception 'invalid_input'; end if;
  select count(*) into v_count from public.attachments
    where record_id = v_attachment.record_id and status = 'ready';
  if v_count >= 10 then raise exception 'conflict'; end if;
  update public.attachments set status = 'ready', checksum_sha256 = nullif(p_checksum_sha256, '')
    where id = v_attachment.id;
  select home_id into v_home_id from public.records where id = v_attachment.record_id;
  insert into public.access_audit_events (actor_user_id, action, resource_type, resource_id, home_id, outcome, reason_code)
  values (auth.uid(), 'complete_upload', 'attachment', v_attachment.id, v_home_id, 'allowed', 'private_upload_ready');
end;
$$;

create policy "home_records_insert_prepared" on storage.objects for insert to authenticated
with check (bucket_id = 'home-records' and exists (
  select 1 from public.attachments attachment where attachment.storage_path = name
    and attachment.created_by = auth.uid() and attachment.status = 'pending'
));
create policy "home_records_select_authorized" on storage.objects for select to authenticated
using (bucket_id = 'home-records' and exists (
  select 1 from public.attachments attachment where attachment.storage_path = name
    and attachment.status = 'ready' and public.can_access_record(attachment.record_id)
));
create policy "home_records_delete_pending_owner" on storage.objects for delete to authenticated
using (bucket_id = 'home-records' and exists (
  select 1 from public.attachments attachment where attachment.storage_path = name
    and attachment.created_by = auth.uid() and attachment.status in ('pending', 'failed')
));

revoke all on function public.prepare_attachment_upload(uuid, text, text, bigint) from public, anon, authenticated;
revoke all on function public.complete_attachment_upload(uuid, text) from public, anon, authenticated;
grant execute on function public.prepare_attachment_upload(uuid, text, text, bigint) to authenticated;
grant execute on function public.complete_attachment_upload(uuid, text) to authenticated;

commit;
