-- 고객 개인 집 추가: 본인만 보고, 기록·사진은 기존 규칙 그대로 (migration 202610200001)
\set ON_ERROR_STOP 1
begin;
\ir 05_fixture.sql
\o /dev/null
create temp table zt_ids (k text primary key, v uuid);
grant all on zt_ids to authenticated;
reset role;
insert into public.profiles (user_id, display_name, phone_verified_at) values ('10000000-0000-4000-8000-000000000007', '개인', now())
  on conflict (user_id) do update set phone_verified_at = now();
set local role authenticated;

select zt_check.as_user('10000000-0000-4000-8000-000000000006');
select zt_check.expect(zt_check.try($q$select public.create_personal_home('서울 노원구 공릉로 99', '101호', '우리집', 'tenant', gen_random_uuid())$q$) like '%permission_denied%', '휴대폰 확인 안 한 사람: 집 추가 못 함');

select zt_check.as_user('10000000-0000-4000-8000-000000000007');
insert into zt_ids select 'h1', public.create_personal_home('서울 노원구 공릉로 99', '101호', '우리집', 'tenant', '90000000-0000-4000-8000-000000000001');
select zt_check.expect((select v from zt_ids where k = 'h1') is not null, '개인: 집 추가');
select zt_check.expect(public.create_personal_home('서울 노원구 공릉로 99', '101호', '우리집', 'tenant', '90000000-0000-4000-8000-000000000001') = (select v from zt_ids where k = 'h1'), '같은 요청 두 번 → 같은 집');
insert into zt_ids select 'h2', public.create_personal_home('서울 노원구 공릉로 77', null, '세 준 집', 'landlord', gen_random_uuid());
select zt_check.expect((select count(*) from public.offices where office_kind = 'personal') = 1, '개인 공간은 하나');
select zt_check.expect(zt_check.visible('public.homes') = 2, '개인: 내 집 2채 봄');
select zt_check.expect((select count(*) from public.home_memberships where user_id = '10000000-0000-4000-8000-000000000007') = 2, '관계(사는 집·세 준 집) 2개');
select zt_check.expect(zt_check.try(format($q$select public.create_home_record(%L, (select id from public.offices where office_kind = 'personal'), null, 'office_internal', 'note', '관리비 메모', null, gen_random_uuid(), null, null)$q$, (select v from zt_ids where k = 'h1'))) = 'ok', '개인: 나만 보기 메모 남김');
select zt_check.expect(zt_check.try($q$select public.create_personal_home('서울', null, null, 'owner', gen_random_uuid())$q$) <> 'ok', '잘못된 관계·짧은 주소 거절');

select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect((select count(*) from public.homes where id = (select v from zt_ids where k = 'h1')) = 0, '다른 사무소 대표: 개인 집 못 봄');
select zt_check.expect((select count(*) from public.records where title = '관리비 메모') = 0, '다른 사람: 개인 메모 못 봄');
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect((select count(*) from public.offices where office_kind = 'personal') = 0, '다른 사람: 남의 개인 공간 못 봄');
select zt_check.expect(zt_check.try(format($q$select public.create_home_for_office((select id from public.offices where created_by = '10000000-0000-4000-8000-000000000007' and office_kind = 'personal'), '서울 노원구 몰래로 1', null, null, gen_random_uuid())$q$)) <> 'ok', '다른 사람: 남의 개인 공간에 집 못 넣음');

-- 주소록
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect(zt_check.try($q$insert into public.home_contacts (user_id, home_id, category, name, phone) values ('10000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', 'agent', '공릉부동산', '02-123-4567')$q$) = 'ok', '임차인: 내 집에 부동산 연락처 추가');
select zt_check.expect(zt_check.try($q$insert into public.home_contacts (user_id, category, name, phone) values ('10000000-0000-4000-8000-000000000004', 'moving', '번개이사', '010-0000-0000')$q$) = 'ok', '집 없이 이사업체 추가');
select zt_check.expect(zt_check.try($q$insert into public.home_contacts (user_id, home_id, category, name) values ('10000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'other', '남의 집')$q$) <> 'ok', '못 보는 집에는 연결 못 함');
select zt_check.expect(zt_check.try($q$insert into public.home_contacts (user_id, category, name) values ('10000000-0000-4000-8000-000000000005', 'other', '남 명의')$q$) <> 'ok', '남의 이름으로 추가 못 함');
select zt_check.expect(zt_check.try($q$insert into public.home_contacts (user_id, category, name, phone) values ('10000000-0000-4000-8000-000000000004', 'other', '이상한 번호', 'abc')$q$) <> 'ok', '전화번호 모양 검사');
select zt_check.expect(zt_check.visible('public.home_contacts') = 2, '임차인: 내 주소록 2개');
select zt_check.as_user('10000000-0000-4000-8000-000000000005');
select zt_check.expect(zt_check.visible('public.home_contacts') = 0, '같은 집 임대인도 임차인 주소록 못 봄');
select zt_check.expect(zt_check.changed($q$delete from public.home_contacts$q$) = 0, '남의 주소록 못 지움');
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.visible('public.home_contacts') = 0, '사무소 대표도 못 봄');

reset role;
\o
select n, case when ok then 'PASS' else 'FAIL' end as result, label from zt_check.results order by n;
select format('합계: %s개 중 %s개 통과', count(*), count(*) filter (where ok)) from zt_check.results;
do $$ begin if exists (select 1 from zt_check.results where not ok) then raise exception '개인 집 검사 실패'; end if; end $$;
rollback;
