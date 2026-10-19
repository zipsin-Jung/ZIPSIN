-- 입주·퇴거 상태 / 집 이력 품목 / 파트너 서류 (로컬 RLS 검사, migration 202610190001)
\set ON_ERROR_STOP 1
begin;
\ir 05_fixture.sql
\o /dev/null
create temp table zt_ids (k text primary key, v uuid);
grant all on zt_ids to authenticated;
set local role authenticated;

-- ── 입주 상태: 만들기
select zt_check.as_user('10000000-0000-4000-8000-000000000007');
select zt_check.expect(zt_check.try($q$select public.create_home_inspection('30000000-0000-4000-8000-000000000001', 'move_in', array['안방'])$q$) <> 'ok', '무관한 사람: 입주 기록 못 만듦');
select zt_check.as_user('10000000-0000-4000-8000-000000000003');
select zt_check.expect(zt_check.try($q$select public.create_home_inspection('30000000-0000-4000-8000-000000000001', 'move_in', array['안방'])$q$) <> 'ok', '다른 사무소 대표: 못 만듦');
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect(zt_check.try($q$select public.create_home_inspection('30000000-0000-4000-8000-000000000001', 'move_in', array['안방'])$q$) <> 'ok', '임차인: 사무소 대신 못 만듦');
select zt_check.as_user('10000000-0000-4000-8000-000000000002');
insert into zt_ids select 'insp', public.create_home_inspection('30000000-0000-4000-8000-000000000001', 'move_in', array['안방', '욕실', '주방']);
select zt_check.expect((select v from zt_ids where k = 'insp') is not null, 'A 보조원: 현재 계약에 입주 기록 만듦');
select zt_check.expect(public.create_home_inspection('30000000-0000-4000-8000-000000000001', 'move_in', array['거실']) = (select v from zt_ids where k = 'insp'), '같은 계약 입주 기록은 하나(다시 만들면 같은 기록)');
select zt_check.expect((select count(*) from public.inspection_rooms where inspection_id = (select v from zt_ids where k = 'insp')) = 3, '방 3개');
select zt_check.expect((select count(*) from public.inspection_items i join public.inspection_rooms r on r.id = i.room_id where r.name = '욕실' and i.aspect = 'damage') = 5, '욕실 기본 파손 항목 5개');
select zt_check.expect((select count(*) from public.inspection_items where inspection_id = (select v from zt_ids where k = 'insp') and aspect = 'cleaning') = 3, '방마다 청소 항목 따로 1개');
select zt_check.expect((select count(*) from public.inspection_items where inspection_id = (select v from zt_ids where k = 'insp') and state <> 'unchecked') = 0, '처음엔 모두 확인 못 함');

-- ── 항목 확인
insert into zt_ids select 'item_ok', id from public.inspection_items where inspection_id = (select v from zt_ids where k = 'insp') and label = '벽지' limit 1;
insert into zt_ids select 'item_issue', id from public.inspection_items where inspection_id = (select v from zt_ids where k = 'insp') and label = '바닥' limit 1;
select zt_check.expect(zt_check.try(format($q$select public.set_inspection_item(%L, 'issue')$q$, (select v from zt_ids where k = 'item_issue'))) like '%note_required%', '이상 있음은 메모 필수');
select zt_check.expect(zt_check.try(format($q$select public.set_inspection_item(%L, 'issue', '창가 쪽 찍힘 2곳')$q$, (select v from zt_ids where k = 'item_issue'))) = 'ok', '이상 있음 + 메모 저장');
select zt_check.expect(zt_check.try(format($q$select public.set_inspection_item(%L, 'ok')$q$, (select v from zt_ids where k = 'item_ok'))) = 'ok', '확인함 저장');
select zt_check.expect((select checked_by from public.inspection_items where id = (select v from zt_ids where k = 'item_ok')) = '10000000-0000-4000-8000-000000000002', '누가 확인했는지 남음');
select zt_check.expect(zt_check.changed(format($q$update public.inspection_items set state = 'ok' where id = %L$q$, (select v from zt_ids where k = 'item_issue'))) = 0, '표 직접 수정 못 함');
select zt_check.expect(zt_check.try(format($q$select public.set_inspection_reading(%L, 'electric', '01234.5')$q$, (select v from zt_ids where k = 'insp'))) = 'ok', '전기 계량기 저장');
select zt_check.expect(zt_check.try(format($q$select public.set_inspection_reading(%L, 'keys', '현관 2개')$q$, (select v from zt_ids where k = 'insp'))) = 'ok', '열쇠 개수 저장');

