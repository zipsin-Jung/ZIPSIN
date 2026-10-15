# DEC-026: ck.zipsin.net 독립 주소와 같은 주소 안의 로그인

- 날짜: 2026-10-15
- 상태: 사용자 방향 승인(`zipsin.net/ck` 말고 `ck.zipsin.net`) · 코드 완료 · 외부 연결 승인 대기
- 결정 책임자: 사용자
- 변경 범위: `2026-10-14-zipsin-shared-auth-integration-design.md`의 "인증 시작·callback을 zipsin.net에 중앙화" 항목

## 결정

집신체크 공개 주소는 `ck.zipsin.net`이다. `ck.zipsin.net`에 들어오면 같은 주소의 `/ck`로 이동한다. 집신체크에서 시작한 로그인·회원가입·간편 로그인 복귀는 `ck.zipsin.net` 안에서 끝낸다. 계정·Supabase·세션은 집신과 같고, 운영 쿠키는 `.zipsin.net`으로 두 주소가 공유한다.

## 이유

- 집신체크는 저장 전 기록을 브라우저 저장소에 둔다. 브라우저 저장소는 주소별로 분리되므로, 로그인 중 `zipsin.net`으로 넘어가면 `ck.zipsin.net`에서 만든 기록이 보이지 않는다.
- 기존 설계의 `zipsin.net` 중앙 callback은 이 조건과 충돌했다. 계정은 같고 처리 주소만 사용자가 머문 곳으로 둔다.
- `/` 화면을 주소 그대로 `/ck`로 바꿔 보여주는 방식은 운영 빌드에서 React hydration 오류가 재현되어, 같은 주소 안의 `/ck` 이동으로 정했다. 광고·QR 추적값은 유지한다.

## 안전 조건

- 간편 로그인 복귀 주소는 요청 주소가 정확히 집신체크 주소일 때만 `ck.zipsin.net`이고, 그 밖에는 항상 `NEXT_PUBLIC_SITE_URL`을 쓴다. 임의 주소를 복귀 주소로 쓰지 않는다.
- 운영 `NEXT_PUBLIC_CHECK_SITE_URL`은 `https://ck.zipsin.net`만 허용한다.
- 이메일 확인·비밀번호 재설정 링크는 아직 `zipsin.net`으로 간다. 로그인 자체에는 영향이 없으나 이메일 링크를 누른 사용자는 집신체크로 직접 돌아가지 않는다(후속).

## 롤백

`proxy.ts`의 집신체크 주소 분기와 `start-oauth.ts`의 복귀 주소 선택을 되돌리면 이전 동작으로 돌아간다. DB 변경은 없다. Vercel에서 `ck.zipsin.net` 도메인을 떼면 주소 연결도 해제된다.
