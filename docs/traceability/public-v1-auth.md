# 공개형 서비스 V1 1단계 인증 추적표

- 기준일: 2026-10-06
- 범위: `PSV1-AUTH-001`~`004`, `PSV1-ROLE-001`
- 상태: 단일 화면 아이디·휴대폰 인증 로컬 구현·자동 검증 완료, Preview DB·실문자 연동 검수 대기

## 요구사항과 구현 증거

| 요구사항 | 화면·상태 | 대표 소스 | 대표 테스트 | 확인 결과 |
|---|---|---|---|---|
| `PSV1-AUTH-001` 세 간편가입 진입 | `/login`, `/auth/callback`; 준비 중·취소·오류·성공 복귀 | `features/auth/components/SocialLoginButtons.tsx`, `features/auth/actions/start-oauth.ts`, `app/(auth)/auth/callback/route.ts` | `tests/unit/auth/providers.test.ts`, `tests/integration/auth/callback.test.ts`, `tests/e2e/signup-onboarding.spec.ts` | 제공자 구분, 키보드 버튼, 안전한 복귀 경로와 오류 복구 자동 테스트 통과. 실제 제공자 왕복은 Preview 키 설정 후 필요 |
| `PSV1-AUTH-002` 전화 인증·동의 | 신규 비밀번호 가입은 `/signup` 한 화면의 `/api/auth/signup/phone/send`, `/verify`; OAuth·기존 미완료 계정은 `/signup/verify` 보존 | `features/auth/services/anonymous-signup-phone.ts`, `features/auth/server/signup-intent.ts`, `features/auth/actions/register-verified-password-account.ts`, `supabase/migrations/202610140004_anonymous_signup_phone.sql` | `tests/integration/auth/anonymous-signup-phone.test.ts`, `tests/integration/auth/register-verified-password-account.test.ts`, `tests/e2e/signup-onboarding.spec.ts` | OTP 전 계정 0건, 인증 증거 단일 소비, 필수 동의 전 가입 차단과 실패 보상 자동 테스트 통과. Preview migration·실문자 왕복은 대기 |
| `PSV1-AUTH-003` 아이디 가입·로그인 | `/signup`, `/login`; 중복·확인 대기·공통 실패·성공 | `features/auth/domain/username.ts`, `features/auth/services/register-verified-password-account.ts`, `features/auth/services/login-with-username.ts`, `supabase/migrations/202610060001_account_usernames.sql` | `tests/unit/auth/password-signup.test.ts`, `tests/integration/auth/register-verified-password-account.test.ts`, `tests/integration/auth/login-with-username.test.ts`, `tests/e2e/signup-onboarding.spec.ts` | 집신·집신체크가 같은 가입 화면과 계정을 사용한다. 아이디 중복 확인, 비공개 매핑, 중복 방지, 계정 열거 방지와 반응형 자동 테스트 통과. 기존 로그인 화면은 유지 |
| `PSV1-AUTH-004` 계정 복구 | `/account-recovery`, `/reset-password`; 동일 안내·만료·변경 | `features/auth/services/account-recovery.ts`, `features/auth/actions/request-account-recovery.ts`, `features/auth/actions/update-password.ts` | `tests/integration/auth/account-recovery.test.ts`, `tests/unit/auth/recovery-actions.test.ts` | 계정 상태와 무관한 요청 응답, 유효 세션 확인과 변경 후 로그아웃 자동 테스트 통과. 실제 메일 왕복 대기 |
| `PSV1-ROLE-001` 역할 선택 | `/onboarding/role`, `/home`; 미선택·저장·오류·완료 | `features/auth/components/RolePicker.tsx`, `features/auth/actions/save-role.ts`, `features/auth/guards/require-onboarding.ts`, `app/(app)/layout.tsx` | `tests/unit/auth/role.test.tsx`, `tests/integration/auth/guards.test.ts` | 네 역할 설명, 미인증 접근 차단, 역할이 자원 권한을 만들지 않는 구조 확인 |
| 기존 랜딩 보존 | `/`에서 `/login` 진입 | `app/page.tsx`, `components/*` | `tests/unit/smoke.test.tsx`, `tests/e2e/landing.spec.ts` | 기존 핵심 안내와 가입 이동 브라우저 테스트 통과 |

## 대표 소스와 테스트의 연결