-- ── 방 사진 기록
insert into zt_ids select 'room_rec', public.ensure_inspection_room_record((select id from public.inspection_rooms where inspection_id = (select v from zt_ids where k = 'insp') and name = '안방'));
select zt_check.expect((select record_space from public.records where id = (select v from zt_ids where k = 'room_rec')) = 'current_contract', '방 사진 기록 = 이번 계약 공유');
select zt_check.expect(public.ensure_inspection_room_record((select id from public.inspection_rooms where inspection_id = (select v from zt_ids where k = 'insp') and name = '안방')) = (select v from zt_ids where k = 'room_rec'), '방 사진 기록은 하나');

-- ── 보내기 전: 임차인 답 못 함 / 보낸 뒤 사무소 수정 못 함
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect((select count(*) from public.inspection_items where inspection_id = (select v from zt_ids where k = 'insp')) > 0, '현재 임차인: 기록 봄');
select zt_check.expect(zt_check.try(format($q$select public.respond_inspection_item(%L, 'agree')$q$, (select v from zt_ids where k = 'item_ok'))) like '%inspection_not_sent%', '보내기 전에는 답 못 함');
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.try(format($q$select public.send_home_inspection(%L)$q$, (select v from zt_ids where k = 'insp'))) = 'ok', 'A 대표: 보냄');
select zt_check.expect(zt_check.try(format($q$select public.set_inspection_item(%L, 'unchecked')$q$, (select v from zt_ids where k = 'item_ok'))) like '%inspection_locked%', '보낸 뒤 사무소도 못 고침');
select zt_check.expect(zt_check.try(format($q$select public.set_inspection_reading(%L, 'gas', '1')$q$, (select v from zt_ids where k = 'insp'))) like '%inspection_locked%', '보낸 뒤 계량기도 못 고침');
select zt_check.expect(zt_check.try(format($q$select public.ensure_inspection_room_record(%L)$q$, (select id from public.inspection_rooms where inspection_id = (select v from zt_ids where k = 'insp') and name = '욕실'))) like '%inspection_locked%', '보낸 뒤 새 방 사진 기록 못 만듦');

select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect((select count(*) from public.notifications where notification_kind = 'inspection_sent') = 1, '임차인: 확인 요청 알림 1건');
select zt_check.expect(zt_check.try(format($q$select public.respond_inspection_item(%L, 'agree')$q$, (select v from zt_ids where k = 'item_ok'))) = 'ok', '임차인: 맞아요');
select zt_check.expect(zt_check.try(format($q$select public.respond_inspection_item(%L, 'comment')$q$, (select v from zt_ids where k = 'item_issue'))) like '%comment_required%', '의견은 내용 필수');
select zt_check.expect(zt_check.try(format($q$select public.respond_inspection_item(%L, 'comment', '찍힘 3곳이에요')$q$, (select v from zt_ids where k = 'item_issue'))) = 'ok', '임차인: 의견');
select zt_check.expect(zt_check.try(format($q$select public.respond_inspection_item(%L, 'agree')$q$, (select v from zt_ids where k = 'item_issue'))) = 'ok', '임차인: 답 바꾸기');
select zt_check.expect((select count(*) from public.inspection_responses) = 2, '답 2건(같은 항목은 1건)');
select zt_check.as_user('10000000-0000-4000-8000-000000000005');
select zt_check.expect(zt_check.try(format($q$select public.respond_inspection_item(%L, 'agree')$q$, (select v from zt_ids where k = 'item_ok'))) = 'ok', '임대인: 맞아요');
select zt_check.expect((select relationship_role from public.inspection_responses where user_id = '10000000-0000-4000-8000-000000000005') = 'landlord', '임대인 답으로 남음');

