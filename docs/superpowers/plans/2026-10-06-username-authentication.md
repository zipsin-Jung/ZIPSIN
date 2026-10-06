# 아이디 인증·회원가입 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google·카카오·네이버 간편 로그인과 아이디·비밀번호 로그인을 함께 제공하고, 아이디·비밀번호·이메일로 시작해 기존 전화 인증·동의·역할 선택으로 이어지는 실제 회원가입 흐름을 만든다.

**Architecture:** Supabase Auth가 비밀번호·이메일 확인·세션을 담당하고, 직접 조회가 차단된 `account_usernames`가 정규화한 아이디를 Auth 사용자에 연결한다. 아이디→이메일 해석과 관리자 API는 서버 전용 서비스에서만 수행하며, 로그인 오류는 계정 존재 여부와 무관하게 동일하게 응답한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth/Postgres/RLS, Zod, Vitest, Testing Library, Playwright, axe

**Spec:** `docs/plans/2026-10-06-username-auth-kickoff.md`

## Global Constraints

- 로그인 화면에 이메일 입력란이나 `이메일로 회원가입` 문구를 두지 않는다.
- 회원가입 보조 버튼 문구는 정확히 `회원가입`이다.
- 아이디는 4~20자의 영문 소문자·숫자·밑줄이며 대소문자를 동일하게 취급하고 초기 버전에서는 변경하지 않는다.
- 비밀번호 원문은 앱 DB, 로그, 분석 도구, Git에 저장하지 않는다.
- 같은 이메일만으로 소셜 계정과 일반 계정을 자동 병합하지 않는다.
- 모바일에서는 인증 행동을 먼저 보여 주고 320·390·1440px에서 가로 넘침이 없어야 한다.
- 아이디 로그인은 기능 플래그로 끌 수 있고, 중단해도 소셜 로그인은 유지한다.
- Production 공개와 운영 데이터 변경은 사용자 별도 승인 없이는 수행하지 않는다.

## Review Focus

- 동일 아이디 동시 가입: DB 고유 제약으로 정확히 한 요청만 성공해야 한다(Task 1 통합 테스트).
- 존재하지 않는 아이디·틀린 비밀번호·비활성 계정: 외부 오류 문구와 상태가 같아야 한다(Task 3 단위 테스트).
- Auth 생성 뒤 아이디 예약 실패: 재시도 가능한 pending 상태가 남고 다른 사용자에게 활성 아이디가 할당되지 않아야 한다(Task 2 통합 테스트).
- 변조된 `next`와 OAuth 취소: 외부 주소로 이동하지 않고 로그인 화면에서 복구해야 한다(Task 4 통합/E2E 테스트).
- 비밀번호 표시·오류·제출 중 상태: 키보드와 화면읽기에서 이름·포커스·상태가 명확해야 한다(Task 4 컴포넌트/E2E 테스트).

---

### Task 1: 아이디 정책과 비공개 매핑 저장소

**Files:**
- Create: `features/auth/domain/username.ts`
- Create: `supabase/migrations/202610060001_account_usernames.sql`
- Create: `tests/unit/auth/username.test.ts`
- Create: `tests/integration/auth/username-migration-security.test.ts`
- Modify: `types/database.ts`

**Interfaces:**
- Produces: `normalizeUsername(value: string): string`, `usernameSchema`, 비공개 `account_usernames(user_id, username_normalized, status, created_at, activated_at)`와 `claim_username(p_username text)` RPC

- [ ] **Step 1: 아이디 정규화 실패 테스트 작성** — 대문자·앞뒤 공백 정규화, 4~20자, 영문·숫자·밑줄, 예약어 거부를 검증한다.
- [ ] **Step 2: 테스트가 `username.ts` 부재로 실패하는지 실행** — `npm test -- tests/unit/auth/username.test.ts`
- [ ] **Step 3: `normalizeUsername`과 `usernameSchema` 최소 구현**
- [ ] **Step 4: 단위 테스트 통과 확인** — 같은 명령에서 PASS
- [ ] **Step 5: RLS·권한·고유 제약·원자 예약 실패 테스트 작성** — anon/authenticated 직접 조회·쓰기 거부와 동시 동일 아이디 1건 성공을 고정한다.
- [ ] **Step 6: 통합 테스트 실패 확인** — `npm test -- tests/integration/auth/username-migration-security.test.ts`
- [ ] **Step 7: additive migration과 생성 타입 구현** — 기존 테이블은 삭제·변경하지 않는다.
- [ ] **Step 8: 단위·통합 테스트 통과 및 커밋** — `git commit -m "feat: add private username registry"`

### Task 2: 아이디 회원가입과 부분 실패 복구

**Files:**
- Create: `app/(auth)/signup/page.tsx`
- Create: `features/auth/schemas/password-signup.ts`
- Create: `features/auth/services/register-password-account.ts`
- Create: `features/auth/actions/register-password-account.ts`
- Create: `features/auth/components/PasswordSignupForm.tsx`
- Create: `tests/unit/auth/password-signup.test.ts`
- Create: `tests/integration/auth/register-password-account.test.ts`
- Modify: `app/(auth)/signup/verify/page.tsx`

