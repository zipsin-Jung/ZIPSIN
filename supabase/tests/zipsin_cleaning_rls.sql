-- 집신청소 v1 권한 검사 (TEST-CL-RLS-*). pgTAP 없이도 돌도록 실패하면 예외를 던진다.
-- 로컬: scratchpad 스텁 DB에 migration 적용 후 `psql -v ON_ERROR_STOP=1 -f supabase/tests/zipsin_cleaning_rls.sql`
begin;

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'customer@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'other-customer@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'partner@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'other-partner@example.test'),
  ('10000000-0000-0000-0000-000000000005', 'operator@example.test');
insert into public.clean_operators (user_id) values ('10000000-0000-0000-0000-000000000005');

create temp table t_ctx (k text primary key, v text);
grant all on t_ctx to public;

create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
end $$;
create or replace function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FAIL %', label; end if; raise notice 'ok  %', label; end $$;
create or replace function pg_temp.raises(stmt text, label text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'ok  % (%)', label, sqlerrm; return; end;
  raise exception 'FAIL % (no error)', label;
end $$;

-- 운영자: 업체 2곳 만들고 초대 코드 발급
select pg_temp.as_user('10000000-0000-0000-0000-000000000005');
insert into t_ctx values ('p1', public.create_clean_partner('초록손 청소', 'company', '마포', '정직원 팀', array['대표 대면']));
insert into t_ctx values ('p2', public.create_clean_partner('반듯 홈케어', 'company', '은평', '', '{}'));
insert into t_ctx values ('code1', public.create_clean_partner_invite((select v::uuid from t_ctx where k = 'p1')));
insert into t_ctx values ('code2', public.create_clean_partner_invite((select v::uuid from t_ctx where k = 'p2')));
reset role;

-- TEST-CL-RLS-001 운영자가 아닌 사람은 업체를 만들거나 초대 코드를 못 만든다
select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select pg_temp.raises($$select public.create_clean_partner('가짜', 'company', '', '', '{}')$$, 'RLS-001 customer cannot create partner');
select pg_temp.raises($$select public.create_clean_partner_invite((select v::uuid from t_ctx where k = 'p1'))$$, 'RLS-001 customer cannot create invite');
select pg_temp.check((select count(*) from public.clean_partner_invites) = 0, 'RLS-001 customer cannot read invites');
reset role;

-- 업체 계정이 초대 코드로 들어온다. 같은 코드는 두 번 못 쓴다
select pg_temp.as_user('10000000-0000-0000-0000-000000000003');
select pg_temp.check(public.redeem_clean_partner_invite(lower((select v from t_ctx where k = 'code1'))) = (select v::uuid from t_ctx where k = 'p1'), 'RLS-002 partner redeems invite (case-insensitive)');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000004');
select pg_temp.raises($$select public.redeem_clean_partner_invite((select v from t_ctx where k = 'code1'))$$, 'RLS-002 used invite cannot be reused');
select public.redeem_clean_partner_invite((select v from t_ctx where k = 'code2'));
reset role;

-- 손님 예약: 서버(service_role)만 만들 수 있다
select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select pg_temp.raises($$select public.create_clean_booking('10000000-0000-0000-0000-000000000001', (select v::uuid from t_ctx where k = 'p1'), 'move_in', '{}', 24, 1::smallint, 2::smallint, 7, 1000, 'v0', '{}', '마포구 공덕동', (current_date + 3), 9::smallint, 17::smallint, '{}', '101동 1203호', '010-0000-0000', '', gen_random_uuid())$$, 'RLS-003 customer cannot call create_clean_booking directly (price forgery)');
select pg_temp.raises($$insert into public.clean_bookings (customer_id, partner_id, service, facts, area_pyeong, grade, people, hours, price_won, price_table_version, area_district, service_date, start_hour, idempotency_key) values ('10000000-0000-0000-0000-000000000001', (select v::uuid from t_ctx where k = 'p1'), 'move_in', '{}', 24, 1, 2, 7, 1000, 'v0', '마포', current_date + 3, 9, gen_random_uuid())$$, 'RLS-003 customer cannot insert booking row');
reset role;

set local role service_role;
insert into t_ctx values ('b1', public.create_clean_booking('10000000-0000-0000-0000-000000000001', (select v::uuid from t_ctx where k = 'p1'), 'move_in',
  '{"rooms":3}', 24, 1::smallint, 2::smallint, 7, 325000, 'v0-2026-10-18', array['방·거실'], '마포구 공덕동', (current_date + 3), 9::smallint, 17::smallint,
  array['아이가 살고 있어요'], '예시아파트 101동 1203호', '010-0000-0000', '락스는 빼 주세요', '20000000-0000-0000-0000-000000000001')::text);
select pg_temp.check(public.create_clean_booking('10000000-0000-0000-0000-000000000001', (select v::uuid from t_ctx where k = 'p1'), 'move_in',
  '{"rooms":3}', 24, 1::smallint, 2::smallint, 7, 325000, 'v0-2026-10-18', array['방·거실'], '마포구 공덕동', (current_date + 3), 9::smallint, 17::smallint,
  array['아이가 살고 있어요'], '예시아파트 101동 1203호', '010-0000-0000', '락스는 빼 주세요', '20000000-0000-0000-0000-000000000001')::text = (select v from t_ctx where k = 'b1'), 'RLS-004 same idempotency key returns same booking');
reset role;

-- TEST-CL-RLS-005 다른 손님·다른 업체는 예약도, 주소도 못 본다
select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select pg_temp.check((select count(*) from public.clean_bookings) = 0, 'RLS-005 other customer cannot read booking');
select pg_temp.check((select count(*) from public.clean_booking_private) = 0, 'RLS-005 other customer cannot read address');
select pg_temp.check((select count(*) from public.clean_partner_jobs()) = 0, 'RLS-005 non-partner sees no jobs');
select pg_temp.raises($$select public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'cancel')$$, 'RLS-005 other customer cannot cancel');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000004');
select pg_temp.check((select count(*) from public.clean_partner_jobs()) = 0, 'RLS-005 other partner sees no jobs');
select pg_temp.check((select count(*) from public.clean_bookings) = 0, 'RLS-005 other partner cannot read booking table');
select pg_temp.raises($$select public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'accept')$$, 'RLS-005 other partner cannot accept');
reset role;