select zt_check.as_user('10000000-0000-4000-8000-000000000006');
select zt_check.expect(zt_check.visible('public.home_inspections') = 0 and zt_check.visible('public.inspection_items') = 0, '이전 임차인: 새 계약 입주 기록 못 봄');
select zt_check.expect(zt_check.try(format($q$select public.respond_inspection_item(%L, 'agree')$q$, (select v from zt_ids where k = 'item_ok'))) <> 'ok', '이전 임차인: 답 못 함');
select zt_check.as_user('10000000-0000-4000-8000-000000000003');
select zt_check.expect(zt_check.visible('public.inspection_rooms') = 0 and zt_check.visible('public.inspection_readings') = 0, '다른 사무소: 못 봄');
select zt_check.as_user('10000000-0000-4000-8000-000000000008');
select zt_check.expect(zt_check.visible('public.home_inspections') = 0, '퇴사 직원: 못 봄');
select zt_check.as_user('10000000-0000-4000-8000-000000000007');
select zt_check.expect(zt_check.visible('public.inspection_responses') = 0, '무관한 사람: 답 못 봄');

-- ── 집 이력 품목
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect(zt_check.try($q$select public.save_home_item('30000000-0000-4000-8000-000000000001', null, 'boiler', '보일러', '2021-03-01', null, null)$q$) <> 'ok', '임차인: 품목 못 씀');
select zt_check.as_user('10000000-0000-4000-8000-000000000005');
select zt_check.expect(zt_check.try($q$select public.save_home_item('30000000-0000-4000-8000-000000000001', null, 'boiler', '보일러', '2021-03-01', '2024-11-02', '린나이')$q$) = 'ok', '임대인: 보일러 설치·교체일 저장');
select zt_check.expect(zt_check.try($q$select public.save_home_item('30000000-0000-4000-8000-000000000001', null, 'aircon', '에어컨', '2024-01-01', '2023-01-01', null)$q$) <> 'ok', '교체일이 설치일보다 빠르면 거절');
select zt_check.as_user('10000000-0000-4000-8000-000000000002');
select zt_check.expect(zt_check.try($q$select public.save_home_item('30000000-0000-4000-8000-000000000001', null, 'wallpaper', '거실 도배', '2025-11-20', null, null)$q$) = 'ok', 'A 보조원: 도배 날짜 저장');
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect(zt_check.visible('public.home_items') = 2, '현재 임차인: 품목 2개 봄');
select zt_check.as_user('10000000-0000-4000-8000-000000000006');
select zt_check.expect(zt_check.visible('public.home_items') = 0, '이전 임차인: 품목 못 봄');
select zt_check.as_user('10000000-0000-4000-8000-000000000003');
select zt_check.expect(zt_check.visible('public.home_items') = 0, '다른 사무소: 품목 못 봄');
select zt_check.expect(zt_check.changed($q$update public.home_items set name = 'x'$q$) = 0, '표 직접 수정 못 함');

-- ── 파트너 등록
reset role;
insert into public.profiles (user_id, display_name, phone_verified_at) values ('10000000-0000-4000-8000-000000000007', '김청소', now())
  on conflict (user_id) do update set phone_verified_at = now();
