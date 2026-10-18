-- 수리 5단계 (2026-10-18 결정, 설계: docs/design/2026-10-18-db-video-repair-approval.md 2장)
-- 접수 중(received) → 임대인 확인(landlord_review) → 일정 조율(scheduling) → 수리 완료(completed) → 영수증 첨부(receipt_attached)
-- 단계는 advance_repair_stage 함수로만 바뀝니다. 누가 눌렀는지·어떤 방법인지(앱/전화 확인/작은 수리 건너뜀) 이력으로 남깁니다.
-- 기존 기록은 지우지 않습니다. 이미 있는 "이번 계약 공유" 수리 기록은 '접수 중'으로 시작합니다.
begin;

-- 1) 알림: 채팅 외에 수리 단계·임대인 승인 알림을 받을 수 있게 넓힌다.
alter table public.notifications alter column room_id drop not null;
alter table public.notifications alter column message_id drop not null;
alter table public.notifications add column if not exists home_id uuid references public.homes(id) on delete restrict;
alter table public.notifications add column if not exists record_id uuid references public.records(id) on delete restrict;
alter table public.notifications add column if not exists detail text check (detail is null or char_length(detail) <= 200);
alter table public.notifications drop constraint if exists notifications_notification_kind_check;
alter table public.notifications add constraint notifications_notification_kind_check
  check (notification_kind in ('chat_message', 'repair_stage', 'landlord_approval'));
alter table public.notifications add constraint notifications_target_by_kind check (
  (notification_kind = 'chat_message' and room_id is not null and message_id is not null)
  or (notification_kind <> 'chat_message' and home_id is not null)
);

-- 2) 수리 단계 칸
alter table public.records add column if not exists repair_stage text
  check (repair_stage in ('received', 'landlord_review', 'scheduling', 'completed', 'receipt_attached'));
alter table public.records add column if not exists repair_stage_changed_at timestamptz;
alter table public.records add column if not exists repair_estimated_cost_won integer
  check (repair_estimated_cost_won is null or repair_estimated_cost_won between 0 and 1000000000);
alter table public.records add constraint records_repair_stage_scope check (
  repair_stage is null or (record_kind = 'repair' and record_space = 'current_contract')
);

update public.records
set repair_stage = 'received', repair_stage_changed_at = coalesce(repair_stage_changed_at, created_at)
where record_kind = 'repair' and record_space = 'current_contract' and repair_stage is null;

create or replace function public.set_initial_repair_stage() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.record_kind = 'repair' and new.record_space = 'current_contract' then
    new.repair_stage := 'received';
    new.repair_stage_changed_at := now();
  else
    new.repair_stage := null;
    new.repair_stage_changed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists records_initial_repair_stage on public.records;
create trigger records_initial_repair_stage before insert on public.records
for each row execute function public.set_initial_repair_stage();

-- 단계 칸은 함수로만 바꾼다(직접 update 금지).
create or replace function public.guard_repair_stage_update() returns trigger
language plpgsql set search_path = public
as $$
begin
  if (new.repair_stage is distinct from old.repair_stage
      or new.repair_stage_changed_at is distinct from old.repair_stage_changed_at
      or new.repair_estimated_cost_won is distinct from old.repair_estimated_cost_won)
    and coalesce(current_setting('zipsin.repair_stage_change', true), '') <> 'on'
  then raise exception 'permission_denied'; end if;
  return new;
end;
$$;
drop trigger if exists records_guard_repair_stage on public.records;
create trigger records_guard_repair_stage before update on public.records
for each row execute function public.guard_repair_stage_update();