-- TEST-CL-RLS-006 수락 전: 업체는 구·동·요청·메모는 보고 상세 주소·연락처는 못 본다. 표는 직접 못 읽는다
select pg_temp.as_user('10000000-0000-0000-0000-000000000003');
select pg_temp.check((select count(*) from public.clean_bookings) = 0, 'RLS-006 partner cannot read booking table directly');
select pg_temp.check((select count(*) from public.clean_booking_private) = 0, 'RLS-006 partner cannot read private table directly');
select pg_temp.check((select area_district = '마포구 공덕동' and memo = '락스는 빼 주세요' and requests = array['아이가 살고 있어요'] and detail_address is null and contact_phone is null from public.clean_partner_jobs()), 'RLS-006 before accept: district+memo visible, address hidden');
select pg_temp.raises($$update public.clean_bookings set price_won = 999999$$, 'RLS-006 partner cannot update price');
select pg_temp.raises($$select public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'start')$$, 'RLS-006 cannot start before accept');
select pg_temp.check(public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'accept') = 'accepted', 'RLS-007 partner accepts');
select pg_temp.check((select detail_address = '예시아파트 101동 1203호' and contact_phone = '010-0000-0000' from public.clean_partner_jobs()), 'RLS-007 after accept: address visible to partner');
select pg_temp.check(public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'start') = 'working', 'RLS-008 partner starts');
select pg_temp.raises($$select public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'finish')$$, 'RLS-008 finish needs an after photo');
insert into t_ctx select 'ph1', photo_id::text from public.prepare_clean_photo('after', (select v::uuid from t_ctx where k = 'b1'));
reset role;
-- 파일이 저장소에 올라갔다고 치고(로컬 스텁) 완료 처리
insert into storage.objects (bucket_id, name, owner) select 'clean-photos', storage_path, uploader_id from public.clean_photos where id = (select v::uuid from t_ctx where k = 'ph1');
select pg_temp.as_user('10000000-0000-0000-0000-000000000003');
select public.complete_clean_photo((select v::uuid from t_ctx where k = 'ph1'));
select pg_temp.check(public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'finish', '순한 세제만 썼어요') = 'done', 'RLS-008 partner finishes with photo and note');
select pg_temp.raises($$select public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'approve')$$, 'RLS-009 partner cannot approve own work');
reset role;

