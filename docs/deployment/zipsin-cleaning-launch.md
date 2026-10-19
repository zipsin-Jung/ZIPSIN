# 집신청소 출시 순서 (2026-10-19)

> 각 단계는 대표 승인 뒤에만. Preview와 운영이 같은 Supabase 프로젝트를 쓰므로 1번은 곧 운영 DB 변경이다.

1. **DB 적용(승인 필요):** Supabase SQL Editor에서 `supabase/migrations/202610190101_zipsin_cleaning_v1.sql` 전체 실행.
   - 새 표·함수·`clean-photos` 비공개 버킷만 만든다. 기존 표는 바꾸지 않는다.
   - 롤백이 필요하면 `clean_` 표·함수를 지우는 후속 SQL을 따로 만든다(기존 기록을 지우지 않는 원칙에 따라 운영 데이터가 생긴 뒤에는 지우지 않는다).
2. **운영자 지정:** SQL Editor에서 대표 계정 하나만 운영자로 넣는다(아이디는 Authentication → Users에서 복사).
   ```sql
   insert into public.clean_operators (user_id) values ('<대표 계정 user id>');
   ```
3. **Preview 다계정 확인:** Preview `/cl`에서 손님·업체·다른 손님 계정 3개로 예약 → 수락 → 사진 → 검수까지. 다른 손님에게 주소·연락처·메모가 안 보이는지, 업체에게 수락 전 주소가 안 보이는지 확인.
4. **가격표 v1:** 청소업체 대표님 답으로 `features/zipsin-clean/domain/price-table.ts`의 임시 값을 바꾼다.
5. **로그인 열기:** 약관·개인정보처리방침 게시 후 `NEXT_PUBLIC_ACCOUNT_OPEN=true`(집신 전체 결정).
6. **집신청소 열기:** Vercel Production 환경값 `NEXT_PUBLIC_CLEAN_OPEN=true` → 다시 배포.
   - 그때부터 cl.zipsin.net 첫 화면이 `/cl`로 가고, 로그인·회원가입은 zipsin.net에서 한 뒤 돌아온다(쿠키 `.zipsin.net` 공유).
   - 끄면(값 삭제 후 재배포) 다시 공용 '준비 중' 화면.