-- 3) 단계 이력 (서버 전용)
create table public.repair_stage_events (
  id bigint generated always as identity primary key,
  record_id uuid not null references public.records(id) on delete restrict,
  home_id uuid not null references public.homes(id) on delete restrict,
  from_stage text not null,
  to_stage text not null,
  method text not null check (method in ('app', 'phone_confirmed', 'small_repair_skip')),
  actor_user_id uuid not null references auth.users(id),
  actor_role text not null check (actor_role in ('office', 'landlord', 'tenant')),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index repair_stage_events_record on public.repair_stage_events(record_id, id);
alter table public.repair_stage_events enable row level security;
revoke all on public.repair_stage_events from public, anon, authenticated;

-- 4) 누가 누르는지
create or replace function public.repair_actor_role(p_record_id uuid) returns text
language sql stable security definer set search_path = public
as $$
  select case
    when exists (
      select 1 from public.records record
      join public.homes home on home.id = record.home_id
      join public.office_memberships membership on membership.office_id = home.office_id
      where record.id = p_record_id
        and membership.user_id = auth.uid()
        and membership.office_role in ('principal_broker', 'associate_broker')
        and membership.status = 'active' and membership.ended_at is null and membership.started_at <= now()
    ) then 'office'
    when exists (
      select 1 from public.records record
      join public.home_memberships membership on membership.contract_id = record.contract_id and membership.home_id = record.home_id
      join public.contracts contract on contract.id = record.contract_id and contract.status = 'active'
      where record.id = p_record_id
        and membership.user_id = auth.uid()
        and membership.relationship_role = 'landlord'
        and membership.access_scope = 'current_contract'
        and membership.status = 'active' and membership.ended_at is null and membership.starts_at <= now()
        and (membership.expires_at is null or membership.expires_at > now())
    ) then 'landlord'
    when exists (
      select 1 from public.records record
      join public.home_memberships membership on membership.contract_id = record.contract_id and membership.home_id = record.home_id
      join public.contracts contract on contract.id = record.contract_id and contract.status = 'active'
      where record.id = p_record_id
        and membership.user_id = auth.uid()
        and membership.relationship_role = 'tenant'
        and membership.access_scope = 'current_contract'
        and membership.status = 'active' and membership.ended_at is null and membership.starts_at <= now()
        and (membership.expires_at is null or membership.expires_at > now())
    ) then 'tenant'
    else null
  end;
$$;