-- TEST-CL-RLS-009 손님 검수: 다시 해 달라고 하면 redo, 그다음 승인. 가격은 그대로
select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select pg_temp.check((select count(*) from public.clean_photos where booking_id = (select v::uuid from t_ctx where k = 'b1')) = 1, 'RLS-009 customer sees booking photo');
select pg_temp.check(public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'request_redo', null, null, '{"hood":"yes"}') = 'redo', 'RLS-009 customer requests redo');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000003');
select pg_temp.check(public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'finish') = 'done', 'RLS-009 partner finishes redo');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select pg_temp.check(public.clean_booking_action((select v::uuid from t_ctx where k = 'b1'), 'approve', null, null, '{"hood":"no"}', true) = 'completed', 'RLS-009 customer approves with photo consent');
select pg_temp.check((select price_won from public.clean_bookings where id = (select v::uuid from t_ctx where k = 'b1')) = 325000, 'RLS-009 price unchanged after all actions');
select pg_temp.check((select count(*) from public.clean_booking_events where booking_id = (select v::uuid from t_ctx where k = 'b1')) = 7, 'RLS-009 every step is recorded');
reset role;

-- TEST-CL-RLS-010 끝난 뒤: 업체에게 주소·연락처·메모·요청이 다시 가려진다
select pg_temp.as_user('10000000-0000-0000-0000-000000000003');
select pg_temp.check((select status = 'completed' and detail_address is null and contact_phone is null and memo = '' and requests = '{}'::text[] from public.clean_partner_jobs()), 'RLS-010 after completion: private fields hidden again');
reset role;

-- TEST-CL-RLS-011 공개 동의한 완료 사진은 다른 손님도 보고, 동의 안 한 사진은 못 본다
select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select pg_temp.check((select count(*) from public.clean_photos) = 1, 'RLS-011 consented completed photo visible to other customer');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'clean-photos') = 1, 'RLS-011 storage object readable when consented');
reset role;
update public.clean_bookings set portfolio_consent = false where id = (select v::uuid from t_ctx where k = 'b1');
select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select pg_temp.check((select count(*) from public.clean_photos) = 0, 'RLS-011 without consent photo hidden from other customer');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'clean-photos') = 0, 'RLS-011 storage object hidden without consent');
reset role;