**Interfaces:**
- Consumes: `normalizeUsername`, `usernameSchema`, Supabase admin/server clients
- Produces: `passwordSignupSchema`, `registerPasswordAccount(input): Promise<RegisterResult>`, `registerPasswordAccountAction(previousState, formData)`

- [ ] **Step 1: 가입 스키마 실패 테스트 작성** — 아이디, 8~128자 비밀번호, 비밀번호 확인, 이메일, 필수 동의만 허용한다.
- [ ] **Step 2: 스키마 테스트의 예상 실패 확인** — `npm test -- tests/unit/auth/password-signup.test.ts`
- [ ] **Step 3: 가입 스키마 최소 구현 후 단위 테스트 통과**
- [ ] **Step 4: 서비스 실패 테스트 작성** — 중복 아이디, 이메일 중복, Auth 생성 실패, 아이디 예약 실패·재시도, 비밀번호 비기록을 검증한다.
- [ ] **Step 5: 서비스 테스트 실패 확인** — `npm test -- tests/integration/auth/register-password-account.test.ts`
- [ ] **Step 6: 관리자 Auth 생성과 pending→active 아이디 예약 서비스 구현** — 원문 비밀번호와 이메일을 로그에 남기지 않는다.
- [ ] **Step 7: 가입 폼과 서버 액션 구현** — 이메일 목적 설명, 제출 중, 필드 오류, 공통 서비스 오류를 제공한다.
- [ ] **Step 8: 이메일 확인 뒤 기존 전화 인증·이름·동의 화면으로 연결**
- [ ] **Step 9: 관련 테스트·타입 검사 통과 및 커밋** — `git commit -m "feat: add username account registration"`

### Task 3: 서버 전용 아이디 로그인

**Files:**
- Create: `features/auth/services/login-with-username.ts`
- Create: `features/auth/actions/login-with-username.ts`
- Create: `features/auth/components/UsernameLoginForm.tsx`
- Create: `tests/unit/auth/username-login-action.test.ts`
- Create: `tests/integration/auth/login-with-username.test.ts`
- Delete after replacement: `features/auth/actions/start-email-login.ts`
- Delete after replacement: `features/auth/components/EmailLoginForm.tsx`
- Delete after replacement: `tests/unit/auth/email-login-action.test.ts`
- Delete after replacement: `tests/unit/auth/email-login.test.tsx`

**Interfaces:**
- Consumes: `normalizeUsername`, `createAdminSupabaseClient`, `createServerSupabaseClient`, `sanitizeNextPath`
- Produces: `loginWithUsername(credentials): Promise<{ ok: true } | { ok: false; error: 'invalid_credentials' | 'rate_limited' | 'service_unavailable' }>`

- [ ] **Step 1: 공통 오류·정규화·안전한 복귀 경로 액션 테스트 작성**
- [ ] **Step 2: 액션 테스트 예상 실패 확인** — `npm test -- tests/unit/auth/username-login-action.test.ts`
- [ ] **Step 3: 계정 상태별 동일 외부 오류와 이메일 비노출 통합 테스트 작성**
- [ ] **Step 4: 통합 테스트 예상 실패 확인** — `npm test -- tests/integration/auth/login-with-username.test.ts`
- [ ] **Step 5: `server-only` 아이디 조회→Auth 이메일 조회→`signInWithPassword` 서비스 구현**
- [ ] **Step 6: DB 기반 원자 속도 제한과 `PASSWORD_LOGIN_ENABLED` 실패 폐쇄 구현**
- [ ] **Step 7: 서버 액션과 아이디 로그인 폼 구현 후 이메일 로그인 파일 제거**
- [ ] **Step 8: 관련 테스트·타입 검사 통과 및 커밋** — `git commit -m "feat: add secure username login"`

### Task 4: 승인 시안 로그인 화면과 소셜 로그인 복구

**Files:**
- Modify: `app/(auth)/login/page.tsx`
- Modify: `features/auth/components/SocialLoginButtons.tsx`
- Modify: `features/auth/actions/start-oauth.ts`
- Modify: `app/(auth)/auth/callback/route.ts`
- Modify: `tests/unit/auth/providers.test.tsx`
- Modify: `tests/unit/auth/start-oauth.test.ts`
- Modify: `tests/integration/auth/callback.test.ts`
- Modify: `tests/e2e/signup-onboarding.spec.ts`

**Interfaces:**
- Consumes: `UsernameLoginForm`, 기존 OAuth 제공자 도메인과 `sanitizeNextPath`
- Produces: 320·390·1440px 반응형 `/login`과 제공자별 안전한 시작·취소·오류·성공 복귀

