-- 2026-10-16: 서버 전용 service_role이 profiles를 읽을 수 있게 한다.
-- 아이디 찾기(이메일 → 아이디)와 비밀번호 재설정(이름 + 휴대폰)이 서버에서 profiles를 조회한다.
-- Preview 로그: "permission denied for table profiles" (code 42501).
-- anon·authenticated 권한은 바꾸지 않는다. 쓰기 권한은 주지 않는다(저장은 security definer 함수가 맡는다).
grant select on public.profiles to service_role;