set local role authenticated;
select zt_check.as_user('10000000-0000-4000-8000-000000000006');
select zt_check.expect(zt_check.try($q$select public.start_partner_application('cleaning', '깨끗청소')$q$) <> 'ok', '휴대폰 확인 안 한 사람: 신청 못 함');
select zt_check.as_user('10000000-0000-4000-8000-000000000007');
insert into zt_ids select 'app', public.start_partner_application('broker', '공릉공인중개사사무소');
select zt_check.expect(public.start_partner_application('broker', '공릉공인중개사사무소') = (select v from zt_ids where k = 'app'), '같은 종류 신청은 하나');
select zt_check.expect(zt_check.try(format($q$select public.submit_partner_application(%L)$q$, (select v from zt_ids where k = 'app'))) like '%documents_required%', '서류 없으면 제출 못 함');
select zt_check.expect(zt_check.try(format($q$select * from public.prepare_partner_document(%L, 'broker_license', 'a.exe', 'application/x-msdownload', 10)$q$, (select v from zt_ids where k = 'app'))) <> 'ok', 'PDF·사진 외 파일 거절');
insert into zt_ids select 'doc1', document_id from public.prepare_partner_document((select v from zt_ids where k = 'app'), 'business_registration', '사업자등록증.pdf', 'application/pdf', 1000);
select zt_check.expect(zt_check.try(format($q$select public.complete_partner_document(%L)$q$, (select v from zt_ids where k = 'doc1'))) like '%upload_missing%', '파일을 안 올리면 완료 못 함');
select zt_check.expect(zt_check.try(format($q$insert into storage.objects (bucket_id, name) values ('partner-documents', %L)$q$, (select storage_path from public.partner_documents where id = (select v from zt_ids where k = 'doc1')))) = 'ok', '준비된 경로에 파일 올림');
select zt_check.expect(zt_check.try($q$insert into storage.objects (bucket_id, name) values ('partner-documents', 'someone/else.pdf')$q$) <> 'ok', '준비 안 된 경로에는 못 올림');
select zt_check.expect(zt_check.try(format($q$select public.complete_partner_document(%L)$q$, (select v from zt_ids where k = 'doc1'))) = 'ok', '서류 1 완료');
select zt_check.expect(zt_check.try(format($q$select public.submit_partner_application(%L)$q$, (select v from zt_ids where k = 'app'))) like '%documents_required%', '공인중개사는 3가지 다 있어야 제출');
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.visible('public.partner_applications') = 0 and zt_check.visible('public.partner_documents') = 0, '다른 사람: 신청·서류 못 봄');
select zt_check.expect((select count(*) from storage.objects where bucket_id = 'partner-documents') = 0, '다른 사람: 서류 파일 못 봄');
select zt_check.expect(zt_check.try(format($q$select * from public.prepare_partner_document(%L, 'broker_license', 'x.pdf', 'application/pdf', 10)$q$, (select v from zt_ids where k = 'app'))) <> 'ok', '다른 사람: 남의 신청에 서류 못 붙임');
select zt_check.as_user('10000000-0000-4000-8000-000000000007');
select zt_check.expect((select count(*) from storage.objects where bucket_id = 'partner-documents') = 1, '본인: 내 서류 파일 봄');
insert into zt_ids select 'doc2', document_id from public.prepare_partner_document((select v from zt_ids where k = 'app'), 'brokerage_registration', '등록증.jpg', 'image/jpeg', 1000);
insert into zt_ids select 'doc3', document_id from public.prepare_partner_document((select v from zt_ids where k = 'app'), 'broker_license', '자격증.png', 'image/png', 1000);
insert into storage.objects (bucket_id, name) select 'partner-documents', storage_path from public.partner_documents where id in ((select v from zt_ids where k = 'doc2'), (select v from zt_ids where k = 'doc3'));
select public.complete_partner_document((select v from zt_ids where k = 'doc2'));
select public.complete_partner_document((select v from zt_ids where k = 'doc3'));
select zt_check.expect(zt_check.try(format($q$select public.submit_partner_application(%L)$q$, (select v from zt_ids where k = 'app'))) = 'ok', '서류 3가지 → 제출');
select zt_check.expect((select status from public.partner_applications where id = (select v from zt_ids where k = 'app')) = 'submitted', '상태 = 확인 대기');
select zt_check.expect(zt_check.changed($q$update public.partner_applications set status = 'approved'$q$) = 0, '본인이 승인으로 못 바꿈');
select zt_check.expect(zt_check.try(format($q$select * from public.prepare_partner_document(%L, 'broker_license', 'y.pdf', 'application/pdf', 10)$q$, (select v from zt_ids where k = 'app'))) like '%application_locked%', '제출 뒤 서류 못 바꿈');

reset role;
\o
select n, case when ok then 'PASS' else 'FAIL' end as result, label from zt_check.results order by n;
select format('합계: %s개 중 %s개 통과', count(*), count(*) filter (where ok)) from zt_check.results;
do $$ begin if exists (select 1 from zt_check.results where not ok) then raise exception '입주·품목·파트너 검사 실패가 있습니다'; end if; end $$;
rollback;
