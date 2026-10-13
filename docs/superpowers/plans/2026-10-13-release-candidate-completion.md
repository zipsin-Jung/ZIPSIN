# 집신 배포 직전 완성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 집신 프로젝트를 보존하면서 공개 홈페이지부터 가입·집·기록·첨부·채팅·초대·권한 종료가 실제 Preview에서 이어지는 Release Candidate를 만든다.

**Architecture:** 기존 App Router·Supabase·서버 액션·RLS 구조를 유지한다. 공개 홈은 클라이언트 사례 선택기와 서버 렌더링 가능한 제품 UI 예시로 분리하고, 실제 앱 기능은 기존 도메인·RPC를 보완해 사용한다. 새 기능보다 누락 상태와 Preview 실제 왕복 증거를 완성한다.

**Tech Stack:** Next.js 16.3.6 App Router, React 19.2.6, TypeScript 5.9, Tailwind CSS 4, Supabase, Vitest, Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-10-13-release-candidate-completion-design.md`

## Global Constraints

- 새 프로젝트를 만들지 않고 `codex/public-v1-auth`의 코드·문서·Git 기록을 보존한다.
- 판단 기준은 `집에 관한 일의 반복·누락·단절 방지`다.
- 수리·공인중개사·자산관리 중 하나로 제품을 한정하지 않는다.
- 주소나 내부 집 ID만으로 비공개 기록을 열지 않는다.
- 이전 계약자의 개인정보를 다음 계약자에게 자동으로 넘기지 않는다.
- 별도 담당자 배정을 공식 흐름과 접근 조건으로 사용하지 않는다.
- 실제 앱스토어 URL, 검증된 성과 수치와 작동하지 않는 기능을 표시하지 않는다.
- 제품 코드는 실패 테스트를 먼저 확인한 뒤 최소 구현한다.
- Production은 사용자 승인 전 변경하지 않는다.
- Next.js 코드를 수정하기 전에 설치된 버전의 `node_modules/next/dist/docs/` 관련 문서를 읽는다.

## Review Focus

1. 터치 드래그·키보드 탐색·긴 한글 문구에서도 사례 카드와 선택 패널이 가로로 넘치지 않아야 한다. Task 1의 `TEST-RC-PUB-004`와 Task 5 반응형 E2E가 고정한다.
2. 활성 사무소가 없는 임대인·임차인·중개보조원이 첫 로그인에서 권한 오류만 보고 막히지 않고 초대 수락 또는 다음 행동을 이해해야 한다. Task 2의 `TEST-RC-HOME-003`이 고정한다.
3. 관계 종료 직전에 열어 둔 탭과 파일 URL도 새 요청에서는 거부되어야 한다. Task 4의 `TEST-RC-ACL-004`와 Preview 다계정 시나리오가 고정한다.
4. 중복 클릭·네트워크 재시도·부분 업로드 실패가 집·기록·메시지를 중복 생성하거나 성공으로 위장하지 않아야 한다. Task 3의 `TEST-RC-IDEM-001`과 기존 스트레스 테스트가 고정한다.
5. OAuth·문자·Storage 같은 외부 설정이 없으면 준비되지 않은 기능을 활성 기능처럼 보이지 않고 안전한 복구 안내를 보여야 한다. Task 2의 `TEST-RC-AUTH-006`과 Task 5 Preview 검수가 고정한다.

---

### Task 1: 공개 홈페이지 생활 사례와 실제 제품 UI

**Files:**
- Create: `features/public-home/scenarios.ts`
- Create: `features/public-home/components/ScenarioExplorer.tsx`
- Create: `features/public-home/components/ProductEvidence.tsx`
- Modify: `components/PublicHome.tsx`
- Modify: `components/PublicHome.module.css`
- Test: `tests/unit/navigation/public-home.test.tsx`
- Test: `tests/e2e/landing.spec.ts`

**Interfaces:**
- Produces: `publicHomeScenarios: PublicHomeScenario[]`, `ScenarioExplorer`, `ProductEvidence`
- `PublicHomeScenario` fields: `id`, `eyebrow`, `title`, `question`, `result`, `prevents`, `evidenceType`
- `ScenarioExplorer` keeps selected scenario ID in client state and exposes tabs with roving keyboard focus.

- [ ] **Step 1: Write failing homepage unit tests**

Add `TEST-RC-PUB-001` for exact headline/supporting copy and required navigation, `TEST-RC-PUB-002` for six exact scenarios, `TEST-RC-PUB-003` for `/login`, `/signup`, `/support` destinations, and `TEST-RC-PUB-004` for accessible tab selection and corresponding evidence content.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- tests/unit/navigation/public-home.test.tsx`