| 대표 기능 | 소스 | 바로 대응하는 테스트 |
|---|---|---|
| 안전한 로그인 복귀 | `features/auth/domain/redirect.ts` | `tests/unit/auth/redirect.test.ts` |
| OAuth 제공자 선택 | `features/auth/domain/providers.ts`, `features/auth/actions/start-oauth.ts` | `tests/unit/auth/providers.test.ts` |
| OAuth 콜백 | `app/(auth)/auth/callback/route.ts` | `tests/integration/auth/callback.test.ts` |
| 전화 인증 규칙 | `features/auth/schemas/verification.ts`, `features/auth/phone/mock-provider.ts` | `tests/unit/auth/verification.test.ts` |
| 가입 완료 조건 | `features/auth/actions/complete-signup.ts`, `features/auth/domain/profile.ts` | `tests/integration/auth/complete-signup.test.ts`, `tests/unit/auth/profile.test.ts` |
| 역할 선택·보호 | `features/auth/domain/roles.ts`, `features/auth/guards/require-onboarding.ts` | `tests/unit/auth/role.test.tsx`, `tests/integration/auth/guards.test.ts` |
| 아이디 규칙·중복 차단 | `features/auth/domain/username.ts`, `supabase/migrations/202610060001_account_usernames.sql` | `tests/unit/auth/username.test.ts`, `tests/integration/auth/username-migration-security.test.ts` |
| 아이디 회원가입 | `features/auth/schemas/password-signup.ts`, `features/auth/services/register-password-account.ts` | `tests/unit/auth/password-signup.test.ts`, `tests/integration/auth/register-password-account.test.ts` |
| 아이디 로그인 | `features/auth/services/login-with-username.ts`, `features/auth/actions/login-with-username.ts` | `tests/integration/auth/login-with-username.test.ts`, `tests/unit/auth/username-login-action.test.ts` |
| 계정 복구 | `features/auth/services/account-recovery.ts`, `features/auth/actions/update-password.ts` | `tests/integration/auth/account-recovery.test.ts`, `tests/unit/auth/recovery-actions.test.ts` |

## 2026-10-06 아이디 인증 검증 결과

| 구분 | 명령 | 결과 |
|---|---|---|
| 타입 | `npm run typecheck` | 성공 |
| 단위·통합 | `npm test` | 26개 파일, 113개 테스트 통과 |
| 커버리지 | `npm run test:coverage` | Statements 90.8%, Branches 84.81%, Functions 90.32%, Lines 91.25% |
| 프로덕션 빌드 | `npm run build` | 성공 |
| 로컬 브라우저 | `PLAYWRIGHT_PORT=3016 npm run test:e2e` | Chromium 4개 시나리오 통과, 320·390·1440px 확인 |

빌드 성공과 브라우저 검수는 별도 증거다. 실제 Preview DB migration, 이메일, 세 OAuth 왕복은 아직 검증하지 않았다.

## 2026-10-14 단일 화면 휴대폰 가입 검증 결과

| 구분 | 결과 |
|---|---|
| 전체 단위·통합 | 116개 파일 통과, 1개 파일 제외; 602개 테스트 통과, 1개 제외 |
| 커버리지 | Statements 90.06%, Branches 81.08%, Functions 90.76%, Lines 93.23% |
| 타입·빌드·비밀정보 검사 | 모두 성공 |
| Chromium 브라우저 | 가입 시나리오 18개 확인; 320·390·768·1280·1440px, 200% 글자 확대·키보드와 실제 Route Handler 쿠키 왕복. 병렬 실행의 2개 시간초과는 1-worker 재실행 통과 |
| WebKit | 프로젝트 브라우저 설정에 없어 미검증 |
| Preview 실문자·DB | migration·환경값 적용 후 별도 검증 필요 |

빌드 성공과 Chromium 브라우저 검수는 분리해 기록했다. 이 결과는 Production 배포 또는 실제 문자 수신 성공을 뜻하지 않는다.

### SUA-AUTH 양방향 추적

| 요구사항·AC | 화면·상태 | 구현 증거 | 테스트·결과 |
|---|---|---|---|
| `001 / AC-001~004` | `/signup` 단일 화면·반응형·확대 | `PasswordSignupForm`, signup page | `password-signup-form`, `signup-onboarding`; Chromium 통과, WebKit 대기 |
| `002 / AC-005~009` | OTP 전 데이터 0건·발송/검증·단일 증거 | anonymous phone service, signup intent, send/verify routes, migration issue/verify/claim | anonymous phone service·route·migration·cookie E2E 통과; Preview DB 0건 확인 대기 |
| `003 / AC-010~014` | 완료 버튼·서버 재검증·충돌 복구·`/ck` 복귀 | verified signup schema/action/service, finalize RPC | form/action/service 테스트 통과; 실계정 1건·동시 제출 Preview 확인 대기 |
| `004 / AC-015~019` | 아이디·문자·최종 상태, 레거시 OAuth·verify | form 상태, legacy callback/verification/guard | 신규 form/action 및 기존 callback/verification 회귀 통과 |
| `005 / AC-020~024` | 동의·label·live/alert·tel/OTP·비성인인증 문구 | form, finalize consent, challenge redaction cron | 접근성 component/E2E·migration 보안 테스트 통과; 실제 cron 실행 대기 |

대표 실행 명령은 `npm run test:coverage`, `npm run typecheck`, `npm run build`, `npm run check:secrets`, `PLAYWRIGHT_PORT=3021 npx playwright test tests/e2e/signup-onboarding.spec.ts --project=chromium`이다.

## 2026-10-02 검증 결과

