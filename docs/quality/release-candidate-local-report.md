# 집신 출시 후보 로컬 검수 보고서

## 검수 환경

- 기준: `e29cd3b` 이후 Task 6 검증 작업 트리
- macOS 26.6.1, Node.js v24.21.0, Next.js 16.4.0, Chromium
- 로컬 브라우저는 비밀값이 아닌 Supabase 공개 환경변수 대역을 사용했다. 실제 데이터 검증은 Preview로 분리한다.

## 결과

| 검수 | 명령 | 결과 |
|---|---|---|
| 타입 | `npm run typecheck` | 통과, 오류 0건 |
| 단위·통합·로컬 검사 | `npm test -- --run` | 68 files 통과, 330 tests 통과, Preview 스트레스 1건 skip |
| 커버리지 | `npm run test:coverage` | 네 지표 모두 80% 이상 |
| 프로덕션 빌드 | `npm run build` | 22개 static page 생성 포함 성공 |
| 로컬 브라우저 | 공개 Supabase 변수 일회성 주입 후 `npm run test:e2e` | 11 통과, Preview 전용 9 skip |
| 반응형·접근성 | `release-responsive-accessibility.spec.ts` | 320·390·768·1440px 모두 통과, axe 위반 0건, 가로 넘침 0건 |
| 의존성 보안 | `npm audit --omit=dev --audit-level=high` | 취약점 0건 |

## 브라우저 증거

- `test-results/release-responsive-320.png`
- `test-results/release-responsive-390.png`
- `test-results/release-responsive-768.png`
- `test-results/release-responsive-1440.png`
- 실패 시에만 Playwright trace와 screenshot을 남기도록 `playwright.config.ts`에 설정했다.

## 남은 출시 차단 조건

1. 실제 문자 인증 공급자 연결과 전용 이메일 발송 설정
2. Google·Kakao·Naver OAuth 공급자 설정과 실제 왕복
3. 계약 생성 화면과 실제 브라우저 사진·PDF 업로드 왕복
4. 준비된 Preview 계정으로 동일 기록 20회 동시 요청 스트레스 실행
5. Production 배포는 사용자 승인 전에 실행하지 않음

빌드 성공은 브라우저 검수 성공으로 표현하지 않았다.
