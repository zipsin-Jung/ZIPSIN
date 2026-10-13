# 집신체크 Preview 준비 절차

1. 별도 Preview Supabase 프로젝트를 만든다.
2. `.env.example`의 공개 URL·anon key를 Preview 환경에만 넣고 service-role key는 서버 비밀 저장소에만 둔다.
3. migration `202610130001`, `202610130002`를 순서대로 적용한다.
4. DB 타입을 적용된 schema에서 다시 생성하고 `supabase test db`를 통과시킨다.
5. `candidate-photos`가 비공개인지, 타 사용자 경로가 거부되는지 확인한다.
6. Google·Kakao callback을 Preview `/auth/callback`만 허용하고 해당 공급자 flag만 켠다. Naver는 준비 완료 전 false다.
7. 타입·coverage·build·Playwright·audit·secret 검사를 다시 실행한다.
8. 신규 로그인, 기존 로그인, 취소, 세션 만료, 사진 부분 실패, 다른 브라우저 복원, 서버·로컬 삭제를 실제 Preview에서 확인한다.
9. G6 사용자 승인 전 Production·DNS·실사용자 데이터는 변경하지 않는다.