Expected: failure because the required copy, menu, six scenario tabs and evidence panel do not exist.

- [ ] **Step 3: Implement the scenario data and components**

Use real HTML/CSS/React. The evidence panels represent timeline, document list, before/after comparison, contract summary, office continuity and move-out flow. Do not add stock people, fake metrics, QR codes, store badges or phone mockup decoration.

- [ ] **Step 4: Implement the compact public home structure**

Order: header → one-screen definition/evidence → horizontal scenarios → `집 등록→기록→대화` use method → permission principle → customer support/start CTA. Preserve authenticated `/` redirect behavior in `app/page.tsx`.

- [ ] **Step 5: Run focused unit and landing E2E tests**

Run: `npm test -- tests/unit/navigation/public-home.test.tsx && npx playwright test tests/e2e/landing.spec.ts --project=chromium`

Expected: all tests pass with no console or hydration error assertion.

- [ ] **Step 6: Commit Task 1**

Run: `git add features/public-home components/PublicHome.tsx components/PublicHome.module.css tests/unit/navigation/public-home.test.tsx tests/e2e/landing.spec.ts && git commit -m "feat: center public home on real-life record moments"`

### Task 2: 가입 이후 첫 행동과 역할별 복구 경로

**Files:**
- Modify: `features/workspace/components/HomeStart.tsx`
- Modify: `app/(app)/home/page.tsx`
- Modify: `app/(app)/homes/new/page.tsx`
- Modify: `app/(app)/invitations/[token]/page.tsx`
- Modify: `features/auth/components/SocialLoginButtons.tsx`
- Test: `tests/unit/workspace/home-start.test.tsx`
- Test: `tests/unit/homes/home-pages.test.tsx`
- Test: `tests/unit/auth/providers.test.tsx`
- Test: `tests/e2e/signup-onboarding.spec.ts`

**Interfaces:**
- Consumes: existing `HomeStart` props, `primaryRole`, active office memberships and pending invitation routes.
- Produces: role-specific next action without granting resource access from primary role alone.

- [ ] **Step 1: Write failing role and unavailable-provider tests**

