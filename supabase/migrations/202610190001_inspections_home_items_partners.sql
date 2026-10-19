-- 2026-10-19 로그인 후 앱 v2 (대표 지시 "일단 다 만들어 놔야 돼")
-- 1) 입주·퇴거 상태 기록: 방 → 항목(파손/청소 따로) → 확인함/확인 못 함, 계량기·열쇠, 임차인·임대인 답(맞아요/의견, 답 없음 ≠ 동의)
-- 2) 집 이력 품목: 보일러·에어컨 등 설치·교체일
-- 3) 집신 파트너 등록 신청과 서류(비공개 저장소, 본인과 서버만)
-- 원칙: 표는 읽기만 열고, 쓰기는 아래 함수로만 한다. 보낸 상태 기록은 사무소도 못 고친다(증거). 기존 데이터는 바꾸지 않는다.
begin;

-- ───────────────────────── 1) 입주·퇴거 상태 ─────────────────────────
create table public.home_inspections (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete restrict,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  office_id uuid not null references public.offices(id) on delete restrict,
  inspection_kind text not null check (inspection_kind in ('move_in', 'move_out')),
  status text not null default 'draft' check (status in ('draft', 'sent')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  sent_by uuid references auth.users(id),
  sent_at timestamptz,
  unique (contract_id, inspection_kind),
  check ((status = 'sent') = (sent_at is not null))
);

create table public.inspection_rooms (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.home_inspections(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 30),
  sort_order integer not null default 0,
  -- 방 사진: 이번 계약 공유 '사진' 기록 하나에 모은다(기존 첨부·저장소 권한 그대로 사용).
  record_id uuid references public.records(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index inspection_rooms_inspection_idx on public.inspection_rooms(inspection_id, sort_order);

-- state: unchecked = 확인 못 함(기본), ok = 확인함·이상 없음, issue = 확인함·이상 있음
create table public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.home_inspections(id) on delete restrict,
  room_id uuid not null references public.inspection_rooms(id) on delete restrict,
  label text not null check (char_length(trim(label)) between 1 and 40),
  aspect text not null check (aspect in ('damage', 'cleaning')),
  state text not null default 'unchecked' check (state in ('unchecked', 'ok', 'issue')),
  note text check (note is null or char_length(note) <= 300),
  checked_by uuid references auth.users(id),
  checked_at timestamptz,
  sort_order integer not null default 0
);
create index inspection_items_room_idx on public.inspection_items(room_id, aspect, sort_order);

create table public.inspection_responses (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.home_inspections(id) on delete restrict,
  item_id uuid not null references public.inspection_items(id) on delete restrict,
  user_id uuid not null references auth.users(id),
  relationship_role text not null check (relationship_role in ('tenant', 'landlord')),
  response text not null check (response in ('agree', 'comment')),
  comment text check (comment is null or char_length(comment) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, user_id),
  check (response <> 'comment' or char_length(trim(coalesce(comment, ''))) >= 1)
);

create table public.inspection_readings (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.home_inspections(id) on delete restrict,
  reading_kind text not null check (reading_kind in ('electric', 'gas', 'water', 'keys', 'card_keys', 'remotes', 'door_code_changed')),
  value text not null check (char_length(trim(value)) between 1 and 60),
  note text check (note is null or char_length(note) <= 200),
  recorded_by uuid not null references auth.users(id),
  recorded_at timestamptz not null default now(),
  unique (inspection_id, reading_kind)
);

alter table public.home_inspections enable row level security;
alter table public.inspection_rooms enable row level security;
alter table public.inspection_items enable row level security;
alter table public.inspection_responses enable row level security;
alter table public.inspection_readings enable row level security;

-- 볼 수 있는 사람 = 그 계약을 볼 수 있는 사람(사무소 구성원 · 현재 계약의 임대인·임차인). 이전 계약자는 못 본다.
create or replace function public.can_access_inspection(p_inspection_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.home_inspections i where i.id = p_inspection_id and public.can_access_contract(i.contract_id));
$$;
revoke all on function public.can_access_inspection(uuid) from public, anon;
grant execute on function public.can_access_inspection(uuid) to authenticated;

create policy "home_inspections_select" on public.home_inspections for select to authenticated using (public.can_access_contract(contract_id));
create policy "inspection_rooms_select" on public.inspection_rooms for select to authenticated using (public.can_access_inspection(inspection_id));
create policy "inspection_items_select" on public.inspection_items for select to authenticated using (public.can_access_inspection(inspection_id));
create policy "inspection_responses_select" on public.inspection_responses for select to authenticated using (public.can_access_inspection(inspection_id));
create policy "inspection_readings_select" on public.inspection_readings for select to authenticated using (public.can_access_inspection(inspection_id));
grant select on public.home_inspections, public.inspection_rooms, public.inspection_items, public.inspection_responses, public.inspection_readings to authenticated;

-- 방 이름에 맞는 기본 항목. 파손과 청소는 따로 본다.
create or replace function public.seed_inspection_room(p_inspection_id uuid, p_room_id uuid, p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare v_labels text[];
begin
  v_labels := case
    when p_name like '%욕실%' or p_name like '%화장실%' then array['변기', '세면대·수전', '배수구', '타일·실리콘', '환풍기']
    when p_name like '%주방%' or p_name like '%부엌%' then array['싱크대·수전', '가스레인지·인덕션', '후드', '수납장', '바닥']
    when p_name like '%현관%' then array['현관문·도어락', '신발장', '바닥']
    when p_name like '%베란다%' or p_name like '%발코니%' then array['창문·샷시', '배수구', '벽·곰팡이']
    else array['벽지', '바닥', '천장', '창문·방충망', '문·손잡이']
  end;
  insert into public.inspection_items (inspection_id, room_id, label, aspect, sort_order)
  select p_inspection_id, p_room_id, label, 'damage', ordinality from unnest(v_labels) with ordinality as t(label, ordinality);
  insert into public.inspection_items (inspection_id, room_id, label, aspect, sort_order)
  values (p_inspection_id, p_room_id, '청소 상태', 'cleaning', 1);
end;
$$;
revoke all on function public.seed_inspection_room(uuid, uuid, text) from public, anon, authenticated;

-- 사무소 구성원이 현재 계약에 입주/퇴거 기록을 만든다. 이미 있으면 그 기록을 돌려준다.
create or replace function public.create_home_inspection(p_home_id uuid, p_kind text, p_rooms text[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_home public.homes; v_contract uuid; v_id uuid; v_room uuid; v_name text; v_order int := 0;
begin
  if auth.uid() is null or not public.can_access_office_home(p_home_id) then raise exception 'permission_denied'; end if;
  if p_kind not in ('move_in', 'move_out') then raise exception 'invalid_kind'; end if;
  select * into v_home from public.homes where id = p_home_id;
  select id into v_contract from public.contracts where home_id = p_home_id and status = 'active' limit 1;
  if v_contract is null then raise exception 'contract_required'; end if;
  select id into v_id from public.home_inspections where contract_id = v_contract and inspection_kind = p_kind;
  if v_id is not null then return v_id; end if;
  if coalesce(array_length(p_rooms, 1), 0) not between 1 and 15 then raise exception 'rooms_required'; end if;
  insert into public.home_inspections (home_id, contract_id, office_id, inspection_kind, created_by)
  values (p_home_id, v_contract, v_home.office_id, p_kind, auth.uid()) returning id into v_id;
  foreach v_name in array p_rooms loop
    v_name := trim(v_name);
    continue when v_name = '';
    v_order := v_order + 1;
    insert into public.inspection_rooms (inspection_id, name, sort_order) values (v_id, v_name, v_order) returning id into v_room;
    perform public.seed_inspection_room(v_id, v_room, v_name);
  end loop;
  return v_id;
end;
$$;

-- 보내기 전(draft)인 기록만 사무소가 고친다.
create or replace function public.require_inspection_editor(p_inspection_id uuid) returns public.home_inspections
language plpgsql security definer set search_path = public as $$
declare v public.home_inspections;
begin
  select * into v from public.home_inspections where id = p_inspection_id for update;
  if v.id is null or auth.uid() is null or not public.can_access_office_home(v.home_id) then raise exception 'permission_denied'; end if;
  if v.status <> 'draft' then raise exception 'inspection_locked'; end if;
  return v;
end;
$$;
revoke all on function public.require_inspection_editor(uuid) from public, anon, authenticated;

create or replace function public.add_inspection_room(p_inspection_id uuid, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_room uuid; v_order int;
begin
  perform public.require_inspection_editor(p_inspection_id);
  if (select count(*) from public.inspection_rooms where inspection_id = p_inspection_id) >= 15 then raise exception 'too_many_rooms'; end if;
  select coalesce(max(sort_order), 0) + 1 into v_order from public.inspection_rooms where inspection_id = p_inspection_id;
  insert into public.inspection_rooms (inspection_id, name, sort_order) values (p_inspection_id, trim(p_name), v_order) returning id into v_room;
  perform public.seed_inspection_room(p_inspection_id, v_room, trim(p_name));
  return v_room;
end;
$$;

create or replace function public.add_inspection_item(p_room_id uuid, p_label text, p_aspect text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_inspection uuid; v_id uuid; v_order int;
begin
  select inspection_id into v_inspection from public.inspection_rooms where id = p_room_id;
  perform public.require_inspection_editor(v_inspection);
  if p_aspect not in ('damage', 'cleaning') then raise exception 'invalid_aspect'; end if;
  if (select count(*) from public.inspection_items where room_id = p_room_id) >= 30 then raise exception 'too_many_items'; end if;
  select coalesce(max(sort_order), 0) + 1 into v_order from public.inspection_items where room_id = p_room_id and aspect = p_aspect;
  insert into public.inspection_items (inspection_id, room_id, label, aspect, sort_order) values (v_inspection, p_room_id, trim(p_label), p_aspect, v_order) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.set_inspection_item(p_item_id uuid, p_state text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_inspection uuid;
begin
  select inspection_id into v_inspection from public.inspection_items where id = p_item_id;
  perform public.require_inspection_editor(v_inspection);
  if p_state not in ('unchecked', 'ok', 'issue') then raise exception 'invalid_state'; end if;
  if p_state = 'issue' and char_length(trim(coalesce(p_note, ''))) = 0 then raise exception 'note_required'; end if;
  update public.inspection_items
  set state = p_state, note = nullif(trim(coalesce(p_note, '')), ''),
      checked_by = case when p_state = 'unchecked' then null else auth.uid() end,
      checked_at = case when p_state = 'unchecked' then null else now() end
  where id = p_item_id;
end;
$$;

create or replace function public.set_inspection_reading(p_inspection_id uuid, p_kind text, p_value text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_inspection_editor(p_inspection_id);
  if nullif(trim(coalesce(p_value, '')), '') is null then
    delete from public.inspection_readings where inspection_id = p_inspection_id and reading_kind = p_kind;
    return;
  end if;
  insert into public.inspection_readings (inspection_id, reading_kind, value, note, recorded_by)
  values (p_inspection_id, p_kind, trim(p_value), nullif(trim(coalesce(p_note, '')), ''), auth.uid())
  on conflict (inspection_id, reading_kind) do update set value = excluded.value, note = excluded.note, recorded_by = excluded.recorded_by, recorded_at = now();
end;
$$;

-- 방 사진을 올릴 기록을 처음 한 번 만든다(보내기 전만).
create or replace function public.ensure_inspection_room_record(p_room_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_room public.inspection_rooms; v public.home_inspections; v_record uuid;
begin
  select * into v_room from public.inspection_rooms where id = p_room_id for update;
  if v_room.id is null then raise exception 'permission_denied'; end if;
  v := public.require_inspection_editor(v_room.inspection_id);
  if v_room.record_id is not null then return v_room.record_id; end if;
  v_record := public.create_home_record(v.home_id, null, v.contract_id, 'current_contract', 'photo',
    case v.inspection_kind when 'move_in' then '입주 상태 · ' else '퇴거 상태 · ' end || v_room.name,
    null, gen_random_uuid(), null, null);
  update public.inspection_rooms set record_id = v_record where id = p_room_id;
  return v_record;
end;
$$;
revoke all on function public.ensure_inspection_room_record(uuid) from public, anon;
grant execute on function public.ensure_inspection_room_record(uuid) to authenticated;

alter table public.notifications drop constraint if exists notifications_notification_kind_check;
alter table public.notifications add constraint notifications_notification_kind_check
  check (notification_kind in ('chat_message', 'repair_stage', 'landlord_approval', 'inspection_sent'));

-- 보내면 고칠 수 없다. 현재 계약의 임대인·임차인에게 알림.
create or replace function public.send_home_inspection(p_inspection_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v public.home_inspections;
begin
  v := public.require_inspection_editor(p_inspection_id);
  update public.home_inspections set status = 'sent', sent_by = auth.uid(), sent_at = now() where id = p_inspection_id;
  insert into public.notifications (user_id, notification_kind, home_id, detail)
  select distinct membership.user_id, 'inspection_sent', v.home_id,
    case v.inspection_kind when 'move_in' then '입주 상태 기록을 확인해 주세요' else '퇴거 상태 기록을 확인해 주세요' end
  from public.home_memberships membership
  where membership.contract_id = v.contract_id and membership.home_id = v.home_id
    and membership.relationship_role in ('tenant', 'landlord') and membership.status = 'active'
    and membership.ended_at is null and (membership.expires_at is null or membership.expires_at > now());
end;
$$;

-- 임차인·임대인 답: 맞아요 / 의견. 답하지 않은 항목은 '답 없음'으로 남고 동의로 보지 않는다.
create or replace function public.respond_inspection_item(p_item_id uuid, p_response text, p_comment text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_item public.inspection_items; v public.home_inspections; v_role text;
begin
  select * into v_item from public.inspection_items where id = p_item_id;
  select * into v from public.home_inspections where id = v_item.inspection_id;
  if v.id is null or auth.uid() is null then raise exception 'permission_denied'; end if;
  select membership.relationship_role into v_role from public.home_memberships membership
  where membership.contract_id = v.contract_id and membership.home_id = v.home_id and membership.user_id = auth.uid()
    and membership.relationship_role in ('tenant', 'landlord') and membership.status = 'active'
    and membership.ended_at is null and (membership.expires_at is null or membership.expires_at > now())
  limit 1;
  if v_role is null then raise exception 'permission_denied'; end if;
  if v.status <> 'sent' then raise exception 'inspection_not_sent'; end if;
  if p_response not in ('agree', 'comment') then raise exception 'invalid_response'; end if;
  if p_response = 'comment' and char_length(trim(coalesce(p_comment, ''))) = 0 then raise exception 'comment_required'; end if;
  insert into public.inspection_responses (inspection_id, item_id, user_id, relationship_role, response, comment)
  values (v.id, p_item_id, auth.uid(), v_role, p_response, case when p_response = 'comment' then trim(p_comment) end)
  on conflict (item_id, user_id) do update set response = excluded.response, comment = excluded.comment, updated_at = now();
end;
$$;

revoke all on function public.create_home_inspection(uuid, text, text[]) from public, anon;
revoke all on function public.add_inspection_room(uuid, text) from public, anon;
revoke all on function public.add_inspection_item(uuid, text, text) from public, anon;
revoke all on function public.set_inspection_item(uuid, text, text) from public, anon;
revoke all on function public.set_inspection_reading(uuid, text, text, text) from public, anon;
revoke all on function public.send_home_inspection(uuid) from public, anon;
revoke all on function public.respond_inspection_item(uuid, text, text) from public, anon;
grant execute on function public.create_home_inspection(uuid, text, text[]) to authenticated;
grant execute on function public.add_inspection_room(uuid, text) to authenticated;
grant execute on function public.add_inspection_item(uuid, text, text) to authenticated;
grant execute on function public.set_inspection_item(uuid, text, text) to authenticated;
grant execute on function public.set_inspection_reading(uuid, text, text, text) to authenticated;
grant execute on function public.send_home_inspection(uuid) to authenticated;
grant execute on function public.respond_inspection_item(uuid, text, text) to authenticated;

-- ───────────────────────── 2) 집 이력 품목 ─────────────────────────
create table public.home_items (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete restrict,
  category text not null check (category in ('boiler', 'aircon', 'water_heater', 'wallpaper', 'flooring', 'faucet', 'door_lock', 'appliance', 'other')),
  name text not null check (char_length(trim(name)) between 1 and 40),
  installed_on date,
  replaced_on date,
  note text check (note is null or char_length(note) <= 200),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (replaced_on is null or installed_on is null or replaced_on >= installed_on)
);
create index home_items_home_idx on public.home_items(home_id) where status = 'active';
alter table public.home_items enable row level security;
-- 품목·날짜는 사람 정보가 아니라 집 정보라서 그 집을 지금 볼 수 있는 사람이 본다.
create policy "home_items_select" on public.home_items for select to authenticated using (status = 'active' and public.has_active_home_access(home_id));
grant select on public.home_items to authenticated;

-- 쓰는 사람: 사무소 구성원, 현재 계약의 임대인.
create or replace function public.can_edit_home_items(p_home_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_access_office_home(p_home_id) or exists (
    select 1 from public.home_memberships membership join public.contracts contract on contract.id = membership.contract_id
    where membership.home_id = p_home_id and membership.user_id = auth.uid() and membership.relationship_role = 'landlord'
      and membership.status = 'active' and membership.ended_at is null and contract.status = 'active'
      and (membership.expires_at is null or membership.expires_at > now())
  );
$$;
revoke all on function public.can_edit_home_items(uuid) from public, anon;
grant execute on function public.can_edit_home_items(uuid) to authenticated;

create or replace function public.save_home_item(p_home_id uuid, p_item_id uuid, p_category text, p_name text, p_installed_on date, p_replaced_on date, p_note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.can_edit_home_items(p_home_id) then raise exception 'permission_denied'; end if;
  if p_item_id is null then
    insert into public.home_items (home_id, category, name, installed_on, replaced_on, note, created_by, updated_by)
    values (p_home_id, p_category, trim(p_name), p_installed_on, p_replaced_on, nullif(trim(coalesce(p_note, '')), ''), auth.uid(), auth.uid())
    returning id into v_id;
  else
    update public.home_items set category = p_category, name = trim(p_name), installed_on = p_installed_on, replaced_on = p_replaced_on,
      note = nullif(trim(coalesce(p_note, '')), ''), updated_by = auth.uid(), updated_at = now()
    where id = p_item_id and home_id = p_home_id and status = 'active' returning id into v_id;
    if v_id is null then raise exception 'not_found'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.archive_home_item(p_item_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_home uuid;
begin
  select home_id into v_home from public.home_items where id = p_item_id and status = 'active';
  if v_home is null or not public.can_edit_home_items(v_home) then raise exception 'permission_denied'; end if;
  update public.home_items set status = 'archived', updated_by = auth.uid(), updated_at = now() where id = p_item_id;
end;
$$;
revoke all on function public.save_home_item(uuid, uuid, text, text, date, date, text) from public, anon;
revoke all on function public.archive_home_item(uuid) from public, anon;
grant execute on function public.save_home_item(uuid, uuid, text, text, date, date, text) to authenticated;
grant execute on function public.archive_home_item(uuid) to authenticated;

-- ───────────────────────── 3) 집신 파트너 등록 ─────────────────────────
-- 지금은 사업자만 받는다(개인 이모님은 법률 자문 뒤, DEC-038). 확인은 집신 운영자가 서버에서 한다(이 migration에 승인 화면 없음).
create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  partner_kind text not null check (partner_kind in ('broker', 'repair', 'cleaning')),
  applicant_type text not null default 'business' check (applicant_type in ('business')),
  business_name text not null check (char_length(trim(business_name)) between 2 and 60),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'withdrawn')),
  review_note text check (review_note is null or char_length(review_note) <= 300),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);
create unique index partner_applications_open_kind on public.partner_applications(user_id, partner_kind) where status in ('draft', 'submitted', 'approved');

create table public.partner_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.partner_applications(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  document_kind text not null check (document_kind in ('business_registration', 'brokerage_registration', 'broker_license')),
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 200),
  media_type text not null check (media_type in ('image/jpeg', 'image/png', 'application/pdf')),
  byte_size bigint not null check (byte_size between 1 and 10485760),
  status text not null default 'pending' check (status in ('pending', 'ready', 'replaced')),
  created_at timestamptz not null default now()
);
create unique index partner_documents_one_ready on public.partner_documents(application_id, document_kind) where status = 'ready';

alter table public.partner_applications enable row level security;
alter table public.partner_documents enable row level security;
create policy "partner_applications_select_own" on public.partner_applications for select to authenticated using (user_id = auth.uid());
create policy "partner_documents_select_own" on public.partner_documents for select to authenticated using (user_id = auth.uid());
grant select on public.partner_applications, public.partner_documents to authenticated;

create or replace function public.partner_required_documents(p_kind text) returns text[]
language sql immutable set search_path = public as $$
  select case p_kind when 'broker' then array['business_registration', 'brokerage_registration', 'broker_license'] else array['business_registration'] end;
$$;
grant execute on function public.partner_required_documents(text) to authenticated;

create or replace function public.start_partner_application(p_kind text, p_business_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.account_has_verified_phone(auth.uid()) then raise exception 'permission_denied'; end if;
  if p_kind not in ('broker', 'repair', 'cleaning') then raise exception 'invalid_kind'; end if;
  select id into v_id from public.partner_applications where user_id = auth.uid() and partner_kind = p_kind and status in ('draft', 'submitted', 'approved');
  if v_id is not null then
    update public.partner_applications set business_name = trim(p_business_name) where id = v_id and status = 'draft';
    return v_id;
  end if;
  insert into public.partner_applications (user_id, partner_kind, business_name) values (auth.uid(), p_kind, trim(p_business_name)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.prepare_partner_document(p_application_id uuid, p_kind text, p_original_name text, p_media_type text, p_byte_size bigint) returns table (document_id uuid, storage_path text)
language plpgsql security definer set search_path = public as $$
declare v_app public.partner_applications; v_doc uuid := gen_random_uuid(); v_path text;
begin
  select * into v_app from public.partner_applications where id = p_application_id;
  if v_app.id is null or v_app.user_id <> auth.uid() then raise exception 'permission_denied'; end if;
  if v_app.status <> 'draft' then raise exception 'application_locked'; end if;
  if not (p_kind = any(public.partner_required_documents(v_app.partner_kind))) then raise exception 'invalid_document_kind'; end if;
  v_path := auth.uid()::text || '/' || p_application_id::text || '/' || v_doc::text
    || case p_media_type when 'application/pdf' then '.pdf' when 'image/png' then '.png' else '.jpg' end;
  insert into public.partner_documents (id, application_id, user_id, document_kind, storage_path, original_name, media_type, byte_size)
  values (v_doc, p_application_id, auth.uid(), p_kind, v_path, p_original_name, p_media_type, p_byte_size);
  return query select v_doc, v_path;
end;
$$;

create or replace function public.complete_partner_document(p_document_id uuid) returns void
language plpgsql security definer set search_path = public, storage as $$
declare v public.partner_documents;
begin
  select * into v from public.partner_documents where id = p_document_id for update;
  if v.id is null or v.user_id <> auth.uid() or v.status <> 'pending' then raise exception 'permission_denied'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'partner-documents' and name = v.storage_path) then raise exception 'upload_missing'; end if;
  update public.partner_documents set status = 'replaced' where application_id = v.application_id and document_kind = v.document_kind and status = 'ready';
  update public.partner_documents set status = 'ready' where id = p_document_id;
end;
$$;

create or replace function public.submit_partner_application(p_application_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_app public.partner_applications; v_missing int;
begin
  select * into v_app from public.partner_applications where id = p_application_id for update;
  if v_app.id is null or v_app.user_id <> auth.uid() then raise exception 'permission_denied'; end if;
  if v_app.status <> 'draft' then raise exception 'application_locked'; end if;
  select count(*) into v_missing from unnest(public.partner_required_documents(v_app.partner_kind)) as required(kind)
  where not exists (select 1 from public.partner_documents d where d.application_id = p_application_id and d.document_kind = required.kind and d.status = 'ready');
  if v_missing > 0 then raise exception 'documents_required'; end if;
  update public.partner_applications set status = 'submitted', submitted_at = now() where id = p_application_id;
end;
$$;

revoke all on function public.start_partner_application(text, text) from public, anon;
revoke all on function public.prepare_partner_document(uuid, text, text, text, bigint) from public, anon;
revoke all on function public.complete_partner_document(uuid) from public, anon;
revoke all on function public.submit_partner_application(uuid) from public, anon;
grant execute on function public.start_partner_application(text, text) to authenticated;
grant execute on function public.prepare_partner_document(uuid, text, text, text, bigint) to authenticated;
grant execute on function public.complete_partner_document(uuid) to authenticated;
grant execute on function public.submit_partner_application(uuid) to authenticated;

-- 서류 저장소: 비공개. 본인 폴더에 미리 준비된(pending) 파일만 올리고, 본인 파일만 읽는다. 운영자 확인은 서버(service role)로만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('partner-documents', 'partner-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf'];

create policy "partner_documents_insert_prepared" on storage.objects for insert to authenticated
with check (bucket_id = 'partner-documents' and exists (
  select 1 from public.partner_documents d where d.storage_path = name and d.user_id = auth.uid() and d.status = 'pending'
));
create policy "partner_documents_select_own" on storage.objects for select to authenticated
using (bucket_id = 'partner-documents' and exists (
  select 1 from public.partner_documents d where d.storage_path = name and d.user_id = auth.uid()
));

commit;
