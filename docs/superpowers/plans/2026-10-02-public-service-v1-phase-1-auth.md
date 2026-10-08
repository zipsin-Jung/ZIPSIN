# 공개형 서비스 V1 1단계 인증 기반 구현계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 랜딩페이지를 보존하면서 실제 서버 세션, 세 간편가입 진입, 휴대전화 인증 경계, 동의와 역할 선택을 구현한다.

**Architecture:** Next.js 정적 내보내기를 서버 런타임으로 전환하고 `@supabase/ssr` 쿠키 세션을 사용한다. Google·Kakao는 기본 OAuth, Naver는 Custom OAuth2 Provider를 사용하며 휴대전화 공급자는 인터페이스 뒤에 두어 확정 전 Preview 모의 인증만 허용한다.

**Tech Stack:** Next.js App Router, Supabase Auth/Postgres, Zod, Vitest, Testing Library, Playwright

**Spec:** `docs/12-public-self-service-v1-spec.md` (`PSV1-AUTH-001`, `PSV1-AUTH-002`, `PSV1-ROLE-001`)

## Global Constraints

- 가입 완료는 소셜 세션·전화 인증·필수 동의가 모두 있어야 한다.
- 같은 이메일만으로 소셜 계정을 자동 병합하지 않는다.
- 전화번호 원문과 인증번호를 로그·Git에 남기지 않는다.
- 역할 선택은 사무소·집·계약 접근 권한이 아니다.
- Production에서 모의 전화 인증을 실행할 수 없어야 한다.
- 기존 `/` 랜딩페이지를 보존한다.

## Review Focus

- OAuth `error`, 누락된 `code`, 변조된 `next` 값은 안전한 로그인 오류로 돌아간다.
- 인증번호 만료·횟수 제한·중복 제출에서 가입이 완료되지 않는다.
- 필수 동의를 해제하거나 문서 버전이 없으면 프로필이 활성화되지 않는다.
- 세션 만료 사용자가 `/home` 직접 URL로 들어오면 로그인으로 돌아간다.
- 보조원·임차인이 역할만 고른 뒤 타인의 데이터를 조회할 경로가 생기지 않는다.

---

### Task 1: 서버 런타임과 테스트 기반

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `tests/unit/smoke.test.ts`
- Create: `tests/e2e/landing.spec.ts`

**Interfaces:** Produces `npm run test`, `npm run test:coverage`, `npm run test:e2e`.

- [ ] 정적 export 제거 후 기존 랜딩 렌더링 smoke 테스트를 먼저 작성한다.
- [ ] `npm run test`를 실행해 설정 부재 실패를 확인한다.
- [ ] Vitest·Testing Library·Playwright·axe와 스크립트를 추가하고 smoke 테스트를 통과시킨다.
- [ ] `npm run typecheck && npm run test:coverage && npm run build`를 실행한다.
- [ ] `chore: add server test foundation`으로 커밋한다.

### Task 2: 환경변수와 Supabase 서버 세션

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`
- Create: `lib/env/server.ts`
- Create: `lib/env/public.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/proxy.ts`
- Create: `proxy.ts`
- Test: `tests/unit/env/server.test.ts`, `tests/unit/auth/redirect.test.ts`

**Interfaces:** Produces `createServerSupabaseClient()`, `createBrowserSupabaseClient()`, `sanitizeNextPath(value)`.

- [ ] 누락된 필수 환경값과 외부 URL `next` 거부 테스트를 작성하고 실패를 확인한다.
- [ ] 환경값 파서, 서버·브라우저 클라이언트와 세션 갱신 proxy를 최소 구현한다.
- [ ] 비밀값이 `NEXT_PUBLIC_` 또는 Git에 포함되지 않는지 검사한다.
- [ ] 단위 테스트·타입검사·빌드를 실행한다.
- [ ] `feat: add supabase server session`으로 커밋한다.

### Task 3: 계정·동의·역할 데이터와 RLS

**Files:**
- Create: `supabase/migrations/202610020001_auth_profile.sql`
- Create: `supabase/seed.sql`
- Create: `types/database.ts`
- Create: `features/auth/domain/profile.ts`
- Test: `tests/unit/auth/profile.test.ts`
- Create: `docs/technical/public-v1-data-access.md`

**Interfaces:** Produces `profiles`, `consent_acceptances`, `phone_verification_states`, `user_roles`와 `isOnboardingComplete(profile)`.

- [ ] 전화 인증·필수 동의·역할 중 하나가 없으면 온보딩 미완료인 도메인 테스트를 작성한다.
- [ ] 개인정보 등급, RLS 정책, 감사 대상과 삭제·롤백 SQL을 문서화한다.
- [ ] 사용자 본인만 프로필·동의·역할을 읽고 수정하도록 migration과 타입을 작성한다.
- [ ] 로컬 Supabase에서 migration·RLS 검증을 실행하고 결과를 기록한다.
- [ ] `feat: add account consent role schema`로 커밋한다.

### Task 4: 세 소셜 로그인 화면과 콜백

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/auth/callback/route.ts`
- Create: `features/auth/components/SocialLoginButtons.tsx`
- Create: `features/auth/actions/start-oauth.ts`
- Create: `features/auth/domain/providers.ts`
- Test: `tests/unit/auth/providers.test.ts`
- Test: `tests/integration/auth/callback.test.ts`

