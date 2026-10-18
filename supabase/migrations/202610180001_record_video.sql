-- 30초 동영상 (2026-10-18 결정, 설계: docs/design/2026-10-18-db-video-repair-approval.md 1장)
-- 동영상: video/mp4, video/quicktime · 50MB 이하 · 30초 이하(휴대폰에서 잰 길이). 사진·PDF는 지금처럼 20MB 이하.
-- 기존 첨부와 기록은 바꾸지 않습니다.
begin;

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/heic', 'application/pdf', 'video/mp4', 'video/quicktime']
where id = 'home-records';

alter table public.attachments add column if not exists duration_seconds numeric(6, 2)
  check (duration_seconds is null or (duration_seconds > 0 and duration_seconds <= 30.5));

drop function if exists public.prepare_attachment_upload(uuid, text, text, bigint);
create or replace function public.prepare_attachment_upload(
  p_record_id uuid, p_original_name text, p_media_type text, p_byte_size bigint, p_duration_seconds numeric default null
) returns jsonb
language plpgsql security definer set search_path = public, storage
as $$
declare v_user_id uuid := auth.uid(); v_attachment_id uuid := gen_random_uuid();
  v_path text; v_home_id uuid; v_count integer;
  v_is_video boolean := p_media_type in ('video/mp4', 'video/quicktime');
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_original_name is null or char_length(btrim(p_original_name)) not between 1 and 200
    or p_original_name ~ '[[:cntrl:]]'
    or p_media_type not in ('image/jpeg', 'image/png', 'image/heic', 'application/pdf', 'video/mp4', 'video/quicktime')
    or p_byte_size <= 0
    or (not v_is_video and p_byte_size > 20971520)
    or (v_is_video and (p_byte_size > 52428800 or p_duration_seconds is null or p_duration_seconds <= 0 or p_duration_seconds > 30.5))
    or (not v_is_video and p_duration_seconds is not null)
  then raise exception 'invalid_input'; end if;
  if not public.can_access_record(p_record_id) then raise exception 'permission_denied'; end if;
  select home_id into v_home_id from public.records where id = p_record_id;
  perform pg_advisory_xact_lock(hashtextextended(p_record_id::text, 0));
  select count(*) into v_count from public.attachments
    where record_id = p_record_id and status in ('pending', 'ready');
  if v_count >= 10 then raise exception 'conflict'; end if;
  v_path := v_user_id::text || '/' || p_record_id::text || '/' || gen_random_uuid()::text;
  insert into public.attachments (id, record_id, storage_path, original_name, media_type, byte_size, created_by, duration_seconds)
  values (v_attachment_id, p_record_id, v_path, btrim(p_original_name), p_media_type, p_byte_size, v_user_id, p_duration_seconds);
  insert into public.access_audit_events (actor_user_id, action, resource_type, resource_id, home_id, outcome, reason_code)
  values (v_user_id, 'prepare_upload', 'attachment', v_attachment_id, v_home_id, 'allowed', 'private_upload_prepared');
  return jsonb_build_object('attachmentId', v_attachment_id, 'storagePath', v_path);
end;
$$;
revoke all on function public.prepare_attachment_upload(uuid, text, text, bigint, numeric) from public, anon;
grant execute on function public.prepare_attachment_upload(uuid, text, text, bigint, numeric) to authenticated;

commit;