Add `TEST-RC-HOME-001` principal broker office/home start, `TEST-RC-HOME-002` active office member recent homes, `TEST-RC-HOME-003` landlord/tenant/assistant no-membership invitation guidance, `TEST-RC-HOME-004` permission-denied and retry copy, and `TEST-RC-AUTH-006` disabled provider non-actionable state.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- tests/unit/workspace/home-start.test.tsx tests/unit/homes/home-pages.test.tsx tests/unit/auth/providers.test.tsx`

Expected: the no-membership and recovery assertions fail before implementation.

- [ ] **Step 3: Implement the smallest role-aware next-action states**

Keep principal-only office creation/home registration policy. For other roles, explain that a role is not access, show accepted invitation entry, and never reveal whether an address already has records.

- [ ] **Step 4: Verify focused and onboarding flow tests**

Run: `npm test -- tests/unit/workspace/home-start.test.tsx tests/unit/homes/home-pages.test.tsx tests/unit/auth/providers.test.tsx && npx playwright test tests/e2e/signup-onboarding.spec.ts --project=chromium`

Expected: role paths pass; unavailable external providers cannot be triggered.

- [ ] **Step 5: Commit Task 2**

Run: `git add features/workspace app/'(app)' features/auth/components/SocialLoginButtons.tsx tests/unit tests/e2e/signup-onboarding.spec.ts && git commit -m "fix: guide each role into a valid first action"`

### Task 3: 집·기록·첨부의 완전한 첫 작업 흐름

**Files:**
- Modify: `app/(app)/homes/[homeId]/page.tsx`
- Modify: `features/records/components/RecordForm.tsx`
- Modify: `features/attachments/components/AttachmentUploader.tsx`
- Modify only if tests expose a gap: `features/homes/actions/create-home.ts`, `features/records/actions/create-record.ts`, `features/attachments/actions/upload.ts`
- Test: `tests/unit/homes/home-pages.test.tsx`
- Test: `tests/unit/records/record-form.test.tsx`
- Test: `tests/unit/attachments/attachment-uploader.test.tsx`
- Test: `tests/e2e/launch-happy-path.spec.ts`
- Test: `tests/stress/idempotent-record-write.test.ts`

**Interfaces:**
- Consumes: existing home/record/attachment server actions and RPCs.
- Produces: `집 등록 → 첫 기록 → 첨부 → 타임라인` with explicit empty/loading/success/error/denied/partial-failure states.

- [ ] **Step 1: Write failing UI and idempotency tests**

Add `TEST-RC-REC-001` first record CTA, `TEST-RC-REC-002` preserved form after failure, `TEST-RC-FILE-001` per-file result and retry, `TEST-RC-IDEM-001` 20 identical record retries create one logical record.

- [ ] **Step 2: Verify RED with focused tests**

Run: `npm test -- tests/unit/records/record-form.test.tsx tests/unit/attachments/attachment-uploader.test.tsx tests/stress/idempotent-record-write.test.ts`

Expected: new state and stress tests fail for missing behavior or fixtures.

- [ ] **Step 3: Implement only exposed gaps**

Reuse existing RPC authorization and private buckets. Do not change access policy to make E2E easier. Preserve successful files when another upload fails and keep retry input.

- [ ] **Step 4: Verify the first-record flow**

Run: `npm test -- tests/unit/homes tests/unit/records tests/unit/attachments tests/integration/homes tests/integration/records tests/integration/attachments tests/stress/idempotent-record-write.test.ts && npx playwright test tests/e2e/launch-happy-path.spec.ts --project=chromium`

Expected: focused suites and local flow pass, or tests requiring real Preview are tagged and deferred with exact reason.

- [ ] **Step 5: Commit Task 3**

Run: `git add app/'(app)'/homes features/records features/attachments tests && git commit -m "fix: complete the first home record workflow"`

### Task 4: 채팅·초대·권한 종료의 출시 경계

**Files:**
- Modify only where tests expose gaps: `features/chat/**`, `features/relationships/**`, `features/invitations/**`
- Modify only where tests expose gaps: `app/(app)/chats/**`, `app/(app)/homes/[homeId]/people/page.tsx`
- Create: `tests/integration/relationships/revocation-boundary.test.ts`
- Modify: `tests/e2e/launch-permissions.spec.ts`
- Modify: `tests/e2e/chat-realtime.spec.ts`
- Modify: `tests/e2e/office-home-access.spec.ts`

**Interfaces:**
- Consumes: existing six room types, office and relationship invitation RPCs, relationship ending RPC, signed attachment URL routes.
- Produces: verified current-relationship access on each read/write/file request and actionable ended/denied UI.

- [ ] **Step 1: Write failing cross-boundary tests**

Add `TEST-RC-ACL-001` address/guessed ID denial, `TEST-RC-ACL-002` previous-contract PII isolation, `TEST-RC-ACL-003` departed staff denial with office records retained, `TEST-RC-ACL-004` already-open page/file/chat denial after termination, and `TEST-RC-INV-001` expired/reused/mixed-scope invitation denial.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- tests/integration/relationships/revocation-boundary.test.ts tests/integration/chat tests/integration/db`

Expected: any missing current-request authorization or fixture fails for the intended boundary.

- [ ] **Step 3: Implement the smallest server/RLS/UI corrections**

Use forward-only migrations only if the existing schema cannot satisfy a failing security test. Never rely on hidden buttons. Preserve records while ending human access.

- [ ] **Step 4: Verify permission and chat flows**

Run: `npm test -- tests/integration/relationships tests/integration/chat tests/integration/db tests/unit/chat tests/unit/relationships && npx playwright test tests/e2e/launch-permissions.spec.ts tests/e2e/chat-realtime.spec.ts tests/e2e/office-home-access.spec.ts --project=chromium`

Expected: all locally executable tests pass; real Preview-only assertions remain clearly tagged until Task 6.

- [ ] **Step 5: Commit Task 4**

Run: `git add features/chat features/relationships features/invitations app/'(app)' tests supabase/migrations && git commit -m "fix: close invitation and relationship access boundaries"`

### Task 5: 로컬 품질 게이트와 네 해상도 브라우저 검수

**Files:**
- Modify: `vitest.config.ts`
- Modify: `playwright.config.ts`
- Create: `tests/e2e/release-responsive-accessibility.spec.ts`
- Create: `docs/traceability/release-candidate-v1.md`
- Create: `docs/quality/release-candidate-local-report.md`

**Interfaces:**
- Produces: `REQ/AC → FLOW/SCREEN/STATE → source symbol → TEST-ID → command/result → coverage` mapping and local browser evidence.

- [ ] **Step 1: Restore dependencies without changing declared versions**

Run: `npm ci`

Expected: install exactly `package-lock.json`; no package manifest diff.

- [ ] **Step 2: Read installed Next.js guidance before final framework edits**

Read the App Router routing, server/client components, forms/server actions, authentication and production guidance under `node_modules/next/dist/docs/` that exists in Next.js 16.3.6.

- [ ] **Step 3: Expand the declared coverage scope**

Add the release-critical public-home, homes, records, attachments, invitations, relationships, chat, navigation and workspace product code to `coverage.include`. Keep statements, branches, functions and lines thresholds at 80 each.

- [ ] **Step 4: Write the responsive/accessibility E2E test**

At 320, 390, 768 and 1440px verify no document overflow, usable scenario carousel, visible focus, keyboard navigation, 44px primary touch targets, no page/console/hydration error and basic axe violations absent.

- [ ] **Step 5: Run static, unit, integration, stress, coverage and build separately**

Run in order:

```text
npm run typecheck
npm test
npm run test:coverage
npm run build
PLAYWRIGHT_PORT=3021 npm run test:e2e
```

Expected: all commands pass; coverage report lists lines/statements/functions/branches individually at or above 80 for the declared scope.

- [ ] **Step 6: Record local traceability and browser evidence**

Record exact commit, environment, commands, counts, coverage, viewport screenshots/trace locations, skipped tests and residual risks. Do not describe build as browser validation.

- [ ] **Step 7: Commit Task 5**

Run: `git add vitest.config.ts playwright.config.ts tests/e2e docs/traceability docs/quality && git commit -m "test: enforce release candidate quality gates"`

### Task 6: Preview migration·실제 왕복·문서·배포

**Files:**
- Create: `docs/quality/release-candidate-preview-report.md`
- Create: `docs/worklogs/2026-10-13-release-candidate-completion.md`
- Create: `docs/status-images/2026-10-13-release-candidate-summary.svg`
- Modify: `WORK_STATUS.md`
- Modify: affected product, decision and traceability documents

**Interfaces:**
- Consumes: green local revision, Supabase Preview project, Vercel Preview environment and GitHub branch.
- Produces: verified Preview URL and one-page completion image; Production remains unchanged.

- [ ] **Step 1: Audit remote prerequisites read-only**

Compare local migrations with Preview migration history, verify required environment variable names without printing values, confirm Storage buckets/policies and identify enabled OAuth/phone providers.

- [ ] **Step 2: Back up and apply forward-only Preview changes**

Create a recoverable Preview database backup where the platform permits, record row counts for affected tables, then apply only missing migrations to Preview. Never apply to Production.

- [ ] **Step 3: Deploy the reviewed Git revision to Vercel Preview**

Push the tested commits to `codex/public-v1-auth`, wait for Ready, and record the immutable Preview URL and Git SHA.

- [ ] **Step 4: Execute actual Preview scenarios**

Use synthetic accounts to verify signup/login/onboarding, office/home, first record, photo/PDF, timeline, chat, office/landlord/tenant invitation, expired/reused invitation, relationship termination, prior-contract isolation, support and recovery. Clean up or clearly label synthetic data without deleting audit history required by the product.

- [ ] **Step 5: Verify four viewports, accessibility and console on Preview**

Repeat 320, 390, 768 and 1440px checks on the Preview URL. Capture failures, console/network evidence and verify no horizontal overflow or hydration errors.

- [ ] **Step 6: Correct defects test-first and rerun the whole gate**

For every P0/P1 defect, add a failing reproduction, implement the minimum fix, rerun focused and full local suites, redeploy Preview, and retest. Do not accept P0/P1 residuals.

- [ ] **Step 7: Independent quality review**

Apply `zipsin-quality-gate` to traceability, role/relationship/period permissions, previous-tenant privacy, responsive/accessibility evidence, coverage and Preview scenarios. Final status remains `verified, awaiting approval`.

- [ ] **Step 8: Update and synchronize documents**

Update product/feature/workflow/decision/conversation/worklog/quality/traceability files, then copy the same structure to `/Users/zipsin/Desktop/코덱스랑/집신/`.

- [ ] **Step 9: Commit and safely push documentation**

Run secret and PII scans, inspect the final diff and commits, commit evidence without credentials/test personal data, and push to GitHub.

- [ ] **Step 10: Submit the required final report**

Report only: actually usable functions, unavailable functions, test results, Preview URL and Production approval items. Attach the one-page completion image. Do not deploy Production.

## Self-review result

- All `RC-*` requirements in the approved spec map to at least one task.
- Public home, auth recovery, first record, permission termination, four viewports, coverage and Preview evidence each have an explicit test or verification step.
- Existing features are reused; no new payment, PDF, OCR, AI or app-store work was added.
- The plan intentionally keeps real external provider setup as a visible Preview prerequisite instead of faking completion.