**Interfaces:** Produces `SUPPORTED_PROVIDERS`, `startOAuth(provider,next)`, OAuth callback route.

- [ ] 세 버튼·잘못된 provider·취소·누락 code·안전한 next의 테스트를 작성하고 실패를 확인한다.
- [ ] Google·Kakao·`custom:naver` 시작과 PKCE code 교환을 구현한다.
- [ ] 설정되지 않은 제공자는 `준비 중`으로 표시하고 가입 성공으로 처리하지 않는다.
- [ ] 키보드·포커스·오류 복구 통합 테스트를 통과시킨다.
- [ ] `feat: add social login entry`로 커밋한다.

### Task 5: 휴대전화 인증과 동의

**Files:**
- Create: `app/(auth)/signup/verify/page.tsx`
- Create: `app/api/phone/send/route.ts`
- Create: `app/api/phone/verify/route.ts`
- Create: `features/auth/phone/provider.ts`
- Create: `features/auth/phone/mock-provider.ts`
- Create: `features/auth/schemas/verification.ts`
- Create: `features/auth/actions/complete-signup.ts`
- Test: `tests/unit/auth/verification.test.ts`
- Test: `tests/integration/auth/complete-signup.test.ts`

**Interfaces:** Produces `PhoneVerificationProvider`, `sendCode(phone,userId)`, `verifyCode(challengeId,code,userId)`, `completeSignup(input)`.

- [ ] 전화 형식·만료·불일치·제한·중복·필수 동의 누락 테스트를 작성한다.
- [ ] 모의 공급자가 Production에서 시작되지 않는 테스트를 먼저 고정한다.
- [ ] 공급자 인터페이스, Preview 모의 구현, 인증·동의 완료 action을 구현한다.
- [ ] 오류 때 입력 유지와 전화번호 마스킹을 검증한다.
- [ ] `feat: add verified signup flow`로 커밋한다.

### Task 6: 역할 선택과 보호된 앱 셸

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/home/page.tsx`
- Create: `app/(app)/onboarding/role/page.tsx`
- Create: `features/auth/components/RolePicker.tsx`
- Create: `features/auth/actions/save-role.ts`
- Create: `features/auth/guards/require-onboarding.ts`
- Test: `tests/unit/auth/role.test.ts`
- Test: `tests/integration/auth/guards.test.ts`
- Test: `tests/e2e/signup-onboarding.spec.ts`

**Interfaces:** Produces `savePrimaryRole(role)`, `requireOnboardingComplete()`와 보호된 `(app)` 레이아웃.

- [ ] 유효하지 않은 역할·세션 없음·온보딩 미완료·완료 경로 테스트를 작성한다.
- [ ] 역할 설명, 저장 action, 서버 보호와 빈 홈을 구현한다.
- [ ] 역할 저장만으로 리소스 권한 레코드가 생성되지 않음을 검증한다.
- [ ] 320·390·1440px, 키보드, 새로고침 E2E를 실행한다.
- [ ] `feat: add role onboarding shell`로 커밋한다.

### Task 7: 1단계 추적·Preview 검수·롤백

**Files:**
- Create: `docs/traceability/public-v1-auth.md`
- Create: `docs/worklogs/YYYY-MM-DD-public-v1-auth.md`
- Modify: `README.md`
- Modify: `WORK_STATUS.md`

**Interfaces:** Produces 요구사항↔화면↔소스↔테스트↔증거 표.

- [ ] `npm run typecheck`, `npm run test:coverage`, `npm run build`를 각각 기록한다.
- [ ] Preview에서 세 제공자 상태·로그인 취소·세션 복구·역할 선택을 실제 브라우저로 검수한다.
- [ ] 커버리지 네 지표 80% 미만 또는 P0·P1 발생 시 수정 후 전부 재실행한다.
- [ ] 직전 안정 배포와 인증 진입 비활성화 절차를 기록한다.
- [ ] 독립 검수 결과와 사용자 승인 대기 상태를 문서화하고 커밋한다.
