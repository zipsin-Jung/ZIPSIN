# Preview 가입·로그인·홈 검증 증거

- 확인일: 2026-10-13
- 판정: **미통과 — 최신 빌드의 Preview 배포 필요**

## 수행 순서

1. Vercel 프로젝트의 `codex/public-v1-auth` Preview 배포 확인
2. 배포 주소의 `/` 화면 확인
3. 현재 브랜치의 기대 흐름과 비교

## 확인 결과

- 배포 주소: `https://zipsin-git-codex-public-v1-auth-zipsin-jung.vercel.app/`
- 확인된 화면: 예전 랜딩페이지
- 현재 기대 화면: 비로그인 `/`은 `/login`으로 이동
- 결론: 현재 원격 Preview는 이 브랜치의 최신 코드가 아니므로 실제 인증 왕복 검증에 사용할 수 없다.
- 자동화 Chromium에서는 Vercel 로그인 보호 화면으로 이동했다. 재검증 시 Preview 전용 bypass 토큰을 시크릿으로 주입하거나 테스트 접근 정책을 먼저 준비해야 한다.

## 보안된 재검증 방법

- 최신 브랜치를 Preview로만 배포한다. Production은 변경하지 않는다.
- 일회성 테스트 계정을 사용하고 실제 개인 정보를 사용하지 않는다.
- 계정 정리 절차를 먼저 정한 뒤 가입 → 확인 → 역할 → 로그인 → `/home`을 390px·1440px에서 검증한다.
- 계정 정보는 `PREVIEW_TEST_USERNAME`, `PREVIEW_TEST_PASSWORD`로만 주입하고 Git·문서·스크린샷에 남기지 않는다.

## 미검증

- 신규 가입·이메일/전화 확인
- 역할 저장
- 로그아웃 후 재로그인
- 390px·1440px `/home` 진입
- 테스트 계정 정리
