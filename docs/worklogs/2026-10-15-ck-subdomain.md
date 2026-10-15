# 2026-10-15 ck.zipsin.net 배포 전 준비 작업로그

## 요청

`zipsin.net/ck`가 아니라 `ck.zipsin.net`으로 쓸 수 있게 배포 직전 단계까지 준비한다.

## 수행 순서

1. 현행 코드·배포 절차 확인: 주소별 분기 없음, 로그인 중 주소가 바뀌면 브라우저 기록이 안 보이는 설계 충돌 발견
2. 사용자 방향 확인(`ck.zipsin.net` 독립 주소) 후 DEC-026 기록
3. 실패 테스트 작성 → 주소 판별·첫 화면 이동·간편 로그인 복귀 주소·운영 환경값 검사 구현
4. 운영 빌드 실제 브라우저 검사에서 `/` 주소 유지 방식의 hydration 오류 재현 → 같은 주소 `/ck` 이동으로 변경
5. 전체 게이트·문서·Git 반영

## 검증 결과

- 단위·통합: 630건 통과, 1건 skip
- 커버리지(설정 명시 범위, `lib/site`·`proxy.ts` 추가): statements 89.98%, branches 80.5%, functions 90.74%, lines 93.1%
- 타입·비밀정보 검사·production build 통과
- 운영 빌드(`next start`) Chromium: 집신체크 주소·집신체크·랜딩·로그인 12건 통과, 페이지 오류 0건, 390px 화면 확인
- WebKit은 이 환경에서 미실행

## 남은 일(사용자 승인 필요)

1. Vercel 도메인 `ck.zipsin.net` 추가
2. 가비아 DNS `ck` CNAME
3. Vercel `NEXT_PUBLIC_CHECK_SITE_URL`
4. Supabase Redirect URL `https://ck.zipsin.net/auth/callback`
5. 연결 후 실제 확인, 이메일 링크의 집신체크 복귀(후속)

## 상태

Production·DNS·외부 설정 변경 없음. `승인 대기`.
