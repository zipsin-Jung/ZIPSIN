-- 고객도 직접 "+ 집 추가" (대표 Figma My Home, 2026-10-20 대표 지적 "등록하기 기록하기 하나도 안 되는데").
-- 방법: 사람마다 보이지 않는 '개인 기록 공간'(office_kind = 'personal')을 하나 두고 기존 집·기록·사진·입주 기록 권한을 그대로 쓴다.
--  - 개인 공간 구성원은 만든 사람 한 명뿐 → 그 집의 '나만 보기'(office_internal) 기록은 본인만 본다.
--  - 다른 사람을 초대하지 않는 한 아무도 그 집을 볼 수 없다. 기존 사무소·RLS 규칙은 바꾸지 않는다.
begin;

alter table public.offices add column if not exists office_kind text not null default 'office'
  check (office_kind in ('office', 'personal'));
create unique index if not exists offices_one_personal_per_user on public.offices (created_by) where office_kind = 'personal';

create or replace function public.create_personal_home(
  p_address_line1 text, p_address_detail text, p_home_label text, p_relation text, p_idempotency_key uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_office uuid; v_home uuid;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if not public.account_has_verified_phone(v_user) then raise exception 'permission_denied'; end if;
  if p_relation not in ('tenant', 'landlord') then raise exception 'invalid_input'; end if;
  perform pg_advisory_xact_lock(hashtextextended('personal-office:' || v_user::text, 0));
  select id into v_office from public.offices where created_by = v_user and office_kind = 'personal';
  if v_office is null then
    insert into public.offices (name, created_by, office_kind) values ('내 집 기록', v_user, 'personal') returning id into v_office;
    insert into public.office_memberships (office_id, user_id, office_role, status) values (v_office, v_user, 'principal_broker', 'active');
  end if;
  v_home := public.create_home_for_office(v_office, p_address_line1, p_address_detail, p_home_label, p_idempotency_key);
  if not exists (select 1 from public.home_memberships where home_id = v_home and user_id = v_user and relationship_role = p_relation and contract_id is null) then
    insert into public.home_memberships (home_id, contract_id, user_id, relationship_role, status, access_scope)
    values (v_home, null, v_user, p_relation, 'active', 'shared_history'); -- 계약 전이라 계약 칸 없음(규칙상 shared_history)
  end if;
  return v_home;
end;
$$;
revoke all on function public.create_personal_home(text, text, text, text, uuid) from public, anon;
grant execute on function public.create_personal_home(text, text, text, text, uuid) to authenticated;

-- 집 주소록 (대표 요청 2026-10-20: 계약한 부동산·임대인·기사님·이사업체 연락처를 집별로).
-- 내 주소록은 나만 본다. 집과 연결해도 그 집의 다른 관계자에게 보이지 않는다(상대의 연락처를 공유하지 않음).
create table if not exists public.home_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  category text not null check (category in ('agent', 'landlord', 'tenant', 'repair', 'moving', 'cleaning', 'management', 'other')),
  name text not null check (char_length(trim(name)) between 1 and 40),
  phone text check (phone is null or phone ~ '^[0-9+() -]{7,20}$'),
  memo text check (memo is null or char_length(memo) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists home_contacts_user_idx on public.home_contacts (user_id, home_id);
alter table public.home_contacts enable row level security;
drop policy if exists "home_contacts_select_own" on public.home_contacts;
create policy "home_contacts_select_own" on public.home_contacts for select to authenticated using (user_id = auth.uid());
drop policy if exists "home_contacts_insert_own" on public.home_contacts;
create policy "home_contacts_insert_own" on public.home_contacts for insert to authenticated
  with check (user_id = auth.uid() and (home_id is null or public.has_active_home_access(home_id)));
drop policy if exists "home_contacts_update_own" on public.home_contacts;
create policy "home_contacts_update_own" on public.home_contacts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and (home_id is null or public.has_active_home_access(home_id)));
drop policy if exists "home_contacts_delete_own" on public.home_contacts;
create policy "home_contacts_delete_own" on public.home_contacts for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.home_contacts to authenticated;

commit;