- [ ] **Step 1: 승인 문구와 인터랙션 컴포넌트 테스트 작성** — 소셜 3종, 아이디·비밀번호, `로그인`, 정확히 `회원가입`, 이메일 입력 부재를 단언한다.
- [ ] **Step 2: 테스트가 현재 이메일 화면에서 실패하는지 확인**
- [ ] **Step 3: 승인 시안을 실제 HTML/CSS와 기존 Brand/Mascot으로 구현** — 왼쪽에 계약·입주, 수리·사진, 일정·비용 가치를 표시한다.
- [ ] **Step 4: 모바일 인증 우선 순서, 44px 터치 영역, 영구 라벨, 비밀번호 보기 상태 구현**
- [ ] **Step 5: OAuth 제공자별 기능 플래그와 오류 복귀 회귀 테스트 통과**
- [ ] **Step 6: Playwright 반응형·키보드·axe 테스트 추가 및 통과** — `npm run test:e2e`
- [ ] **Step 7: 커밋** — `git commit -m "feat: build approved authentication experience"`

### Task 5: 아이디 찾기와 비밀번호 재설정

**Files:**
- Create: `app/(auth)/account-recovery/page.tsx`
- Create: `app/(auth)/reset-password/page.tsx`
- Create: `features/auth/actions/request-account-recovery.ts`
- Create: `features/auth/actions/update-password.ts`
- Create: `features/auth/components/AccountRecoveryForm.tsx`
- Create: `tests/integration/auth/account-recovery.test.ts`
- Modify: `app/(auth)/login/page.tsx`

**Interfaces:**
- Produces: `requestAccountRecovery(email): Promise<{ ok: true }>`의 항상 동일한 외부 응답과 1회성 Supabase 비밀번호 재설정 흐름

- [ ] **Step 1: 존재·미존재·소셜 전용 계정에 동일 응답을 요구하는 실패 테스트 작성**
- [ ] **Step 2: 테스트 예상 실패 확인** — `npm test -- tests/integration/auth/account-recovery.test.ts`
- [ ] **Step 3: 속도 제한된 복구 요청과 마스킹된 안내 구현**
- [ ] **Step 4: 만료·재사용·변조 링크를 거부하는 비밀번호 변경 흐름 구현**
- [ ] **Step 5: 로그인 화면의 `아이디·비밀번호를 잊으셨나요?`를 복구 화면에 연결**
- [ ] **Step 6: 관련 테스트 통과 및 커밋** — `git commit -m "feat: add private account recovery"`

### Task 6: 추적성·전체 품질 게이트·Preview 검수

**Files:**
- Modify: `vitest.config.mts`
- Modify: `docs/12-public-self-service-v1-spec.md`
- Modify: `docs/traceability/public-v1-auth.md`
- Create: `docs/decisions/DEC-012-username-and-social-auth.md`
- Modify: `docs/decisions/README.md`
- Create: `docs/worklogs/2026-10-06-username-authentication.md`
- Create: `docs/conversations/2026-10-06-authentication-design.md`
- Modify: `WORK_STATUS.md`

**Interfaces:**
- Consumes: Tasks 1~5의 요구사항·코드·테스트 증거
- Produces: 요구사항↔화면↔코드↔테스트 추적표와 사용자 승인 대기 보고

- [ ] **Step 1: 신규 인증 코드 전체를 커버리지 대상에 포함**
- [ ] **Step 2: 정적·단위·통합 검증** — `npm run typecheck && npm test && npm run test:coverage`; 네 지표 모두 80% 이상
- [ ] **Step 3: 빌드 검증** — `npm run build`; 브라우저 성공으로 표현하지 않는다.
- [ ] **Step 4: 실제 Preview에서 가입·로그인·소셜 취소·세션·로그아웃·복구·보호 경로 검수**
- [ ] **Step 5: 320·390·1440px 스크린샷과 키보드·axe·오류 복구 증거 저장**
- [ ] **Step 6: 개인정보·비밀값 Git/번들/로그 검사와 `git diff --check` 실행**
- [ ] **Step 7: PRD·결정·추적표·대화·작업기록·WORK_STATUS 갱신 및 바탕화면 동일 구조 복사**
- [ ] **Step 8: 독립 품질 검수에서 P0/P1 0건 확인**
- [ ] **Step 9: 변경 검토 후 Git 커밋·안전한 원격 푸시**
- [ ] **Step 10: Preview 결과를 보고하고 Production 공개 사용자 승인을 요청**

## Self-review 결과

- Spec coverage: 로그인, 가입, OAuth, 전화 인증·동의·역할, 복구, 보안, 접근성, 롤백을 Tasks 1~6에 연결했다.
- Type consistency: 아이디 정규화와 로그인·가입 서비스 인터페이스를 한 이름으로 고정했다.
- Review Focus: 동시성, 계정 열거, 부분 실패, 복귀 경로, 접근성을 담당 테스트에 배치했다.
- Scope: 운영 결제·실제 계약 접수·아이디 변경·Production 공개는 제외했다.
