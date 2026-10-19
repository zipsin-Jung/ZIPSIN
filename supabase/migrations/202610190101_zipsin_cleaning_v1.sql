-- 집신청소 v1 (2026-10-19) — 설계: docs/technical/zipsin-cleaning-v1-data-model.md
-- 손님이 업체를 고르고, 업체가 수락하면 가격이 확정된다. 작업 시작 뒤 가격은 어떤 경로로도 바뀌지 않는다.
-- 업체는 예약 표를 직접 읽지 못하고 clean_partner_jobs()로 상태에 맞게 가려진 값만 본다.
-- 앱 결제 없음. 운영자는 clean_operators에 SQL로 직접 넣는다.
begin;

create extension if not exists pgcrypto;

-- ── 표 ───────────────────────────────────────────────────────────────
create table if not exists public.clean_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.clean_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  kind text not null default 'company' check (kind in ('company', 'individual')),
  area text not null default '' check (char_length(area) <= 40),
  team text not null default '' check (char_length(team) <= 40),
  checks text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'suspended', 'red_card')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clean_partner_members (
  partner_id uuid not null references public.clean_partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  primary key (partner_id, user_id)
);

create table if not exists public.clean_partner_invites (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.clean_partners(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id),
  used_by uuid references auth.users(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.clean_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  partner_id uuid not null references public.clean_partners(id) on delete restrict,
  service text not null check (service in ('move_in', 'tidy')),
  facts jsonb not null,
  area_pyeong numeric(5,1) not null check (area_pyeong between 5 and 80),
  grade smallint not null check (grade between 1 and 3),
  people smallint not null check (people between 1 and 10),
  hours numeric(4,1) not null check (hours > 0 and hours <= 24),
  price_won integer not null check (price_won > 0),
  price_table_version text not null,
  includes text[] not null default '{}',
  area_district text not null check (char_length(area_district) between 1 and 40),
  service_date date not null,
  start_hour smallint not null check (start_hour between 6 and 20),
  arrival_hour smallint check (arrival_hour between 6 and 23),
  requests text[] not null default '{}',
  status text not null default 'requested' check (status in ('requested', 'accepted', 'declined', 'cancelled', 'working', 'done', 'redo', 'block_reported', 'completed')),
  partner_note text check (char_length(partner_note) <= 200),
  block_reason text check (char_length(block_reason) <= 40),
  block_note text check (char_length(block_note) <= 200),
  inspect_answers jsonb,
  portfolio_consent boolean not null default false,
  idempotency_key uuid not null,
  accepted_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, idempotency_key)
);
create index if not exists clean_bookings_partner_idx on public.clean_bookings(partner_id, status);
create index if not exists clean_bookings_customer_idx on public.clean_bookings(customer_id, created_at desc);

create table if not exists public.clean_booking_private (
  booking_id uuid primary key references public.clean_bookings(id) on delete cascade,
  detail_address text not null check (char_length(detail_address) between 1 and 100),
  contact_phone text not null check (contact_phone ~ '^0[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$'),
  memo text not null default '' check (char_length(memo) <= 200)
);

create table if not exists public.clean_booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.clean_bookings(id) on delete cascade,
  actor_id uuid references auth.users(id),
  actor_kind text not null check (actor_kind in ('customer', 'partner', 'operator', 'system')),
  action text not null,
  from_status text,
  to_status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clean_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  done_month date not null,
  service text not null check (char_length(service) between 1 and 20),
  partner_name text not null check (char_length(partner_name) between 1 and 40),
  area_district text not null check (char_length(area_district) between 1 and 40),
  price_won integer check (price_won is null or price_won between 1 and 100000000),
  memo text not null default '' check (char_length(memo) <= 200),
  created_at timestamptz not null default now()
);

