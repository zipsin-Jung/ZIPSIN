-- 공통 준비: 계정 8명, 사무소 2곳, 집 2채, 계약 2개, 기록 4건, 첨부 2개 (트랜잭션 안에서 \ir 로 불러 쓴다)
create schema zt_check;
create table zt_check.results (n serial, label text, ok boolean, detail text);
create function zt_check.expect(p_ok boolean, p_label text, p_detail text default null) returns void language sql as $$
  insert into zt_check.results(label, ok, detail) values (p_label, coalesce(p_ok, false), p_detail)
$$;
grant usage on schema zt_check to authenticated;
grant all on all tables in schema zt_check to authenticated;
grant all on all sequences in schema zt_check to authenticated;
grant execute on all functions in schema zt_check to authenticated;

-- 사람
insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'b1@a.test'),   -- A사무소 대표
  ('10000000-0000-4000-8000-000000000002', 's1@a.test'),   -- A사무소 보조원
  ('10000000-0000-4000-8000-000000000003', 'b2@b.test'),   -- B사무소 대표(다른 사무소)
  ('10000000-0000-4000-8000-000000000004', 't1@x.test'),   -- H1 현재 임차인
  ('10000000-0000-4000-8000-000000000005', 'l1@x.test'),   -- H1 임대인
  ('10000000-0000-4000-8000-000000000006', 't0@x.test'),   -- H1 이전 임차인(계약 끝)
  ('10000000-0000-4000-8000-000000000007', 'x@x.test'),    -- 아무 관계 없는 사람
  ('10000000-0000-4000-8000-000000000008', 'e1@a.test');   -- A사무소 퇴사 직원
insert into public.offices (id, name, created_by) values
  ('20000000-0000-4000-8000-00000000000a', 'A 사무소', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-00000000000b', 'B 사무소', '10000000-0000-4000-8000-000000000003');
insert into public.office_memberships (office_id, user_id, office_role, status, ended_at) values
  ('20000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000001', 'principal_broker', 'active', null),
  ('20000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000002', 'assistant', 'active', null),
  ('20000000-0000-4000-8000-00000000000b', '10000000-0000-4000-8000-000000000003', 'principal_broker', 'active', null),
  ('20000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000008', 'associate_broker', 'ended', now());
insert into public.homes (id, address_line1, address_detail, address_fingerprint, created_by, office_id, home_label) values
  ('30000000-0000-4000-8000-000000000001', '서울 노원구 공릉로 10', '201호', 'fp-same', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-00000000000a', 'A의 201호'),
  ('30000000-0000-4000-8000-000000000002', '서울 노원구 공릉로 10', '201호', 'fp-same', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-00000000000b', 'B의 201호');
insert into public.contracts (id, home_id, contract_kind, status, starts_on, ends_on, created_by) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'monthly_rent', 'active', '2025-12-01', '2027-11-30', '10000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000000', '30000000-0000-4000-8000-000000000001', 'monthly_rent', 'ended', '2023-12-01', '2025-11-30', '10000000-0000-4000-8000-000000000001');
insert into public.home_memberships (home_id, contract_id, user_id, relationship_role, status, starts_at, ended_at) values
  ('30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'tenant', 'active', now() - interval '30 days', null),
  ('30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'landlord', 'active', now() - interval '30 days', null),
  ('30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000000', '10000000-0000-4000-8000-000000000006', 'tenant', 'ended', now() - interval '700 days', now() - interval '1 day');
insert into public.records (id, home_id, office_id, contract_id, record_space, record_kind, title, created_by, idempotency_key) values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-00000000000a', null, 'office_internal', 'note', '사무소 메모', '10000000-0000-4000-8000-000000000001', gen_random_uuid()),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', null, '40000000-0000-4000-8000-000000000001', 'current_contract', 'repair', '욕실 누수(현재 계약)', '10000000-0000-4000-8000-000000000004', gen_random_uuid()),
  ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', null, '40000000-0000-4000-8000-000000000000', 'current_contract', 'photo', '이전 계약 입주 사진', '10000000-0000-4000-8000-000000000006', gen_random_uuid()),
  ('50000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-00000000000b', null, 'office_internal', 'note', 'B 사무소 메모', '10000000-0000-4000-8000-000000000003', gen_random_uuid());
insert into storage.buckets (id, name) values ('home-records', 'home-records') on conflict do nothing;
insert into public.attachments (id, record_id, storage_path, original_name, media_type, byte_size, status, created_by) values
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'p/office.jpg', 'office.jpg', 'image/jpeg', 10, 'ready', '10000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', 'p/contract.jpg', 'contract.jpg', 'image/jpeg', 10, 'ready', '10000000-0000-4000-8000-000000000004');
insert into storage.objects (bucket_id, name) values ('home-records', 'p/office.jpg'), ('home-records', 'p/contract.jpg');

create function zt_check.as_user(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', p_user::text, true), set_config('request.jwt.claim.role', 'authenticated', true)
$$;
create function zt_check.visible(p_table text) returns int language plpgsql as $$
declare v int; begin execute format('select count(*) from %s', p_table) into v; return v; end $$;
create function zt_check.try(p_sql text) returns text language plpgsql as $$
begin execute p_sql; return 'ok'; exception when others then return sqlerrm; end $$;
create function zt_check.changed(p_sql text) returns int language plpgsql as $$
declare v int; begin execute p_sql; get diagnostics v = row_count; return v; exception when others then return 0; end $$;
grant execute on all functions in schema zt_check to authenticated;