-- TEST-CL-RLS-012 시작 불가 신고 → 운영자만 취소 확정
set local role service_role;
insert into t_ctx values ('b2', public.create_clean_booking('10000000-0000-0000-0000-000000000001', (select v::uuid from t_ctx where k = 'p1'), 'move_in',
  '{}', 15, 2::smallint, 2::smallint, 6, 240000, 'v0-2026-10-18', '{}', '서대문구 북아현동', (current_date + 5), 8::smallint, null, '{}', '예시빌라 302호', '010-0000-0000', '', '20000000-0000-0000-0000-000000000002')::text);
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000003');
select public.clean_booking_action((select v::uuid from t_ctx where k = 'b2'), 'accept');
select pg_temp.raises($$select public.clean_booking_action((select v::uuid from t_ctx where k = 'b2'), 'report_block')$$, 'RLS-012 block report needs a reason');
select pg_temp.check(public.clean_booking_action((select v::uuid from t_ctx where k = 'b2'), 'report_block', '현관 비밀번호가 바뀜', '이삿짐이 아직 안 빠짐') = 'block_reported', 'RLS-012 partner reports block');
select pg_temp.raises($$select public.clean_booking_action((select v::uuid from t_ctx where k = 'b2'), 'confirm_block')$$, 'RLS-012 partner cannot confirm own block');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000005');
select pg_temp.check((select count(*) from public.clean_bookings) = 2, 'RLS-012 operator sees all bookings');
select pg_temp.check(public.clean_booking_action((select v::uuid from t_ctx where k = 'b2'), 'confirm_block') = 'cancelled', 'RLS-012 operator confirms no-penalty cancel');
reset role;

-- TEST-CL-RLS-013 마이페이지 직접 기록·방문 요청: 본인만
select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
insert into public.clean_records (owner_id, done_month, service, partner_name, area_district, price_won, memo)
values ('10000000-0000-0000-0000-000000000001', '2024-02-01', '이사 청소', '동네 업체', '서대문구', 370000, '현장에서 17만 원 더');
insert into public.clean_visit_requests (customer_id, kind, special, area_district, visit_date, slot, contact_phone)
values ('10000000-0000-0000-0000-000000000001', 'special', array['화재·그을음'], '마포구', current_date + 2, '오전', '010-0000-0000');
insert into t_ctx select 'r1', id::text from public.clean_records limit 1;
select pg_temp.check((select count(*) from public.prepare_clean_photo('record', null, (select v::uuid from t_ctx where k = 'r1'))) = 1, 'RLS-013 owner adds record photo');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select pg_temp.check((select count(*) from public.clean_records) = 0, 'RLS-013 other user cannot read my records');
select pg_temp.check((select count(*) from public.clean_visit_requests) = 0, 'RLS-013 other user cannot read my visit request');
select pg_temp.raises($$select * from public.prepare_clean_photo('record', null, (select v::uuid from t_ctx where k = 'r1'))$$, 'RLS-013 other user cannot add photo to my record');
select pg_temp.raises($$insert into public.clean_records (owner_id, done_month, service, partner_name, area_district) values ('10000000-0000-0000-0000-000000000001', '2024-01-01', 'x', 'x', 'x')$$, 'RLS-013 cannot write record for someone else');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000005');
select pg_temp.check((select count(*) from public.clean_visit_requests) = 1, 'RLS-013 operator sees visit requests');
select pg_temp.check((select count(*) from public.clean_records) = 0, 'RLS-013 operator cannot read customers private records');
reset role;

-- TEST-CL-RLS-014 정지된 업체는 목록에서 빠지고, 구성원도 작업을 못 본다
select pg_temp.as_user('10000000-0000-0000-0000-000000000005');
select public.set_clean_partner_status((select v::uuid from t_ctx where k = 'p1'), 'red_card');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select pg_temp.check((select count(*) from public.clean_partners) = 1, 'RLS-014 red-carded partner hidden from customers');
reset role;
select pg_temp.as_user('10000000-0000-0000-0000-000000000003');
select pg_temp.check((select count(*) from public.clean_partner_jobs()) = 0, 'RLS-014 red-carded partner member sees no jobs');
reset role;

-- TEST-CL-RLS-015 익명(anon)은 아무것도 못 읽는다
set local role anon;
select pg_temp.raises($$select count(*) from public.clean_partners$$, 'RLS-015 anon cannot read partners');
select pg_temp.raises($$select public.clean_partner_jobs()$$, 'RLS-015 anon cannot call partner jobs');
reset role;

select 'ALL CLEAN RLS CHECKS PASSED' as result;
rollback;