create table if not exists public.clean_photos (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references public.clean_bookings(id) on delete cascade,
  record_id uuid references public.clean_records(id) on delete cascade,
  kind text not null check (kind in ('before', 'after', 'block', 'record')),
  storage_path text not null unique,
  status text not null default 'pending' check (status in ('pending', 'ready')),
  created_at timestamptz not null default now(),
  check ((kind = 'record') = (record_id is not null)),
  check ((kind <> 'record') = (booking_id is not null))
);
create index if not exists clean_photos_booking_idx on public.clean_photos(booking_id);
create index if not exists clean_photos_record_idx on public.clean_photos(record_id);

create table if not exists public.clean_visit_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('move_in', 'tidy', 'special')),
  special text[] not null default '{}',
  note text not null default '' check (char_length(note) <= 200),
  area_district text not null check (char_length(area_district) between 1 and 40),
  visit_date date not null,
  slot text not null check (slot in ('오전', '오후')),
  contact_phone text not null check (contact_phone ~ '^0[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$'),
  status text not null default 'requested' check (status in ('requested', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

-- ── 도우미 ────────────────────────────────────────────────────────────
create or replace function public.is_clean_operator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.clean_operators where user_id = auth.uid())
$$;

create or replace function public.is_clean_partner_member(p_partner_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clean_partner_members m join public.clean_partners p on p.id = m.partner_id
    where m.partner_id = p_partner_id and m.user_id = auth.uid() and m.status = 'active' and p.status = 'active'
  )
$$;

create or replace function public.can_view_clean_photo(p_photo_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clean_photos ph
    left join public.clean_bookings b on b.id = ph.booking_id
    where ph.id = p_photo_id and (
      ph.uploader_id = auth.uid()
      or public.is_clean_operator()
      or (b.id is not null and b.customer_id = auth.uid())
      or (b.id is not null and public.is_clean_partner_member(b.partner_id))
      or (ph.status = 'ready' and ph.kind in ('before', 'after') and b.status = 'completed' and b.portfolio_consent and auth.uid() is not null)
    )
  )
$$;

revoke all on function public.is_clean_operator() from public;
revoke all on function public.is_clean_partner_member(uuid) from public;
revoke all on function public.can_view_clean_photo(uuid) from public;
grant execute on function public.is_clean_operator() to authenticated;
grant execute on function public.is_clean_partner_member(uuid) to authenticated;
grant execute on function public.can_view_clean_photo(uuid) to authenticated;

-- ── 권한(RLS) ─────────────────────────────────────────────────────────
alter table public.clean_operators enable row level security;
alter table public.clean_partners enable row level security;
alter table public.clean_partner_members enable row level security;
alter table public.clean_partner_invites enable row level security;
alter table public.clean_bookings enable row level security;
alter table public.clean_booking_private enable row level security;
alter table public.clean_booking_events enable row level security;
alter table public.clean_records enable row level security;
alter table public.clean_photos enable row level security;
alter table public.clean_visit_requests enable row level security;

revoke all on public.clean_operators, public.clean_partners, public.clean_partner_members, public.clean_partner_invites,
  public.clean_bookings, public.clean_booking_private, public.clean_booking_events, public.clean_records,
  public.clean_photos, public.clean_visit_requests from anon, authenticated;

create policy clean_operators_self on public.clean_operators for select using (user_id = auth.uid());
grant select on public.clean_operators to authenticated;

create policy clean_partners_read on public.clean_partners for select using (status = 'active' or public.is_clean_operator());
grant select on public.clean_partners to authenticated;

create policy clean_partner_members_read on public.clean_partner_members for select using (user_id = auth.uid() or public.is_clean_operator());
grant select on public.clean_partner_members to authenticated;

create policy clean_partner_invites_operator on public.clean_partner_invites for select using (public.is_clean_operator());
grant select on public.clean_partner_invites to authenticated;

-- 예약: 손님 본인·운영자만 직접 읽는다. 쓰기는 RPC로만.
create policy clean_bookings_read on public.clean_bookings for select using (customer_id = auth.uid() or public.is_clean_operator());
grant select on public.clean_bookings to authenticated;

create policy clean_booking_private_read on public.clean_booking_private for select using (
  public.is_clean_operator() or exists (select 1 from public.clean_bookings b where b.id = booking_id and b.customer_id = auth.uid())
);
grant select on public.clean_booking_private to authenticated;

create policy clean_booking_events_read on public.clean_booking_events for select using (
  public.is_clean_operator() or exists (select 1 from public.clean_bookings b where b.id = booking_id and b.customer_id = auth.uid())
);
grant select on public.clean_booking_events to authenticated;

-- 마이페이지 직접 기록: 본인만
create policy clean_records_owner on public.clean_records for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
grant select, insert, update, delete on public.clean_records to authenticated;

create policy clean_photos_read on public.clean_photos for select using (public.can_view_clean_photo(id));
grant select on public.clean_photos to authenticated;

create policy clean_visit_requests_read on public.clean_visit_requests for select using (customer_id = auth.uid() or public.is_clean_operator());
create policy clean_visit_requests_insert on public.clean_visit_requests for insert with check (customer_id = auth.uid() and status = 'requested');
grant select, insert on public.clean_visit_requests to authenticated;

-- ── 예약 만들기: 서버(service_role)만. 가격은 서버가 계산해 넘긴다 ───────────
create or replace function public.create_clean_booking(
  p_customer_id uuid, p_partner_id uuid, p_service text, p_facts jsonb, p_area_pyeong numeric,
  p_grade smallint, p_people smallint, p_hours numeric, p_price_won integer, p_price_table_version text,
  p_includes text[], p_area_district text, p_service_date date, p_start_hour smallint, p_arrival_hour smallint,
  p_requests text[], p_detail_address text, p_contact_phone text, p_memo text, p_idempotency_key uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.clean_partners where id = p_partner_id and status = 'active') then
    raise exception 'partner_unavailable';
  end if;
  if p_service_date <= (now() at time zone 'Asia/Seoul')::date then raise exception 'invalid_input'; end if;
  select id into v_id from public.clean_bookings where customer_id = p_customer_id and idempotency_key = p_idempotency_key;
  if v_id is not null then return v_id; end if;
  insert into public.clean_bookings (customer_id, partner_id, service, facts, area_pyeong, grade, people, hours, price_won,
    price_table_version, includes, area_district, service_date, start_hour, arrival_hour, requests, idempotency_key)
  values (p_customer_id, p_partner_id, p_service, p_facts, p_area_pyeong, p_grade, p_people, p_hours, p_price_won,
    p_price_table_version, coalesce(p_includes, '{}'), p_area_district, p_service_date, p_start_hour, p_arrival_hour,
    coalesce(p_requests, '{}'), p_idempotency_key)
  returning id into v_id;
  insert into public.clean_booking_private (booking_id, detail_address, contact_phone, memo)
  values (v_id, p_detail_address, p_contact_phone, coalesce(p_memo, ''));
  insert into public.clean_booking_events (booking_id, actor_id, actor_kind, action, from_status, to_status)
  values (v_id, p_customer_id, 'customer', 'create', null, 'requested');
  return v_id;
end $$;
revoke all on function public.create_clean_booking(uuid, uuid, text, jsonb, numeric, smallint, smallint, numeric, integer, text, text[], text, date, smallint, smallint, text[], text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.create_clean_booking(uuid, uuid, text, jsonb, numeric, smallint, smallint, numeric, integer, text, text[], text, date, smallint, smallint, text[], text, text, text, uuid) to service_role;

-- ── 상태 바꾸기: 하나의 문으로만. 가격 칸은 건드리지 않는다 ─────────────────
create or replace function public.clean_booking_action(
  p_booking_id uuid, p_action text, p_note text default null, p_reason text default null,
  p_answers jsonb default null, p_consent boolean default false
) returns text
language plpgsql security definer set search_path = public as $$
declare
  b public.clean_bookings%rowtype;
  v_to text;
  v_kind text;
begin
  select * into b from public.clean_bookings where id = p_booking_id for update;
  if not found then raise exception 'not_found'; end if;

  if p_action in ('cancel', 'approve', 'request_redo') then
    if b.customer_id is distinct from auth.uid() then raise exception 'permission_denied'; end if;
    v_kind := 'customer';
  elsif p_action in ('accept', 'decline', 'start', 'finish', 'report_block', 'note') then
    if not public.is_clean_partner_member(b.partner_id) then raise exception 'permission_denied'; end if;
    v_kind := 'partner';
  elsif p_action = 'confirm_block' then
    if not public.is_clean_operator() then raise exception 'permission_denied'; end if;
    v_kind := 'operator';
  else
    raise exception 'invalid_input';
  end if;

  v_to := case
    when p_action = 'cancel' and b.status in ('requested', 'accepted') then 'cancelled'
    when p_action = 'approve' and b.status = 'done' then 'completed'
    when p_action = 'request_redo' and b.status = 'done' then 'redo'
    when p_action = 'accept' and b.status = 'requested' then 'accepted'
    when p_action = 'decline' and b.status = 'requested' then 'declined'
    when p_action = 'start' and b.status = 'accepted' then 'working'
    when p_action = 'finish' and b.status in ('working', 'redo') then 'done'
    when p_action = 'report_block' and b.status = 'accepted' then 'block_reported'
    when p_action = 'note' and b.status in ('working', 'redo', 'done') then b.status
    when p_action = 'confirm_block' and b.status = 'block_reported' then 'cancelled'
    else null end;
  if v_to is null then raise exception 'invalid_state'; end if;

  if p_action = 'finish' and not exists (
    select 1 from public.clean_photos where booking_id = b.id and kind = 'after' and status = 'ready'
  ) then raise exception 'after_photo_required'; end if;
  if p_action = 'report_block' and (p_reason is null or char_length(p_reason) = 0) then raise exception 'invalid_input'; end if;
  if p_action = 'request_redo' and p_answers is null then raise exception 'invalid_input'; end if;

  update public.clean_bookings set
    status = v_to,
    accepted_at = case when p_action = 'accept' then now() else accepted_at end,
    started_at = case when p_action = 'start' then now() else started_at end,
    finished_at = case when p_action = 'finish' then now() else finished_at end,
    completed_at = case when p_action = 'approve' then now() else completed_at end,
    cancelled_at = case when v_to = 'cancelled' then now() else cancelled_at end,
    partner_note = case when p_action in ('note', 'finish') and p_note is not null then left(p_note, 200) else partner_note end,
    block_reason = case when p_action = 'report_block' then left(p_reason, 40) else block_reason end,
    block_note = case when p_action = 'report_block' then left(coalesce(p_note, ''), 200) else block_note end,
    inspect_answers = case when p_action in ('approve', 'request_redo') then p_answers else inspect_answers end,
    portfolio_consent = case when p_action = 'approve' then coalesce(p_consent, false) else portfolio_consent end,
    updated_at = now()
  where id = b.id;

  if p_action <> 'note' then
    insert into public.clean_booking_events (booking_id, actor_id, actor_kind, action, from_status, to_status)
    values (b.id, auth.uid(), v_kind, p_action, b.status, v_to);
  end if;
  return v_to;
end $$;
revoke all on function public.clean_booking_action(uuid, text, text, text, jsonb, boolean) from public, anon;
grant execute on function public.clean_booking_action(uuid, text, text, text, jsonb, boolean) to authenticated;

-- ── 업체가 보는 작업 목록: 상태에 따라 가린다 ─────────────────────────────
create or replace function public.clean_partner_jobs()
returns table (
  id uuid, partner_id uuid, status text, service text, area_pyeong numeric, facts jsonb, grade smallint, people smallint,
  hours numeric, price_won integer, includes text[], area_district text, service_date date, start_hour smallint,
  arrival_hour smallint, requests text[], memo text, detail_address text, contact_phone text, partner_note text,
  portfolio_consent boolean, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select b.id, b.partner_id, b.status, b.service, b.area_pyeong, b.facts, b.grade, b.people, b.hours, b.price_won, b.includes,
    b.area_district, b.service_date, b.start_hour, b.arrival_hour,
    case when b.status in ('requested', 'accepted', 'working', 'done', 'redo', 'block_reported') then b.requests else '{}'::text[] end,
    case when b.status in ('requested', 'accepted', 'working', 'done', 'redo', 'block_reported') then p.memo else '' end,
    case when b.status in ('accepted', 'working', 'done', 'redo', 'block_reported') then p.detail_address end,
    case when b.status in ('accepted', 'working', 'done', 'redo', 'block_reported') then p.contact_phone end,
    b.partner_note, b.portfolio_consent, b.created_at
  from public.clean_bookings b
  join public.clean_booking_private p on p.booking_id = b.id
  where public.is_clean_partner_member(b.partner_id)
  order by b.service_date desc, b.created_at desc
$$;
revoke all on function public.clean_partner_jobs() from public, anon;
grant execute on function public.clean_partner_jobs() to authenticated;

-- 업체를 고를 때 보이는 숫자: 실제 완료 건수만(꾸민 비율 없음)
create or replace function public.clean_partner_stats()
returns table (partner_id uuid, completed_count integer)
language sql stable security definer set search_path = public as $$
  select p.id, (select count(*)::int from public.clean_bookings b where b.partner_id = p.id and b.status = 'completed')
  from public.clean_partners p where p.status = 'active'
$$;
revoke all on function public.clean_partner_stats() from public, anon;
grant execute on function public.clean_partner_stats() to authenticated;

-- ── 업체 초대 ────────────────────────────────────────────────────────
create or replace function public.create_clean_partner(p_name text, p_kind text, p_area text, p_team text, p_checks text[])
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_clean_operator() then raise exception 'permission_denied'; end if;
  insert into public.clean_partners (name, kind, area, team, checks) values (p_name, p_kind, coalesce(p_area, ''), coalesce(p_team, ''), coalesce(p_checks, '{}'))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.set_clean_partner_status(p_partner_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_clean_operator() then raise exception 'permission_denied'; end if;
  update public.clean_partners set status = p_status, updated_at = now() where id = p_partner_id;
  if not found then raise exception 'not_found'; end if;
end $$;

-- 코드는 화면에 한 번만 보이고 DB에는 해시만 남는다. 14일 뒤 만료.
create or replace function public.create_clean_partner_invite(p_partner_id uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_code text;
begin
  if not public.is_clean_operator() then raise exception 'permission_denied'; end if;
  if not exists (select 1 from public.clean_partners where id = p_partner_id) then raise exception 'not_found'; end if;
  v_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10));
  insert into public.clean_partner_invites (partner_id, code_hash, expires_at, created_by)
  values (p_partner_id, encode(digest(v_code, 'sha256'), 'hex'), now() + interval '14 days', auth.uid());
  return v_code;
end $$;

create or replace function public.redeem_clean_partner_invite(p_code text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare inv public.clean_partner_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'permission_denied'; end if;
  select * into inv from public.clean_partner_invites
  where code_hash = encode(digest(upper(trim(p_code)), 'sha256'), 'hex') for update;
  if not found or inv.used_at is not null or inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  update public.clean_partner_invites set used_by = auth.uid(), used_at = now() where id = inv.id;
  insert into public.clean_partner_members (partner_id, user_id) values (inv.partner_id, auth.uid())
  on conflict (partner_id, user_id) do update set status = 'active', ended_at = null;
  return inv.partner_id;
end $$;

revoke all on function public.create_clean_partner(text, text, text, text, text[]) from public, anon;
revoke all on function public.set_clean_partner_status(uuid, text) from public, anon;
revoke all on function public.create_clean_partner_invite(uuid) from public, anon;
revoke all on function public.redeem_clean_partner_invite(text) from public, anon;
grant execute on function public.create_clean_partner(text, text, text, text, text[]) to authenticated;
grant execute on function public.set_clean_partner_status(uuid, text) to authenticated;
grant execute on function public.create_clean_partner_invite(uuid) to authenticated;
grant execute on function public.redeem_clean_partner_invite(text) to authenticated;

-- ── 사진 ─────────────────────────────────────────────────────────────
-- 준비: 권한 확인 후 pending 행과 경로를 만든다. 완료: 저장소에 파일이 있으면 ready.
create or replace function public.prepare_clean_photo(p_kind text, p_booking_id uuid default null, p_record_id uuid default null)
returns table (photo_id uuid, storage_path text)
language plpgsql security definer set search_path = public as $$
declare b public.clean_bookings%rowtype; v_id uuid := gen_random_uuid(); v_path text;
begin
  if auth.uid() is null then raise exception 'permission_denied'; end if;
  if p_kind = 'record' then
    if not exists (select 1 from public.clean_records where id = p_record_id and owner_id = auth.uid()) then raise exception 'permission_denied'; end if;
  elsif p_kind in ('before', 'after', 'block') then
    select * into b from public.clean_bookings where id = p_booking_id;
    if not found or not public.is_clean_partner_member(b.partner_id) then raise exception 'permission_denied'; end if;
    if b.status not in ('accepted', 'working', 'redo', 'done') then raise exception 'invalid_state'; end if;
  else
    raise exception 'invalid_input';
  end if;
  if (select count(*) from public.clean_photos where (booking_id = p_booking_id or record_id = p_record_id)) >= 30 then raise exception 'too_many_photos'; end if;
  v_path := auth.uid()::text || '/' || v_id::text || '.jpg';
  insert into public.clean_photos (id, uploader_id, booking_id, record_id, kind, storage_path)
  values (v_id, auth.uid(), case when p_kind = 'record' then null else p_booking_id end, case when p_kind = 'record' then p_record_id else null end, p_kind, v_path);
  return query select v_id, v_path;
end $$;

create or replace function public.complete_clean_photo(p_photo_id uuid) returns void
language plpgsql security definer set search_path = public, storage as $$
declare ph public.clean_photos%rowtype;
begin
  select * into ph from public.clean_photos where id = p_photo_id and uploader_id = auth.uid() for update;
  if not found then raise exception 'not_found'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'clean-photos' and name = ph.storage_path) then raise exception 'upload_missing'; end if;
  update public.clean_photos set status = 'ready' where id = ph.id;
end $$;

create or replace function public.delete_clean_record_photo(p_photo_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_path text;
begin
  delete from public.clean_photos where id = p_photo_id and uploader_id = auth.uid() and kind = 'record' returning storage_path into v_path;
  if v_path is null then raise exception 'not_found'; end if;
  return v_path;
end $$;

revoke all on function public.prepare_clean_photo(text, uuid, uuid) from public, anon;
revoke all on function public.complete_clean_photo(uuid) from public, anon;
revoke all on function public.delete_clean_record_photo(uuid) from public, anon;
grant execute on function public.prepare_clean_photo(text, uuid, uuid) to authenticated;
grant execute on function public.complete_clean_photo(uuid) to authenticated;
grant execute on function public.delete_clean_record_photo(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clean-photos', 'clean-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy clean_photos_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'clean-photos'
  and exists (select 1 from public.clean_photos ph where ph.storage_path = name and ph.uploader_id = auth.uid() and ph.status = 'pending')
);
create policy clean_photos_storage_select on storage.objects for select to authenticated using (
  bucket_id = 'clean-photos'
  and exists (select 1 from public.clean_photos ph where ph.storage_path = name and public.can_view_clean_photo(ph.id))
);
create policy clean_photos_storage_delete on storage.objects for delete to authenticated using (
  bucket_id = 'clean-photos' and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (select 1 from public.clean_photos ph where ph.storage_path = name and ph.kind <> 'record')
);

commit;
