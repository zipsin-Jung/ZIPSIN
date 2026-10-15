# Single-Page Phone Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비밀번호 신규가입 사용자가 `/signup` 한 화면에서 휴대폰 OTP를 완료한 뒤에만 집신 계정을 정확히 한 번 생성하도록 구현한다.

**Architecture:** 신규 비밀번호 가입에만 익명 사전 OTP 경계를 추가한다. 짧은 수명의 HttpOnly 가입 의도 쿠키와 service-role 전용 challenge를 묶고, 최종 action이 challenge를 claim한 뒤 Auth 사용자를 생성하고 제품 데이터를 원자적으로 최종화한다. 기존 `/signup/verify`와 로그인 사용자용 전화 인증은 OAuth·미완료 계정 복구용으로 보존한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth/Postgres/RLS, SOLAPI, Zod, Vitest, Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-10-14-single-page-phone-signup-design.md`

## Global Constraints

- OTP 성공 전 Supabase Auth 사용자, 아이디, 프로필, 동의, 유입 영구 데이터는 0건이어야 한다.
- 휴대폰 인증은 번호 소지 확인이며 법적 본인확인·성인인증으로 표현하지 않는다.
- 전체 전화번호·OTP·비밀번호·비밀키를 URL, 브라우저 저장소, 분석, 애플리케이션 로그, Git에 남기지 않는다.
- 기존 OAuth, 미완료 계정, 로그인, 계정 복구와 `/ck` 로컬 기록을 보존한다.
- 새 DB 경계는 additive migration으로 추가하고 anon·authenticated 직접 권한을 허용하지 않는다.
- 320·390·768·1440px, 200% 확대, 키보드, 44px 터치 영역을 검수한다.
- Production 배포는 사용자 최종 승인 전 수행하지 않는다.
- 구현 전에 `node_modules/next/dist/docs/`의 관련 App Router·cookies·Route Handler·Server Action 문서를 읽고 현재 버전 API를 따른다.

## Review Focus

- OTP 인증 뒤 전화번호를 바꾸면 기존 인증 증거가 즉시 무효가 되는지 Task 4 UI와 Task 2 서버 테스트로 고정한다.
- 아이디 중복확인 뒤 다른 사용자가 먼저 가입해도 고아 Auth 계정 없이 복구되는지 Task 3 경쟁 테스트로 고정한다.
- 동일한 인증 증거와 버튼을 병렬로 여러 번 제출해도 계정이 하나만 생기는지 Task 1 RPC와 Task 3 saga 테스트로 고정한다.
- 이메일 확인이 켜진 환경에서 인증 증거가 재사용되지 않고 같은 화면에 확인 대기 상태가 보이는지 Task 3·4에서 고정한다.
- 기존 OAuth·미완료 사용자가 신규 익명 경계로 잘못 유입되지 않는지 Task 5 회귀 테스트로 고정한다.

---

### Task 1: 익명 가입 challenge 데이터와 원자 RPC

**Files:**
- Create: `supabase/migrations/202610140004_anonymous_signup_phone.sql`
- Create: `tests/unit/auth/anonymous-signup-phone-migration.test.ts`
- Modify: `tests/integration/auth/migration-security.test.ts`

**Interfaces:**
- Consumes: 기존 `auth_rate_limits`, `auth_cleanup_queue`, `profiles`, `account_usernames`, `consent_acceptances`, `signup_attributions` 테이블
- Produces: `anonymous_signup_phone_challenges`, `issue_anonymous_signup_phone_challenge`, `verify_anonymous_signup_phone_challenge`, `claim_anonymous_signup_phone_challenge`, `finalize_verified_password_signup`, `release_anonymous_signup_phone_claim`

- [ ] **Step 1: TEST-SP-DB-01·SEC-01 실패 테스트 작성**

  migration 테스트가 테이블 RLS, anon/authenticated revoke, service_role RPC 권한, 5분 만료, 5회 오답, intent 일치, claim 단일 소비, phone·username 동시 경쟁, 성공 최종화와 실패 해제를 요구하게 한다.

- [ ] **Step 2: 실패 확인**

  Run: `npm test -- tests/unit/auth/anonymous-signup-phone-migration.test.ts tests/integration/auth/migration-security.test.ts`
  Expected: 신규 migration 또는 RPC 이름이 없어 FAIL.

- [ ] **Step 3: additive migration 최소 구현**

  `anonymous_signup_phone_challenges`와 서버 전용 RPC를 추가한다. challenge는 `intent_digest`, `phone_e164`, `code_digest`, attempts, sent/expires/verified/claimed/consumed timestamps, claim digest·expiry, delivery 상태를 가진다. finalize RPC는 이미 생성된 Auth user ID를 검증하고 username·profile·consent·attribution·challenge consume을 단일 트랜잭션으로 처리한다.

- [ ] **Step 4: focused GREEN 확인**

  Run: `npm test -- tests/unit/auth/anonymous-signup-phone-migration.test.ts tests/integration/auth/migration-security.test.ts`
  Expected: PASS.

- [ ] **Step 5: 커밋**

  `git add supabase/migrations/202610140004_anonymous_signup_phone.sql tests/unit/auth/anonymous-signup-phone-migration.test.ts tests/integration/auth/migration-security.test.ts && git commit -m "feat(auth): add anonymous signup phone challenge"`

### Task 2: 가입 의도 쿠키와 익명 문자 발송·검증 API

**Files:**
- Create: `features/auth/server/signup-intent.ts`
- Create: `features/auth/services/anonymous-signup-phone.ts`
- Create: `app/api/auth/signup/phone/send/route.ts`
- Create: `app/api/auth/signup/phone/verify/route.ts`
- Create: `tests/unit/auth/signup-intent.test.ts`
- Create: `tests/integration/auth/anonymous-signup-phone.test.ts`
- Modify: `features/auth/server/sms-rate-limit.ts`

**Interfaces:**
- Consumes: Task 1 RPC, `normalizeKoreanMobile`, `createOtpDigest`, `reserveSmsSend`, `getSolapiSmsTransport`
- Produces: `getOrCreateSignupIntent(): Promise<{ raw: string; digest: string }>`, `clearSignupIntent(): Promise<void>`, `sendAnonymousSignupPhoneCode(input)`, `verifyAnonymousSignupPhoneCode(input)`와 두 POST route

- [ ] **Step 1: TEST-SP-STATE-02·SEC-01 실패 테스트 작성**

  무쿠키 최초 발급, HttpOnly·Secure·SameSite=Lax·짧은 TTL, 잘못된 번호, 다른 intent, 번호 변경·새 발송 시 이전 challenge 무효, 원자 발송 제한, SOLAPI 실패, 만료, 오답 5회, 재사용과 동시 verify 거부를 검증한다.

- [ ] **Step 2: 실패 확인**

  Run: `npm test -- tests/unit/auth/signup-intent.test.ts tests/integration/auth/anonymous-signup-phone.test.ts`
  Expected: 모듈 또는 route가 없어 FAIL.

- [ ] **Step 3: 가입 의도와 서비스 최소 구현**

  Node crypto 난수와 HMAC digest를 사용하고 쿠키 원문은 서버에서만 읽는다. 발송 전에 intent·phone·origin 단위 `reserveSmsSend`를 통과시키고, OTP 원문은 전송 뒤 보관하지 않는다.

- [ ] **Step 4: Route Handler 최소 구현**

  send는 `{ challengeId, expiresAt, maskedPhone }`, verify는 `{ ok: true }`만 반환한다. 존재 여부를 열거하지 않고 provider·rate-limit·invalid·expired 오류를 안정된 코드로 매핑한다.

- [ ] **Step 5: focused GREEN 확인**

  Run: `npm test -- tests/unit/auth/signup-intent.test.ts tests/integration/auth/anonymous-signup-phone.test.ts`
  Expected: PASS.

- [ ] **Step 6: 커밋**

  `git add features/auth/server/signup-intent.ts features/auth/services/anonymous-signup-phone.ts features/auth/server/sms-rate-limit.ts app/api/auth/signup/phone/send/route.ts app/api/auth/signup/phone/verify/route.ts tests/unit/auth/signup-intent.test.ts tests/integration/auth/anonymous-signup-phone.test.ts && git commit -m "feat(auth): add pre-account phone verification"`

### Task 3: 인증된 최종 회원가입 saga

**Files:**
- Create: `features/auth/actions/register-verified-password-account.ts`
- Create: `features/auth/services/register-verified-password-account.ts`
- Create: `tests/unit/auth/register-verified-password-account-action.test.ts`
- Create: `tests/integration/auth/register-verified-password-account.test.ts`
- Modify: `features/auth/schemas/password-signup.ts`
- Preserve: `features/auth/actions/register-password-account.ts`
- Preserve: `features/auth/services/register-password-account.ts`

**Interfaces:**
- Consumes: Task 1 claim/finalize/release RPC, Task 2 signup intent, `passwordSignupSchema`, `sanitizeNextPath`, admin Auth delete와 `auth_cleanup_queue`
- Produces: `registerVerifiedPasswordAccountAction(formData: FormData)`와 `registerVerifiedPasswordAccount(repository, input)`

- [ ] **Step 1: TEST-SP-GATE-01·DB-01·NEXT-01 실패 테스트 작성**

  미인증·만료·다른 intent 거부, claim 뒤 Auth 실패 release, finalize 실패 시 이 요청의 Auth 사용자 보상삭제, 삭제 실패 cleanup queue, username·email·phone 경쟁, 병렬 제출 1계정, 이메일 확인 on/off와 `/ck` safe next를 검증한다.

- [ ] **Step 2: 실패 확인**

  Run: `npm test -- tests/unit/auth/register-verified-password-account-action.test.ts tests/integration/auth/register-verified-password-account.test.ts`
  Expected: 신규 action/service가 없어 FAIL.

- [ ] **Step 3: service saga 최소 구현**

  repository 인터페이스는 `claimPhoneProof`, `createAuthUser`, `finalizeSignup`, `releaseClaim`, `deleteAuthUser`, `queueCleanup`을 노출한다. 오직 이 요청에서 생성한 user만 삭제한다.

- [ ] **Step 4: Server Action 최소 구현**

  아이디·비밀번호·이메일·동의를 서버 재검증하고 origin·username·email 제한을 적용한다. 성공 시 intent 쿠키를 지우고 세션이 있으면 안전한 next, 이메일 확인이 필요하면 `/signup?notice=check_email`로 보낸다.

- [ ] **Step 5: focused GREEN 확인**

  Run: `npm test -- tests/unit/auth/register-verified-password-account-action.test.ts tests/integration/auth/register-verified-password-account.test.ts`
  Expected: PASS.

- [ ] **Step 6: 기존 가입 service 회귀 확인**

  Run: `npm test -- tests/unit/auth/register-password-account-action.test.ts tests/integration/auth/register-password-account.test.ts`
  Expected: 기존 OAuth·미완료 호환을 위한 레거시 경계 PASS.

- [ ] **Step 7: 커밋**

  `git add features/auth/actions/register-verified-password-account.ts features/auth/services/register-verified-password-account.ts features/auth/schemas/password-signup.ts tests/unit/auth/register-verified-password-account-action.test.ts tests/integration/auth/register-verified-password-account.test.ts && git commit -m "feat(auth): finalize verified password signup"`

### Task 4: `/signup` 단일 화면과 상태 UX

**Files:**
- Modify: `features/auth/components/PasswordSignupForm.tsx`
- Modify: `app/(auth)/signup/page.tsx`
- Modify: `tests/unit/auth/password-signup-form.test.tsx`
- Modify: `tests/unit/auth/new-auth-forms.test.tsx`
- Modify: `tests/unit/auth/signup-progress.test.tsx`
- Modify: `tests/e2e/signup-onboarding.spec.ts`

**Interfaces:**
- Consumes: Task 2 send/verify JSON API, Task 3 `registerVerifiedPasswordAccountAction`
- Produces: 한 화면 폼의 username·phone·OTP·consent·submit 상태와 접근 가능한 오류 UI

- [ ] **Step 1: TEST-SP-FLOW-01·STATE-01·STATE-02·GATE-01·A11Y-01 실패 테스트 작성**

  이메일 바로 아래 phone, 발송 뒤 OTP 확장, 큰 단계 탭·중복동의 없음, 인증 성공 전 submit 비활성, 번호 변경 시 인증 무효, resend countdown, 입력별 상태·aria-live·role alert·첫 오류 focus를 검증한다.

- [ ] **Step 2: 실패 확인**

  Run: `npm test -- tests/unit/auth/password-signup-form.test.tsx tests/unit/auth/new-auth-forms.test.tsx tests/unit/auth/signup-progress.test.tsx`
  Expected: 현재 분리 화면·기존 action 사용 때문에 FAIL.

- [ ] **Step 3: 폼 상태와 UI 최소 구현**

  `PasswordSignupForm`을 Task 3 action에 연결한다. 비밀번호·OTP는 React 상태나 영구 저장소에 불필요하게 복제하지 않는다. 전화번호 변경 시 challenge와 verified 상태를 지우고, 가입 버튼은 모든 조건 충족 때만 활성화한다.

- [ ] **Step 4: 페이지 문구와 단계 표시 정리**

  `/signup`의 큰 2단계 진행표를 제거하고 `휴대폰 인증까지 한 화면에서 완료해요` 취지의 짧은 설명과 이메일 확인 대기 상태를 유지한다.

- [ ] **Step 5: focused GREEN 확인**

  Run: `npm test -- tests/unit/auth/password-signup-form.test.tsx tests/unit/auth/new-auth-forms.test.tsx tests/unit/auth/signup-progress.test.tsx`
  Expected: PASS.

- [ ] **Step 6: Playwright 흐름 테스트 갱신**

  mock API로 한 화면 정상·오답·만료·번호 변경·중복 클릭과 `/ck` 복귀 시나리오를 작성한다.

- [ ] **Step 7: 커밋**

  `git add features/auth/components/PasswordSignupForm.tsx 'app/(auth)/signup/page.tsx' tests/unit/auth/password-signup-form.test.tsx tests/unit/auth/new-auth-forms.test.tsx tests/unit/auth/signup-progress.test.tsx tests/e2e/signup-onboarding.spec.ts && git commit -m "feat(auth): combine phone verification into signup"`

### Task 5: 연령 가드 제거와 레거시 흐름 회귀

**Files:**
- Modify: `features/auth/guards/require-onboarding.ts`
- Modify: `features/auth/domain/profile.ts`
- Modify: `tests/integration/auth/guards.test.ts`
- Modify: `tests/integration/auth/complete-signup.test.ts`
- Modify: `tests/unit/auth/profile.test.ts`
- Modify: `tests/unit/auth/verification-form.test.tsx`
- Modify: `tests/integration/auth/callback.test.ts`

**Interfaces:**
- Consumes: 기존 authenticated `/api/phone/*`, `/signup/verify`, `complete_signup`
- Produces: terms·privacy·phone·role만으로 일관된 onboarding 판정과 OAuth·미완료 계정 회귀 증거

- [ ] **Step 1: TEST-SP-LEGACY-01 실패 테스트 작성**

  `age_over_14`가 없어도 phone+terms+privacy가 있으면 verify로 되돌리지 않고, OAuth·기존 미완료·이메일 callback은 유지된 `/signup/verify`에서 완료되는지 검증한다.

- [ ] **Step 2: 실패 확인**

  Run: `npm test -- tests/integration/auth/guards.test.ts tests/integration/auth/complete-signup.test.ts tests/unit/auth/profile.test.ts tests/unit/auth/verification-form.test.tsx tests/integration/auth/callback.test.ts`
  Expected: 현재 `confirmedAgeOver14` 필수 가드 때문에 신규 케이스 FAIL.

- [ ] **Step 3: 최소 가드 정리**

  `OnboardingProfile`과 `evaluateOnboarding`에서 age 동의 의존성을 제거한다. 기존 DB 동의 행은 삭제하지 않고 더 이상 완료 조건이나 신규 기록으로 사용하지 않는다.

- [ ] **Step 4: focused GREEN 확인**

  Run: `npm test -- tests/integration/auth/guards.test.ts tests/integration/auth/complete-signup.test.ts tests/unit/auth/profile.test.ts tests/unit/auth/verification-form.test.tsx tests/integration/auth/callback.test.ts`
  Expected: PASS.

- [ ] **Step 5: 커밋**

  `git add features/auth/guards/require-onboarding.ts features/auth/domain/profile.ts tests/integration/auth/guards.test.ts tests/integration/auth/complete-signup.test.ts tests/unit/auth/profile.test.ts tests/unit/auth/verification-form.test.tsx tests/integration/auth/callback.test.ts && git commit -m "fix(auth): align onboarding with required consents"`

### Task 6: 전체 검증·추적 문서·Preview 인계

**Files:**
- Modify: `docs/traceability/public-v1-auth.md`
- Modify: `docs/worklogs/2026-10-14-single-page-phone-signup-spec.md`
- Create: `docs/worklogs/2026-10-14-single-page-phone-signup-implementation.md`
- Modify: `docs/decisions/DEC-025-single-page-pre-account-phone-verification.md`
- Modify: `tests/e2e/preview-auth-home.spec.ts`

**Interfaces:**
- Consumes: Tasks 1~5 전체 구현과 TEST-ID 증거
- Produces: REQ↔AC↔source↔TEST 양방향 추적, 검증 결과, Preview 외부 설정 체크리스트

- [ ] **Step 1: 전체 자동검사**

  Run: `npm test`
  Expected: 전체 PASS, 기존 실패가 있으면 이름과 원인을 보고하고 수정.

- [ ] **Step 2: 타입·빌드·비밀정보 검사**

  Run: `npm run typecheck && npm run build && npm run check:secrets`
  Expected: 모두 exit 0. 빌드 성공을 브라우저 성공으로 표현하지 않는다.

- [ ] **Step 3: 변경 코드 커버리지**

  Run: `npm run test:coverage`
  Expected: 선언한 변경 제품 코드 범위의 statements, branches, functions, lines 각각 80% 이상.

- [ ] **Step 4: 로컬 실제 브라우저 검수**

  320·390·768·1440px와 Chromium·WebKit에서 한 화면 순서, 모바일 키보드, 가로 넘침, 44px, 키보드 focus, 오류·재시도를 검수한다.

- [ ] **Step 5: Preview 외부 설정·실문자 검수**

  Supabase migration/RPC, service-role·HMAC·SOLAPI 환경값, 발신번호·잔액을 확인한다. 실제 단말에서 정상 수신·오답·만료·재전송·가입 완료·로그인·`/ck` 복귀를 검수하고 OTP 전 0계정·완료 후 1계정을 Supabase에서 확인한다. 외부 설정이 없으면 `미검증`으로 보고하고 완료 처리하지 않는다.

- [ ] **Step 6: 추적·작업 문서 갱신과 바탕화면 복사**

  `REQ-ID | AC-ID | FLOW/SCREEN/STATE | source path:symbol | TEST-ID | test path:name | level | normal/failure/permission | command | evidence | coverage | unverified`를 기록하고 갱신 문서를 바탕화면 집신 문서함에 같은 구조로 복사한다.

- [ ] **Step 7: 독립 품질 검수**

  `zipsin-quality-gate`로 P0·P1, 개인정보, 접근성, 실제 브라우저, 실문자, 롤백을 독립 검수한다. Critical·Important는 각각 RED→GREEN으로 한 번 수정하고 전체 검사를 다시 실행한다.

- [ ] **Step 8: 최종 커밋·안전한 브랜치 푸시**

  `git add`로 관련 파일만 검토한 뒤 `git commit -m "docs(auth): record single-page signup verification"`와 `git push origin codex/zipsin-shared-auth-integration`을 실행한다. Production은 배포하지 않는다.

## Self-Review Result

- Spec coverage: SUA-AUTH-001~005와 AC-001~024가 Tasks 1~6에 모두 매핑됐다.
- Interface consistency: Task 1 RPC → Task 2 API → Task 3 saga → Task 4 UI 의존성이 동일한 이름으로 연결됐다.
- Failure coverage: 인증 전 데이터, 증거 교환·재사용, 동시 제출, 외부 설정, 기존 사용자 회귀가 owning task의 테스트에 포함됐다.
- Proportion: 구현 본문 대신 경계·signature·테스트와 명령만 고정했다.
