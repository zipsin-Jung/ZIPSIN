-- 수리 5단계: 단계마다 누르는 사람, 후 사진·영수증 조건, 직접 수정 금지, 알림 (로컬 RLS 검사)
\set ON_ERROR_STOP 1
begin;
\ir 05_fixture.sql
\o /dev/null
-- 기록 50..02 = 임차인이 접수한 '욕실 누수'(현재 계약 공유). 시작 단계는 received.
set local role authenticated;
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect((select repair_stage from public.records where id = '50000000-0000-4000-8000-000000000002') = 'received', '수리 시작 단계 = 접수 중');
select zt_check.expect(zt_check.changed($q$update public.records set repair_stage = 'receipt_attached' where id = '50000000-0000-4000-8000-000000000002'$q$) = 0, '임차인: 단계 칸 직접 수정 못 함');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'scheduling')$q$) <> 'ok', '임차인: 단계 건너뛰기 못 함');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'landlord_review')$q$) = 'ok', '임차인: 임대인 확인 요청 보냄');

select zt_check.as_user('10000000-0000-4000-8000-000000000003');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'scheduling', 'phone_confirmed')$q$) <> 'ok', '다른 사무소 대표: 못 누름');
select zt_check.as_user('10000000-0000-4000-8000-000000000002');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'scheduling', 'phone_confirmed')$q$) <> 'ok', 'A 보조원: 임대인 확인 대신 못 누름');
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'scheduling')$q$) <> 'ok', '임차인: 임대인 확인 못 누름');
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'scheduling', 'app')$q$) <> 'ok', 'A 대표: 앱에서 임대인 대신 승인 못 함');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'scheduling', 'small_repair_skip')$q$) <> 'ok', 'A 대표: 허용 금액 없으면 작은 수리 건너뛰기 못 함');

select zt_check.as_user('10000000-0000-4000-8000-000000000005');
select zt_check.expect((select count(*) from public.notifications where notification_kind = 'repair_stage' and record_id = '50000000-0000-4000-8000-000000000002') = 1, '임대인: 확인 요청 알림 1건');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'scheduling', 'app')$q$) = 'ok', '임대인: 앱에서 확인');

select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'completed')$q$) like '%after_photo_required%', 'A 대표: 후 사진 없이 완료 못 함');
reset role;
insert into public.attachments (record_id, storage_path, original_name, media_type, byte_size, status, created_by, created_at)
values ('50000000-0000-4000-8000-000000000002', 'p/after.jpg', 'after.jpg', 'image/jpeg', 10, 'ready', '10000000-0000-4000-8000-000000000001', clock_timestamp());
set local role authenticated;
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'completed')$q$) = 'ok', 'A 대표: 후 사진 올린 뒤 완료');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'receipt_attached')$q$) like '%receipt_required%', 'A 대표: 영수증 없이 끝내기 못 함');
reset role;
insert into public.attachments (record_id, storage_path, original_name, media_type, byte_size, status, created_by, created_at)
values ('50000000-0000-4000-8000-000000000002', 'p/receipt.pdf', 'receipt.pdf', 'application/pdf', 10, 'ready', '10000000-0000-4000-8000-000000000001', clock_timestamp());
set local role authenticated;
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'receipt_attached')$q$) = 'ok', 'A 대표: 영수증 올린 뒤 끝냄');
select zt_check.expect(zt_check.try($q$select public.advance_repair_stage('50000000-0000-4000-8000-000000000002', 'receipt_attached')$q$) <> 'ok', '끝난 수리는 다시 못 넘김');

select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect((select count(*) from public.get_repair_stage_events('50000000-0000-4000-8000-000000000002')) = 4, '임차인: 단계 이력 4건 봄');
select zt_check.expect((select count(*) from public.get_repair_stage_events('50000000-0000-4000-8000-000000000002') where is_me) = 1, '임차인: 내가 누른 단계 1건 표시');
select zt_check.expect(zt_check.try($q$select * from public.repair_stage_events$q$) <> 'ok', '이력 표는 직접 못 읽음(사람 ID 보호)');
select zt_check.as_user('10000000-0000-4000-8000-000000000007');
select zt_check.expect((select count(*) from public.get_repair_stage_events('50000000-0000-4000-8000-000000000002')) = 0, '무관한 사람: 이력 0건');
select zt_check.expect((select count(*) from public.notifications) = 0, '무관한 사람: 알림 0건');

-- 사무소 내부 수리는 단계가 없다
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.try($q$select public.create_home_record('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-00000000000a',null,'office_internal','repair','사무소 메모용 수리',null,'70000000-0000-4000-8000-000000000001',null,null)$q$) = 'ok', '사무소 내부 수리 기록 씀');
select zt_check.expect((select repair_stage from public.records where idempotency_key = '70000000-0000-4000-8000-000000000001') is null, '사무소 내부 수리는 단계 없음');

-- 전화 확인 경로
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect(zt_check.try($q$select public.create_home_record('30000000-0000-4000-8000-000000000001',null,'40000000-0000-4000-8000-000000000001','current_contract','repair','현관 도어락',null,'70000000-0000-4000-8000-000000000002',null,null)$q$) = 'ok', '임차인: 두 번째 수리 접수');
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.try(format($q$select public.advance_repair_stage(%L, 'landlord_review')$q$, (select id from public.records where idempotency_key = '70000000-0000-4000-8000-000000000002'))) = 'ok', 'A 대표: 임대인 확인 요청');
select zt_check.expect(zt_check.try(format($q$select public.advance_repair_stage(%L, 'scheduling', 'phone_confirmed', '임대인 통화 10:20')$q$, (select id from public.records where idempotency_key = '70000000-0000-4000-8000-000000000002'))) = 'ok', 'A 대표: 전화 확인으로 넘김');
select zt_check.expect((select method from public.get_repair_stage_events((select id from public.records where idempotency_key = '70000000-0000-4000-8000-000000000002')) where to_stage = 'scheduling') = 'phone_confirmed', '전화 확인 방법이 이력에 남음');

reset role;
\o
select n, case when ok then 'PASS' else 'FAIL' end as result, label from zt_check.results order by n;
select format('합계: %s개 중 %s개 통과', count(*), count(*) filter (where ok)) from zt_check.results;
do $$ begin if exists (select 1 from zt_check.results where not ok) then raise exception '수리 단계 검사 실패가 있습니다'; end if; end $$;
rollback;
