-- 읽기 전용 점검: 어떤 DB 업데이트(migration)가 이 데이터베이스에 들어가 있는지 확인한다.
-- 아무것도 바꾸지 않는다(SELECT만).
select m.version, m.label,
  case when m.present then '있음' else '없음' end as 상태
from (values
  ('202610130001', '사무소·집·기록 표',            to_regclass('public.homes') is not null),
  ('202610130006', '채팅 표',                      to_regclass('public.chat_rooms') is not null),
  ('202610130009', '채팅 안전·지원',               to_regclass('public.chat_reports') is not null),
  ('202610130011', '계약 수명주기',                to_regclass('public.contract_plan_states') is not null),
  ('202610130101', '집신체크 계정 연결',           to_regclass('public.signup_attributions') is not null),
  ('202610130102', '사진 정리 대기열',             to_regclass('public.photo_cleanup_queue') is not null),
  ('202610140001', '휴대폰 인증 강화',             to_regprocedure('public.verify_phone_challenge(text,text)') is not null
                                                   or exists(select 1 from pg_proc where proname = 'verify_phone_challenge')),
  ('202610140002', '비밀번호 재설정 문자 표',      to_regclass('public.account_recovery_challenges') is not null),
  ('202610140003', '문자 발송 제한·재설정 함수',   exists(select 1 from pg_proc where proname = 'reserve_auth_sms_send')
                                                   and exists(select 1 from pg_proc where proname = 'verify_account_recovery_challenge')),
  ('202610140004', '가입 전 휴대폰 인증',          to_regclass('public.anonymous_signup_phone_challenges') is not null),
  ('202610150001', '만14세 동의 제거',             exists(select 1 from pg_proc where proname = 'complete_usage_onboarding'
                                                   and pg_get_functiondef(oid) not ilike '%age_over_14%')),
  ('202610160001', '서버 profiles 읽기 권한',      has_table_privilege('service_role', 'public.profiles', 'select'))
) as m(version, label, present)
order by m.version;
