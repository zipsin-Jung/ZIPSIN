# 집신 계정·휴대폰 인증 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 집신과 집신체크가 같은 계정을 사용하면서 아이디 중복확인, SOLAPI 실제 휴대폰 인증, 이메일·휴대폰 계정 복구를 안전하게 제공한다.

**Architecture:** Supabase Auth와 `account_usernames`를 주 계정 경계로 유지하고, SOLAPI는 서버 전용 문자 전송 어댑터로만 사용한다. OTP 발급·검증·소비와 복구 세션은 Supabase DB의 서버 전용 RPC가 담당하며, 로그인·가입 UI는 이 경계를 사용하는 얇은 클라이언트로 유지한다.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Auth/Postgres, SOLAPI REST API, Vitest/Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-10-14-auth-identity-phone-recovery-design.md`

## Global Constraints

- 집신체크 익명 로컬 사용은 계속 허용하고 계정 생성·서버 저장을 선택할 때만 휴대폰 인증을 요구한다.
- OTP는 6자리, 유효시간 5분, 재발송 간격 60초, 오답 최대 5회다.
- 실제 공급자 장애나 미설정 상태에서 인증을 우회하지 않으며 production mock을 금지한다.
- OTP 원문, 전체 전화번호, SOLAPI 비밀값을 로그·URL·클라이언트 저장소에 남기지 않는다.
- 아이디 중복확인은 안내용이며 최종 가입은 DB 고유 제약으로 다시 판정한다.
- `next`는 기존 허용 경로 검사를 거쳐야 하며 인증 뒤 정확한 집신체크 경로로 돌아간다.
- 운영 Production 배포와 실제 비밀값 입력은 사용자 별도 승인 전 수행하지 않는다.
- Next.js 코드를 변경하기 전에 `node_modules/next/dist/docs/01-app/`의 관련 Route Handler·Server/Client Component 문서를 확인한다.
- 모든 기능 변경은 실패 테스트를 먼저 실행한 뒤 최소 구현으로 통과시킨다.

## Review Focus

- 같은 아이디로 동시에 가입할 때 한 계정만 성공하고 실패한 Auth 사용자가 보상 삭제되는지 확인한다.
- 인증번호를 연속 발급·오입력·만료·재사용할 때 이전 코드와 소비된 challenge가 거부되는지 확인한다.
- 존재하지 않는 이메일·휴대폰도 계정 복구 최초 응답이 동일해 계정 존재를 노출하지 않는지 확인한다.
- SOLAPI 지연·잔액 부족·발신번호 미승인·잘못된 응답에서도 가입이 우회되지 않고 재시도 가능한 오류가 보이는지 확인한다.
- 320px 화면, 200% 확대, 키보드 조작에서 이미지·버튼·오류 안내가 겹치거나 잘리지 않는지 확인한다.

---

### Task 1: 아이디 중복확인 경계

**Files:**
- Create: `app/api/auth/username-availability/route.ts`
- Create: `features/auth/services/check-username-availability.ts`
- Modify: `features/auth/components/PasswordSignupForm.tsx`
- Test: `tests/integration/auth/username-availability.test.ts`
- Test: `tests/unit/auth/password-signup-form.test.tsx`

**Interfaces:**
- Consumes: `normalizeUsername(username: string)`와 `account_usernames.username_normalized` 고유 제약
- Produces: `checkUsernameAvailability(repository, username): Promise<UsernameAvailabilityResult>`와 `POST /api/auth/username-availability`

- [ ] **Step 1: 실패 테스트 작성** — 사용 가능·중복·잘못된 형식·DB 오류와 확인 뒤 입력 변경 시 상태 무효화를 각각 검증한다.
- [ ] **Step 2: RED 확인** — `npm test -- tests/integration/auth/username-availability.test.ts tests/unit/auth/password-signup-form.test.tsx`; 새 API와 상태가 없어 예상대로 실패해야 한다.
- [ ] **Step 3: 최소 구현** — 응답을 `available | unavailable | invalid | rate_limited | temporarily_unavailable`로 제한하고 `Cache-Control: no-store`를 적용한다.
- [ ] **Step 4: GREEN 확인** — 같은 명령이 통과하고 가입 action의 DB 고유 제약 테스트도 함께 통과해야 한다.
- [ ] **Step 5: 커밋** — `feat(auth): add username availability check`

### Task 2: OTP 데이터 경계와 SOLAPI 전송 어댑터

**Files:**
- Create: `supabase/migrations/202610140001_phone_verification_hardening.sql`
- Create: `features/auth/phone/solapi-provider.ts`
- Create: `features/auth/phone/otp-digest.ts`
- Modify: `features/auth/phone/provider.ts`
- Modify: `features/auth/phone/runtime-provider.ts`
- Modify: `app/api/phone/send/route.ts`
- Modify: `app/api/phone/verify/route.ts`
- Test: `tests/integration/auth/phone-verification-migration.test.ts`
- Test: `tests/unit/auth/solapi-provider.test.ts`
- Test: `tests/unit/auth/verification.test.ts`

**Interfaces:**
- Consumes: `PhoneVerificationProvider`, 서버 전용 SOLAPI 환경값, 현재 로그인 사용자 ID
- Produces: `SolapiPhoneVerificationProvider`, `createOtpDigest(code, challengeId)`, 서버 전용 `issue_phone_challenge`·`verify_phone_challenge` RPC

- [ ] **Step 1: 실패 테스트 작성** — 6자리 난수, HMAC 저장, 5분 만료, 60초 제한, 5회 오답, 이전 코드 무효화, 단일 소비, production mock 거부를 검증한다.
- [ ] **Step 2: RED 확인** — `npm test -- tests/integration/auth/phone-verification-migration.test.ts tests/unit/auth/solapi-provider.test.ts tests/unit/auth/verification.test.ts`가 새 경계 부재로 실패해야 한다.
- [ ] **Step 3: 최소 DB 구현** — additive migration으로 목적·digest·시도·provider ID·오류 코드를 추가하고 원자적 RPC와 권한 제한을 만든다.
- [ ] **Step 4: 최소 공급자 구현** — SOLAPI HMAC 인증 헤더와 전송 요청을 서버에서 생성하고 민감정보 없는 오류 코드로 변환한다.
- [ ] **Step 5: Route 연결** — 발급·검증 Route가 RPC와 공급자를 사용하며 development 외에는 코드를 반환하지 않게 한다.
- [ ] **Step 6: GREEN 확인** — 대상 테스트와 `npm run check:secrets`가 통과해야 한다.
- [ ] **Step 7: 커밋** — `feat(auth): connect hardened solapi phone verification`

### Task 3: 두 단계 회원가입과 휴대폰 인증 완료

**Files:**
- Modify: `app/(auth)/signup/page.tsx`
- Modify: `app/(auth)/signup/verify/page.tsx`
- Modify: `features/auth/components/VerificationForm.tsx`
- Modify: `features/auth/actions/register-password-account.ts`
- Modify: `features/auth/actions/complete-signup.ts`
- Modify: `features/auth/services/complete-signup.ts`
- Test: `tests/unit/auth/signup-progress.test.tsx`
- Test: `tests/unit/auth/verification-form.test.tsx`
- Test: `tests/integration/auth/complete-signup.test.ts`
- Test: `tests/e2e/signup-onboarding.spec.ts`

**Interfaces:**
- Consumes: Task 2의 verified challenge와 기존 `sanitizeNextPath`
- Produces: `1 집신과 함께 해요` → `2 휴대폰 인증` → 안전한 `next` 복귀 흐름

- [ ] **Step 1: 실패 테스트 작성** — `/ck` 유입도 SMS를 건너뛰지 않고, 인증 전 가입 완료가 거부되며, 인증 뒤 로컬 기록을 유지한 채 `/ck`로 복귀하는지 검증한다.
- [ ] **Step 2: RED 확인** — `npm test -- tests/unit/auth/signup-progress.test.tsx tests/unit/auth/verification-form.test.tsx tests/integration/auth/complete-signup.test.ts`와 해당 Playwright 시나리오가 현재 우회 때문에 실패해야 한다.
- [ ] **Step 3: 최소 구현** — 두 단계 문구, `autocomplete=tel/one-time-code`, 전송 대기·만료·오류 상태와 challenge 단일 소비를 연결한다.
- [ ] **Step 4: GREEN 확인** — 대상 unit/integration/E2E가 모두 통과해야 한다.
- [ ] **Step 5: 커밋** — `feat(auth): require phone verification for saved accounts`

### Task 4: 이메일·휴대폰 계정 복구

**Files:**
- Create: `supabase/migrations/202610140002_phone_account_recovery.sql`
- Create: `app/api/auth/recovery/phone/send/route.ts`
- Create: `app/api/auth/recovery/phone/verify/route.ts`
- Create: `features/auth/services/phone-account-recovery.ts`
- Modify: `app/(auth)/account-recovery/page.tsx`
- Modify: `features/auth/components/AccountRecoveryForm.tsx`
- Modify: `features/auth/actions/request-account-recovery.ts`
- Test: `tests/integration/auth/phone-account-recovery.test.ts`
- Test: `tests/integration/auth/account-recovery.test.ts`
- Test: `tests/unit/auth/recovery-actions.test.ts`
- Test: `tests/e2e/signup-onboarding.spec.ts`

**Interfaces:**
- Consumes: Task 2의 문자 전송 어댑터와 verified phone 1계정 정책
- Produces: 이메일 또는 휴대폰을 선택하는 중립적 복구 흐름과 짧은 수명의 HttpOnly recovery session

- [ ] **Step 1: 실패 테스트 작성** — 존재·부재 동일 최초 응답, 인증 전 정보 비노출, 만료·재사용 거부, 성공 뒤 아이디 확인과 비밀번호 재설정 진입을 검증한다.
- [ ] **Step 2: RED 확인** — `npm test -- tests/integration/auth/phone-account-recovery.test.ts tests/integration/auth/account-recovery.test.ts tests/unit/auth/recovery-actions.test.ts`가 새 복구 경계 부재로 실패해야 한다.
- [ ] **Step 3: 최소 DB·서버 구현** — recovery challenge와 단일 사용 세션을 추가하고 raw phone 및 계정 존재 여부를 응답에서 제거한다.
- [ ] **Step 4: 최소 UI 구현** — 제목을 `아이디 찾기 · 비밀번호 재설정`으로 바꾸고 이메일/휴대폰 탭과 접근 가능한 상태 안내를 연결한다.
- [ ] **Step 5: GREEN 확인** — 대상 테스트와 복구 E2E가 통과해야 한다.
- [ ] **Step 6: 커밋** — `feat(auth): add email and phone account recovery`

### Task 5: 로그인 화면과 활성 OAuth 표시

**Files:**
- Create: `public/images/auth/zipsin-record-visual.png`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `features/auth/components/SocialLoginButtons.tsx`
- Test: `tests/unit/auth/login-page-entry.test.tsx`
- Test: `tests/unit/auth/providers.test.tsx`
- Test: `tests/e2e/preview-auth-home.spec.ts`

**Interfaces:**
- Consumes: 제공 이미지 `codex-clipboard-f88b3549-fe47-44fb-aa0a-9ed37500d2ee.png`, provider 활성 설정
- Produces: 데스크톱 이미지/폼 2열과 활성 OAuth만 표시하는 로그인 화면

- [ ] **Step 1: 실패 테스트 작성** — 이미지 대체텍스트, 0개 provider 시 영역 숨김, 일부 활성화 시 해당 버튼만 표시, 안내문 제거를 검증한다.
- [ ] **Step 2: RED 확인** — `npm test -- tests/unit/auth/login-page-entry.test.tsx tests/unit/auth/providers.test.tsx`가 현재 화면 때문에 실패해야 한다.
- [ ] **Step 3: 이미지 복사와 최소 UI 구현** — `next/image`로 크기를 예약하고 1024px 미만 폼 우선, 390px 이하 이미지 숨김을 적용한다.
- [ ] **Step 4: GREEN 확인** — unit 테스트와 320·390·768·1440px 브라우저 시나리오가 통과해야 한다.
- [ ] **Step 5: 커밋** — `feat(auth): simplify login workspace`

### Task 6: 환경·문서·전체 품질 게이트

**Files:**
- Modify: `.env.example`
- Modify: `docs/12-public-self-service-v1-spec.md`
- Modify: `docs/traceability/public-v1-auth.md`
- Modify: `docs/decisions/DEC-024-solapi-phone-verification-and-recovery.md`
- Create: `docs/worklogs/2026-10-14-auth-phone-verification-implementation.md`

**Interfaces:**
- Consumes: Tasks 1~5의 모든 사용자 흐름과 환경값
- Produces: 배포자가 따라 할 환경 체크, 추적표, 검수 증거와 롤백 기록

- [ ] **Step 1: 환경 검사 보강** — SOLAPI 키·발신번호·OTP HMAC secret이 server-only이고 production mock이 아닌지 검사한다.
- [ ] **Step 2: 전체 자동검증** — `npm test`, `npm run typecheck`, `npm run build`, `npm run test:coverage`, `npm run check:secrets`를 실행하고 네 지표 80% 이상을 확인한다.
- [ ] **Step 3: 실제 브라우저 검수** — 320·390·768·1440px, 200% 확대, 키보드, 실제 문자 수신·오답·재발송·만료·복구를 Preview에서 확인한다.
- [ ] **Step 4: 문서 동기화** — 기획·결정·추적·작업기록을 갱신하고 같은 구조로 바탕화면 문서 폴더에 복사한다.
- [ ] **Step 5: 독립 품질 검수** — 요구사항·권한·개인정보·접근성·회귀를 검토해 P0/P1 0건을 확인한다.
- [ ] **Step 6: 최종 커밋·푸시** — `docs(auth): record phone verification delivery evidence`; 관련 파일만 푸시하고 Vercel Preview를 확인한다.
- [ ] **Step 7: 사용자 승인 요청** — 변경 화면, 테스트·실문자 결과, GitHub·Preview 주소와 아직 하지 않은 Production 배포를 보고한다.

## 자체 검토 결과

- 설계서 AUTHUX-001~006은 각각 Task 1~6에 연결됐다.
- 아이디 경쟁, OTP 재사용, 계정 열거, 공급자 장애, 모바일 접근성의 위험을 소유 Task 테스트에 포함했다.
- SOLAPI는 전송만 맡고 계정·OTP 상태는 집신 서버가 맡도록 인터페이스를 분리했다.
- 구현은 기존 파일을 보존하는 additive migration과 최소 UI 변경으로 제한했다.