| 구분 | 명령 | 결과 |
|---|---|---|
| 타입 | `npm run typecheck` | 성공 |
| 단위·통합·커버리지 | `npm run test:coverage` | 14개 파일, 50개 테스트 통과 |
| 커버리지 | 같은 명령 | Statements 92.12%, Branches 85.26%, Functions 96.96%, Lines 92.30% |
| 프로덕션 빌드 | `npm run build` | 성공, 정적 `/`와 서버 인증 경로 생성 확인 |
| 브라우저 | `npm run test:e2e` | Chromium 4개 시나리오 통과; 320·390·1440px 로그인과 랜딩 이동·새로고침 확인 |

커버리지는 이번 단계의 인증 도메인·검증·서비스와 대표 UI/action을 측정한다. Supabase의 얇은 쿠키 어댑터와 Next.js 경계는 타입·빌드·통합·브라우저 테스트로 검증한다.

## 아직 열리지 않은 출시 게이트

- Supabase Preview 프로젝트에 migration과 RLS를 실제 적용하고 권한 시나리오를 재검증해야 한다.
- Google·Kakao·Naver의 실제 Client ID·비밀값·콜백 URL을 Preview에 설정해야 한다.
- 실제 문자 인증 공급자를 선정하고 어댑터를 연결해야 한다. 현재 모의 공급자는 Production에서 실행되지 않는다.
- 실제 계정으로 로그인 취소, 세션 복구, 전화 인증, 역할 저장을 Preview 브라우저에서 왕복 검수해야 한다.

## 독립 검수와 수정

- 독립 코드리뷰에서 인증 사용자가 민감한 프로필·동의 값을 직접 쓸 수 있는 P1 우회가 발견됐습니다.
- 직접 INSERT/UPDATE 정책과 권한을 제거하고, 가입·역할 저장을 사전조건을 확인하는 전용 RPC로 제한했습니다.
- 인증 결과에 만료·소비 시각을 추가하고 가입 완료 트랜잭션에서 일회성으로 소비하도록 수정했습니다.
- 가입 성공 뒤 역할 선택 이동, 랜딩의 `/login` 진입, 이력 덮어쓰기 방지와 보안 회귀 테스트를 추가했습니다.
- 재검수에서 확인된 0건 인증 갱신의 잘못된 성공 응답과 임의 약관 버전 기록도 차단했습니다.
- 수정 코드의 자동 검증은 통과했지만 실제 Postgres RLS 음성 테스트는 Preview DB가 준비되어야 실행할 수 있습니다. 품질 상태는 **조건부 통과·사용자 승인 대기**입니다.
- 2026-10-06 추가 독립 검수의 P1 회원가입 남용 위험을 해결하기 위해 가입에도 출처·이메일·아이디 기준 DB 요청 제한을 적용했습니다. 추측 가능한 단순 해시 대신 서버 비밀값 HMAC을 사용하고, 가입 보상 삭제 실패를 비공개 정리 대기열에 기록하도록 보강했습니다.
- 정리 대기열 기록 실패 경보까지 보강한 최종 독립 재검수에서 P0·P1·P2 0건과 로컬 병합 승인을 받았습니다. 이는 Preview·Production 배포 승인이 아닙니다.

따라서 현재 상태는 **코드와 로컬 자동 검증 완료**이며, **실제 회원가입 서비스 개시 완료가 아니다**.

## 롤백

1. Vercel Production에는 이 브랜치를 연결하지 않고 직전 안정 배포를 유지한다.
2. 문제가 발견되면 로그인 진입 링크를 기존 체험 폼으로 되돌리고 인증 경로 배포를 중단한다.
3. Supabase 적용 후 되돌릴 때는 `docs/technical/public-v1-data-access.md`의 롤백 순서를 사용한다.
4. 비밀값은 Git이 아니라 Vercel·Supabase 설정에서 제거하거나 회전한다.
# 2026-10-14 인증 보강 추적

- `AUTHUX-001`: 로그인 기록 이미지와 활성 OAuth만 표시 — `9694d82`
- `AUTHUX-002`: 아이디 중복확인 API·UI, DB unique 최종 판정 유지 — `da49feb`
- `AUTHUX-003`: `집신과 함께 해요 → 휴대폰 인증`과 `/ck` 복귀 — `4a084a5`
- `AUTHUX-004`: SOLAPI 전송 어댑터, HMAC OTP, 만료·시도·소비 경계 — `f739e36`
- `AUTHUX-005`: 이메일 또는 인증 휴대폰 계정 확인 — `1d5e076`
- 자동 검증: 553 passed, 1 skipped; coverage 90.82/83.08/90.88/94.51; typecheck·build·secret scan 통과
- 인증 반응형 E2E: 5개 화면 폭 15개 통과. 전체 E2E의 인증 외 기존 실패 16개는 작업 기록에 분리했다.
- 독립 검수 P1 수정: 문자 원자 제한, 복구 OTP 행 잠금·단일 소비, 10분 HttpOnly 비밀번호 복구 세션, 전화 미인증 저장/RLS 차단, 실제 약관 입력, 아이디 확인 제한·오래된 응답 폐기, SOLAPI timeout·응답 검증.
- 수정 후 자동 검증: 559 passed, 1 skipped; coverage 89.88/81.87/90.93/93.26; typecheck·build·secret scan 통과; 인증 관련 Playwright 17개 통과.