-- 작은 수리 건너뛰기 허용 여부. 임대인 승인 기능(202610180003)에서 실제 규칙으로 바꾼다.
create or replace function public.small_repair_skip_allowed(p_record_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select false; $$;

create or replace function public.notify_repair_parties(
  p_record_id uuid, p_roles text[], p_detail text
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_record public.records%rowtype; v_office_id uuid;
begin
  select * into v_record from public.records where id = p_record_id;
  select office_id into v_office_id from public.homes where id = v_record.home_id;
  insert into public.notifications (user_id, notification_kind, home_id, record_id, detail)
  select distinct target.user_id, 'repair_stage', v_record.home_id, v_record.id, p_detail
  from (
    select membership.user_id from public.office_memberships membership
    where 'office' = any(p_roles) and membership.office_id = v_office_id
      and membership.office_role in ('principal_broker', 'associate_broker')
      and membership.status = 'active' and membership.ended_at is null
    union
    select membership.user_id from public.home_memberships membership
    where membership.contract_id = v_record.contract_id and membership.home_id = v_record.home_id
      and membership.relationship_role = any(p_roles)
      and membership.relationship_role in ('landlord', 'tenant')
      and membership.access_scope = 'current_contract'
      and membership.status = 'active' and membership.ended_at is null
  ) target
  where target.user_id is distinct from auth.uid();
end;
$$;

create or replace function public.advance_repair_stage(
  p_record_id uuid, p_to_stage text, p_method text default 'app', p_note text default null
) returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_record public.records%rowtype;
  v_role text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_method not in ('app', 'phone_confirmed', 'small_repair_skip') or char_length(coalesce(v_note, '')) > 200
    then raise exception 'invalid_input'; end if;
  select * into v_record from public.records where id = p_record_id for update;
  if not found or v_record.repair_stage is null then raise exception 'invalid_input'; end if;
  if not public.can_access_record(p_record_id) then raise exception 'permission_denied'; end if;
  v_role := public.repair_actor_role(p_record_id);
  if v_role is null then raise exception 'permission_denied'; end if;

  if v_record.repair_stage = 'received' and p_to_stage = 'landlord_review' then
    if p_method <> 'app' or v_role not in ('office', 'tenant') then raise exception 'permission_denied'; end if;
  elsif v_record.repair_stage = 'landlord_review' and p_to_stage = 'scheduling' then
    if p_method = 'app' and v_role <> 'landlord' then raise exception 'permission_denied'; end if;
    if p_method = 'phone_confirmed' and v_role <> 'office' then raise exception 'permission_denied'; end if;
    if p_method = 'small_repair_skip' and (v_role <> 'office' or not public.small_repair_skip_allowed(p_record_id))
      then raise exception 'permission_denied'; end if;
  elsif v_record.repair_stage = 'scheduling' and p_to_stage = 'completed' then
    if p_method <> 'app' or v_role <> 'office' then raise exception 'permission_denied'; end if;
    if not exists (
      select 1 from public.attachments attachment
      where attachment.record_id = p_record_id and attachment.status = 'ready'
        and attachment.media_type like 'image/%'
        and attachment.created_at >= v_record.repair_stage_changed_at
    ) then raise exception 'after_photo_required'; end if;
  elsif v_record.repair_stage = 'completed' and p_to_stage = 'receipt_attached' then
    if p_method <> 'app' or v_role <> 'office' then raise exception 'permission_denied'; end if;
    if not exists (
      select 1 from public.attachments attachment
      where attachment.record_id = p_record_id and attachment.status = 'ready'
        and attachment.created_at >= v_record.repair_stage_changed_at
    ) then raise exception 'receipt_required'; end if;
  else
    raise exception 'conflict';
  end if;

  perform set_config('zipsin.repair_stage_change', 'on', true);
  update public.records set repair_stage = p_to_stage, repair_stage_changed_at = clock_timestamp(), updated_at = now()
  where id = p_record_id;
  perform set_config('zipsin.repair_stage_change', 'off', true);

  insert into public.repair_stage_events (record_id, home_id, from_stage, to_stage, method, actor_user_id, actor_role, note)
  values (p_record_id, v_record.home_id, v_record.repair_stage, p_to_stage, p_method, v_user_id, v_role, v_note);
  insert into public.access_audit_events (actor_user_id, action, resource_type, resource_id, home_id, outcome, reason_code)
  values (v_user_id, 'update', 'record', p_record_id, v_record.home_id, 'allowed', 'repair_stage_' || p_to_stage);

  perform public.notify_repair_parties(p_record_id,
    case p_to_stage
      when 'landlord_review' then array['landlord', 'office']
      when 'scheduling' then array['office', 'tenant', 'landlord']
      when 'completed' then array['tenant', 'landlord']
      else array['landlord', 'office']
    end,
    case p_to_stage
      when 'landlord_review' then '임대인 확인을 기다려요'
      when 'scheduling' then case p_method when 'phone_confirmed' then '임대인 전화 확인으로 일정 조율을 시작해요' when 'small_repair_skip' then '작은 수리라 임대인 확인 없이 일정 조율을 시작해요' else '임대인이 확인했어요. 일정 조율을 시작해요' end
      when 'completed' then '수리를 마쳤어요'
      else '영수증을 올렸어요'
    end);
  return p_to_stage;
end;
$$;

create or replace function public.set_repair_estimate(p_record_id uuid, p_cost_won integer) returns void
language plpgsql security definer set search_path = public
as $$
declare v_record public.records%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_cost_won is not null and (p_cost_won < 0 or p_cost_won > 1000000000) then raise exception 'invalid_input'; end if;
  select * into v_record from public.records where id = p_record_id for update;
  if not found or v_record.repair_stage is null or v_record.repair_stage not in ('received', 'landlord_review') then raise exception 'invalid_input'; end if;
  if public.repair_actor_role(p_record_id) is distinct from 'office' then raise exception 'permission_denied'; end if;
  perform set_config('zipsin.repair_stage_change', 'on', true);
  update public.records set repair_estimated_cost_won = p_cost_won, updated_at = now() where id = p_record_id;
  perform set_config('zipsin.repair_stage_change', 'off', true);
end;
$$;

-- 단계 이력 보기: 사람 ID 없이 역할·방법·시각만.
create or replace function public.get_repair_stage_events(p_record_id uuid)
returns table (from_stage text, to_stage text, method text, actor_role text, is_me boolean, created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select event.from_stage, event.to_stage, event.method, event.actor_role, event.actor_user_id = auth.uid(), event.created_at
  from public.repair_stage_events event
  where event.record_id = p_record_id and public.can_access_record(p_record_id)
  order by event.id;
$$;

revoke all on function public.repair_actor_role(uuid) from public, anon;
revoke all on function public.small_repair_skip_allowed(uuid) from public, anon;
revoke all on function public.notify_repair_parties(uuid, text[], text) from public, anon, authenticated;
revoke all on function public.advance_repair_stage(uuid, text, text, text) from public, anon;
revoke all on function public.set_repair_estimate(uuid, integer) from public, anon;
revoke all on function public.get_repair_stage_events(uuid) from public, anon;
grant execute on function public.repair_actor_role(uuid) to authenticated;
grant execute on function public.small_repair_skip_allowed(uuid) to authenticated;
grant execute on function public.advance_repair_stage(uuid, text, text, text) to authenticated;
grant execute on function public.set_repair_estimate(uuid, integer) to authenticated;
grant execute on function public.get_repair_stage_events(uuid) to authenticated;

commit;
