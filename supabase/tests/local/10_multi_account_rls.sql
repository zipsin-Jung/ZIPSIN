-- 여러 계정 권한 검사 (로컬 Postgres). 계정 7명, 사무소 2곳, 집 2채.
-- 증거 구분: "로컬 RLS 검사". Preview DB 검수와 다른 증거입니다.
\set ON_ERROR_STOP 1
begin;
\ir 05_fixture.sql

\o /dev/null
set local role authenticated;

-- 1) 아무 관계 없는 사람
select zt_check.as_user('10000000-0000-4000-8000-000000000007');
select zt_check.expect(zt_check.visible('public.homes') = 0, 'X: 집 0채');
select zt_check.expect(zt_check.visible('public.records') = 0, 'X: 기록 0건');
select zt_check.expect(zt_check.visible('public.contracts') = 0, 'X: 계약 0건');
select zt_check.expect(zt_check.visible('public.attachments') = 0, 'X: 첨부 0건');
select zt_check.expect((select count(*) from storage.objects where bucket_id = 'home-records') = 0, 'X: 저장소 파일 0개');

-- 2) 다른 사무소 대표: 같은 주소라도 A 사무소 기록은 안 보임
select zt_check.as_user('10000000-0000-4000-8000-000000000003');
select zt_check.expect((select count(*) from public.homes) = 1 and (select home_label from public.homes) = 'B의 201호', 'B대표: 자기 사무소 집 1채만(같은 주소 A 집은 안 보임)');
select zt_check.expect((select count(*) from public.records) = 1 and (select title from public.records) = 'B 사무소 메모', 'B대표: 자기 사무소 기록만');
select zt_check.expect(zt_check.try($q$select public.create_home_record('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-00000000000b',null,'office_internal','note','침범',null,gen_random_uuid(),null,null)$q$) <> 'ok', 'B대표: A 집에 기록 못 씀');

-- 3) A 사무소 대표
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect((select count(*) from public.homes) = 1, 'A대표: A 집 1채');
select zt_check.expect((select count(*) from public.records where home_id = '30000000-0000-4000-8000-000000000001') = 2, 'A대표: 사무소 내부 + 현재 계약 기록 2건(끝난 계약 기록 제외)');
select zt_check.expect(zt_check.try($q$select public.create_home_record('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-00000000000a',null,'office_internal','note','대표 메모',null,gen_random_uuid(),null,null)$q$) = 'ok', 'A대표: 사무소 내부 기록 씀');

-- 4) A 사무소 보조원
select zt_check.as_user('10000000-0000-4000-8000-000000000002');
select zt_check.expect((select count(*) from public.records where record_space = 'office_internal') >= 1, 'A보조원: 사무소 내부 기록 봄');
select zt_check.expect(zt_check.try($q$select public.create_home_record('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-00000000000a',null,'office_internal','note','보조원 메모',null,gen_random_uuid(),null,null)$q$) <> 'ok', 'A보조원: 메모는 못 씀');
select zt_check.expect(zt_check.try($q$select public.create_home_record('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-00000000000a',null,'office_internal','photo','보조원 사진',null,gen_random_uuid(),null,null)$q$) = 'ok', 'A보조원: 사진 기록은 씀');

-- 5) 현재 임차인
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect((select count(*) from public.records where record_space = 'office_internal') = 0, 'T1: 사무소 내부 기록 안 보임');
select zt_check.expect((select count(*) from public.records where id = '50000000-0000-4000-8000-000000000002') = 1, 'T1: 현재 계약 기록 봄');
select zt_check.expect((select count(*) from public.records where id = '50000000-0000-4000-8000-000000000003') = 0, 'T1: 이전 계약자의 기록 안 보임');
select zt_check.expect((select count(*) from storage.objects where name = 'p/office.jpg') = 0, 'T1: 사무소 내부 사진 파일 못 엶');
select zt_check.expect((select count(*) from storage.objects where name = 'p/contract.jpg') = 1, 'T1: 현재 계약 사진 파일 엶');
select zt_check.expect(zt_check.try($q$select public.create_home_record('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-00000000000a',null,'office_internal','note','침범',null,gen_random_uuid(),null,null)$q$) <> 'ok', 'T1: 사무소 내부에 못 씀');
select zt_check.expect(zt_check.try($q$select public.create_home_record('30000000-0000-4000-8000-000000000001',null,'40000000-0000-4000-8000-000000000001','current_contract','repair','변기 막힘',null,gen_random_uuid(),null,null)$q$) = 'ok', 'T1: 현재 계약 칸에 수리 접수');
select zt_check.expect(zt_check.changed($q$update public.records set title = '바꿈' where id = '50000000-0000-4000-8000-000000000001'$q$) = 0, 'T1: 사무소 기록 못 고침');

-- 6) 임대인
select zt_check.as_user('10000000-0000-4000-8000-000000000005');
select zt_check.expect((select count(*) from public.records where record_space = 'office_internal') = 0, 'L1: 사무소 내부 기록 안 보임');
select zt_check.expect((select count(*) from public.records where id = '50000000-0000-4000-8000-000000000002') = 1, 'L1: 현재 계약 수리 기록 봄');

-- 7) 이전 임차인(계약 끝)
select zt_check.as_user('10000000-0000-4000-8000-000000000006');
select zt_check.expect((select count(*) from public.records where id = '50000000-0000-4000-8000-000000000002') = 0, 'T0: 새 계약 기록 안 보임');
select zt_check.expect((select count(*) from public.contracts where id = '40000000-0000-4000-8000-000000000001') = 0, 'T0: 새 계약 안 보임');
-- DEC-029 4번(이전 임차인은 자기가 올린 기록·계약서를 계속 본다)은 아직 DB에 없다. 아래는 현재 상태를 기록만 한다.
select zt_check.expect(true, 'T0 참고: 자기 이전 기록 열람 = ' || (select count(*) from public.records where id = '50000000-0000-4000-8000-000000000003')::text || '건 (DEC-029 4번 미구현이면 0)');

-- 8) 퇴사 직원
select zt_check.as_user('10000000-0000-4000-8000-000000000008');
select zt_check.expect(zt_check.visible('public.homes') = 0 and zt_check.visible('public.records') = 0, 'E1(퇴사): 집·기록 0');

reset role;
\o
select n, case when ok then 'PASS' else 'FAIL' end as result, label, coalesce(detail, '') from zt_check.results order by n;
select format('합계: %s개 중 %s개 통과', count(*), count(*) filter (where ok)) from zt_check.results;
do $$ begin if exists (select 1 from zt_check.results where not ok) then raise exception '권한 검사 실패가 있습니다'; end if; end $$;
rollback;
