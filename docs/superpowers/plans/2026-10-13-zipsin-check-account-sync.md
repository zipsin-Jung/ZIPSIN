# ZIPSIN Check Account Sync Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Preserve the anonymous `/ck` field checklist while adding one ZIPSIN account, owner-private candidate transfer, cross-device recovery, retry, and deletion through a real Next.js App Router server runtime.

**Architecture:** Keep the existing local-first V2 as the source until a user explicitly transfers selected records. Add Supabase cookie auth, Postgres row-level security, private Storage, and idempotent transfer manifests behind server-only repositories. Client components may read localStorage/IndexedDB, but all ownership decisions come from the verified server session.

**Tech Stack:** Next.js 16.3.6 App Router, React 19, TypeScript 5.9, Supabase Auth/Postgres/Storage, `@supabase/ssr`, Zod, Vitest/Testing Library, Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-10-13-zipsin-check-account-sync-design.md`

## Global Constraints

- Work only in `codex/zipsin-check-comparison-v2`; preserve the anonymous V2 flow and existing local keys.
- Before editing each Next.js concern, read the matching guide under `node_modules/next/dist/docs/` and record the guide path in the worklog.
- Never accept `owner_user_id` from a browser request; derive it from the cookie session.
- Never commit Supabase keys, OAuth secrets, real contact details, addresses, or uploaded photos.
- Do not create `home`, `contract`, `membership`, office, or landlord relationships from signup source or user type.
- Keep server deletion and local deletion as separate, explicit actions.
- Production deploy, DNS, real provider activation, and destructive production migrations remain excluded until G6 approval.
- Every task follows red → green → focused regression → commit. Do not combine unrelated tasks in one commit.
- Product-code coverage must remain at least 80% for statements, branches, functions, and lines. Auth, ownership, idempotency, retry, and delete authorization scenarios must all pass.

## Review Focus

- Anonymous `/ck` continues without login or automatic signup modal.
- OAuth return paths cannot escape the application.
- Tenant acquisition classification never grants access to a resource.
- Transfer is explicit, previewed, idempotent, resumable, and does not delete local originals.
- RLS and private Storage deny cross-user reads, updates, deletes, and direct paths.
- Partial photo/database failures cannot be reported as total success.
- Empty, loading, error, expired-session, forbidden, partial-success, and retry states are distinguishable and accessible.

---

## Task 1: Establish the server-runtime and test foundation

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vitest.config.ts`
- Create: `.env.example`
- Create: `playwright.config.ts`
- Create: `lib/env/server.ts`
- Create: `lib/env/public.ts`
- Create: `lib/env/env.test.ts`
- Create: `tests/e2e/anonymous-ck.spec.ts`

**Interface:**

```ts
export type ServerEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  authTestMode: boolean;
};

export function readServerEnv(source?: NodeJS.ProcessEnv): ServerEnv;
export function readPublicEnv(source?: NodeJS.ProcessEnv): Pick<ServerEnv, 'supabaseUrl' | 'supabaseAnonKey'>;
```

- [ ] Read the Next.js 16 configuration, environment-variable, server/client component, and testing guides in `node_modules/next/dist/docs/`.
- [ ] Add dependencies `@supabase/ssr`, `@supabase/supabase-js`, and `zod`; add dev dependencies `@playwright/test` and `@axe-core/playwright`.
- [ ] Write `lib/env/env.test.ts` asserting missing required variables fail with variable names, optional service-role omission is allowed in browser-free paths, and `AUTH_TEST_MODE=true` is rejected when `NODE_ENV=production`.
- [ ] Run `npm test -- lib/env/env.test.ts` and confirm it fails because the parsers do not exist.
- [ ] Implement separate public/server parsers with no secret exported from `public.ts`.
- [ ] Remove `output: 'export'` from `next.config.ts` and retain image behavior needed by existing pages.
- [ ] Add Playwright config with local `next dev` web server, desktop Chromium, 390px mobile, screenshots on failure, and trace on first retry.
- [ ] Write `tests/e2e/anonymous-ck.spec.ts` asserting `/ck` starts without login, records a first candidate, and does not show an automatic signup dialog.
- [ ] Run `npm test -- lib/env/env.test.ts`, `npm run typecheck`, `npm run build`, and the anonymous Playwright test with non-secret local test values.
- [ ] Commit as `chore: prepare server runtime and account-sync tests`.

## Task 2: Add cookie sessions, safe returns, and provider availability

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/proxy.ts`
- Create: `proxy.ts`
- Create: `features/auth/domain/providers.ts`
- Create: `features/auth/domain/return-path.ts`
- Create: `features/auth/domain/auth.test.ts`
- Create: `features/auth/server/session.ts`
- Create: `features/auth/server/start-oauth.ts`

**Interface:**

```ts
export type AuthProvider = 'google' | 'kakao' | 'naver';
export type ProviderState = {provider: AuthProvider; available: boolean; reason?: 'not-configured'};
export function getSafeReturnPath(value: string | null, fallback?: string): string;
export function listProviderStates(env: ServerEnv): ProviderState[];
export async function requireUser(): Promise<{id: string; email?: string}>;
export async function startOAuth(provider: AuthProvider, returnTo: string): Promise<{redirectTo: string}>;
```

- [ ] Write tests for `/ck/transfer`, `/my/candidates`, query strings, external URLs, protocol-relative URLs, encoded external URLs, and unknown paths; only allowed internal paths may survive.
- [ ] Write tests proving Google/Kakao/Naver report `not-configured` when their explicit configuration is absent and test auth cannot start in production.
- [ ] Run `npm test -- features/auth/domain/auth.test.ts` and confirm failures.
- [ ] Implement browser/server Supabase factories using `@supabase/ssr`; keep cookie mutation inside server contexts.
- [ ] Implement `proxy.ts` only for session refresh and protected route redirection; exclude static assets and `/ck`.
- [ ] Implement `requireUser()` from `auth.getUser()` and return the same not-found-style authorization result for absent or invalid sessions.
- [ ] Implement safe OAuth startup with provider availability and server-generated callback URL; never accept an arbitrary callback origin.
- [ ] Run focused tests, typecheck, and existing `/ck` component tests.
- [ ] Commit as `feat: add secure zipsin account session foundation`.

## Task 3: Create schema, RLS, and private Storage policies

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/202610130001_zipsin_check_account_sync.sql`
- Create: `supabase/tests/zipsin_check_rls.sql`
- Create: `lib/supabase/database.types.ts`
- Create: `features/account/domain/profile.ts`
- Create: `features/account/domain/profile.test.ts`
- Create: `docs/technical/zipsin-check-data-model.md`

**Database contract:**

- `profiles`, `signup_attributions`, `candidate_drafts`, `candidate_answers`, `candidate_photos`, `transfer_manifests`, and `transfer_items` use UUID primary keys and UTC timestamps.
- Unique keys: `(owner_user_id, local_candidate_id)`, `(owner_user_id, request_key)`, `(candidate_id, item_id, storage_path)`.
- `candidate-photos` is private; object names are `{auth.uid()}/{candidateId}/{photoId}`.
- Deletes cascade only inside the selected candidate/manifest boundary.

- [ ] Write pgTAP/SQL tests that create two users and assert owner CRUD succeeds while cross-user select, update, delete, signed-path insertion, and direct Storage-path manipulation fail.
- [ ] Add a SQL assertion that saving `signup_source=zipsin_check` and `user_type=tenant` creates no row in any resource-membership table.
- [ ] Run the Supabase migration/test command when local Supabase is available; otherwise fail the gate clearly and keep the SQL test as pending evidence, never mark it passed.
- [ ] Implement schema, indexes, checks, foreign keys, RLS policies, private bucket, and Storage object policies.
- [ ] Generate/update `database.types.ts` from the applied local schema rather than hand-widening types.
- [ ] Implement and test profile domain validation: source and user type are separate, user choice is mutable, membership is outside the interface.
- [ ] Document data classification, ownership, cascade boundary, and rollback SQL in `docs/technical/zipsin-check-data-model.md`.
- [ ] Run SQL tests, focused unit tests, typecheck, and secret scan.
- [ ] Commit as `feat: add private candidate schema and ownership policies`.

## Task 4: Build login, callback, and tenant onboarding

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `app/onboarding/tenant/page.tsx`
- Create: `components/auth/LoginPanel.tsx`
- Create: `components/auth/LoginPanel.test.tsx`
- Create: `components/account/TenantOnboardingForm.tsx`
- Create: `components/account/TenantOnboardingForm.test.tsx`
- Create: `features/account/server/save-onboarding.ts`
- Create: `tests/e2e/auth-resume.spec.ts`

- [ ] Write component tests for available, unavailable, loading, cancel, provider-error, and existing-session states; unavailable providers must show `준비 중` and remain disabled.
- [ ] Write onboarding tests asserting the tenant suggestion is editable, required transfer consent is separate from optional marketing consent, and no membership request is made.
- [ ] Write callback tests for missing code, failed code exchange, expired session, and safe return restoration.
- [ ] Run focused tests and confirm failures.
- [ ] Implement the login page and accessible provider buttons with one primary action and visible `나중에`/return behavior.
- [ ] Implement PKCE callback code exchange, safe `returnTo`, and `/ck?auth=cancelled` recovery.
- [ ] Implement server onboarding save with `signup_source=zipsin_check`, confirmed `user_type`, and separate consent fields.
- [ ] Add Playwright test-adapter scenarios for successful session resume and cancel-to-`/ck`; block the adapter in production.
- [ ] Run focused tests, auth E2E, typecheck, and anonymous regression E2E.
- [ ] Commit as `feat: add zipsin login and tenant onboarding`.

## Task 5: Define the local transfer manifest and preview rules

**Files:**
- Create: `features/check-transfer/domain/types.ts`
- Create: `features/check-transfer/domain/schema.ts`
- Create: `features/check-transfer/domain/build-local-manifest.ts`
- Create: `features/check-transfer/domain/selection.ts`
- Create: `features/check-transfer/domain/transfer-domain.test.ts`
- Create: `features/check-transfer/client/local-source.ts`
- Create: `features/check-transfer/client/resume-store.ts`
- Modify: `lib/zipsin-check/photo-store.ts`
- Modify: `components/zipsin-check/ZipsinCheckApp.tsx`
- Modify: `components/zipsin-check/ZipsinCheckApp.test.tsx`

**Interface:**

```ts
export type LocalTransferManifest = {
  schemaVersion: 1;
  requestKey: string;
  createdAt: string;
  candidates: TransferCandidateInput[];
  expected: {candidates: number; answers: number; photos: number};
};

export async function buildLocalTransferManifest(input: {
  state: StoredCheckStateV2;
  candidateIds: string[];
  excludedPhotoIds: string[];
}): Promise<LocalTransferManifest>;
```

- [ ] Write tests for zero candidates, default current candidate, 1–3 candidates, archived/missing candidates, individual photo exclusion, stable retry request key, count calculation, oversize input, unsupported MIME, and sensitive memo/contact warnings.
- [ ] Run `npm test -- features/check-transfer/domain/transfer-domain.test.ts` and confirm failures.
- [ ] Implement strict Zod schemas with bounded strings, arrays, byte counts, MIME allowlist, and catalog item IDs.
- [ ] Implement read-only adapters for `zipsin-check:v2` and IndexedDB photos; do not mutate or delete local sources.
- [ ] Add `집신에 저장하기` to result/compare contexts without changing anonymous start behavior; persist only resume metadata needed after OAuth.
- [ ] Test that CTA absence from first load and local state survival across auth navigation remain true.
- [ ] Run focused tests, existing V2 suite, and anonymous E2E.
- [ ] Commit as `feat: prepare selected check records for account transfer`.

## Task 6: Build transfer preview and consent UI

**Files:**
- Create: `app/ck/transfer/page.tsx`
- Create: `components/check-transfer/TransferPreview.tsx`
- Create: `components/check-transfer/TransferPreview.test.tsx`
- Create: `components/check-transfer/PrivacyNotice.tsx`
- Create: `components/check-transfer/PhotoSelection.tsx`
- Create: `components/check-transfer/TransferConsent.tsx`
- Create: `tests/e2e/transfer-preview.spec.ts`

- [ ] Write tests for no local records, one default candidate, 2–3 candidates, field summaries, photo include/exclude, all candidates excluded, sensitive-information warning, unchecked consent, offline state, and expired session.
- [ ] Assert the page visibly states `현재는 나만 볼 수 있어요`, what transfers, what does not, and that marketing consent is not present in the transfer consent control.
- [ ] Run the component test and confirm failures.
- [ ] Implement compact mobile-first preview cards with candidate alias, location/terms/contact summary, five checks, memo count, photo count, and per-photo choice.
- [ ] Make the main action singular, preserve `나중에`, move focus to the first invalid field, and announce errors through `aria-live`.
- [ ] Redirect an unauthenticated submit to login while preserving the manifest request key; an authenticated user continues without rebuilding the selection.
- [ ] Run component tests and Playwright at 320px, 390px, and 1440px including keyboard flow.
- [ ] Commit as `feat: add candidate transfer preview and consent`.

## Task 7: Implement idempotent text transfer and server verification

**Files:**
- Create: `features/check-transfer/server/repository.ts`
- Create: `features/check-transfer/server/service.ts`
- Create: `features/check-transfer/server/service.test.ts`
- Create: `app/api/check-transfer/manifests/route.ts`
- Create: `app/api/check-transfer/manifests/[id]/candidates/route.ts`
- Create: `app/api/check-transfer/manifests/[id]/finalize/route.ts`
- Create: `features/check-transfer/server/http.test.ts`

**Interface:**

```ts
export type TransferResult = {
  manifestId: string;
  status: 'prepared' | 'transferring' | 'partial' | 'complete' | 'failed';
  expected: TransferCounts;
  confirmed: TransferCounts;
  failedItems: Array<{itemKey: string; code: string; retryable: boolean}>;
};

export async function createOrResumeManifest(userId: string, input: LocalTransferManifest): Promise<TransferResult>;
export async function upsertCandidateDraft(userId: string, manifestId: string, candidate: TransferCandidateInput): Promise<void>;
export async function finalizeTransfer(userId: string, manifestId: string): Promise<TransferResult>;
```

- [ ] Create repository fakes and write service tests for first transfer, duplicate request key, duplicate local candidate, other-owner manifest, invalid item ID, text failure before photos, count mismatch, retry after session expiry, and no membership/home/contract side effects.
- [ ] Write route tests proving a body-supplied owner ID is ignored, missing session is 401, other-owner IDs return the same 404-style response, and raw addresses/phones/memos are absent from logs.
- [ ] Run focused tests and confirm failures.
- [ ] Implement transactional manifest creation and candidate/answer upsert using session-derived user ID and unique constraints.
- [ ] Implement finalize from database-confirmed counts; it must not return `complete` on any mismatch or failed item.
- [ ] Return stable public error codes without payload contents.
- [ ] Run service/HTTP tests, typecheck, and ownership SQL tests.
- [ ] Commit as `feat: transfer candidate text with idempotent manifests`.

## Task 8: Add private photo upload, partial retry, and cleanup tracking

**Files:**
- Create: `features/check-transfer/server/photo-service.ts`
- Create: `features/check-transfer/server/photo-service.test.ts`
- Create: `app/api/check-transfer/manifests/[id]/photos/route.ts`
- Create: `app/api/check-transfer/manifests/[id]/retry/route.ts`
- Create: `features/check-transfer/client/uploader.ts`
- Create: `features/check-transfer/client/uploader.test.ts`
- Add migration: `supabase/migrations/202610130002_photo_cleanup_queue.sql`
- Modify: `lib/supabase/database.types.ts`

- [ ] Write tests for accepted MIME/size, spoofed MIME, oversize files, owner path, wrong candidate, duplicate upload, Storage failure, DB-link failure after Storage success, retry-failed-only, and already-successful photo skipping.
- [ ] Run focused tests and confirm failures.
- [ ] Add `photo_cleanup_queue` with owner/object/status metadata but no sensitive file content; apply owner/service policies.
- [ ] Implement server-side file validation, generated photo IDs, private path construction, Storage upload, DB linking, and cleanup enqueue on link failure.
- [ ] Implement the client uploader with bounded sequential uploads, per-item progress, abort support, and retry of only failed item keys.
- [ ] Re-run finalize tests to prove partial photos cannot produce complete status.
- [ ] Run photo tests, SQL policy tests, typecheck, and secret scan.
- [ ] Commit as `feat: add private photo transfer and targeted retry`.

## Task 9: Add progress, result, and resumable recovery screens

**Files:**
- Create: `app/ck/transfer/progress/page.tsx`
- Create: `app/ck/transfer/result/page.tsx`
- Create: `components/check-transfer/TransferProgress.tsx`
- Create: `components/check-transfer/TransferProgress.test.tsx`
- Create: `components/check-transfer/TransferResult.tsx`
- Create: `components/check-transfer/TransferResult.test.tsx`
- Create: `features/check-transfer/client/run-transfer.ts`
- Create: `features/check-transfer/client/run-transfer.test.ts`
- Create: `tests/e2e/transfer-recovery.spec.ts`

- [ ] Write state-machine tests for prepared → text → photos → verify → complete, double-submit, cancel, session expiry, text failure, partial photo failure, retry, page reload, and stale local resume data.
- [ ] Write result tests that distinguish complete/partial/failed, show expected/confirmed counts and failed items, preserve local records, and offer only valid next actions.
- [ ] Run focused tests and confirm failures.
- [ ] Implement the orchestrator as a resumable state machine keyed by server manifest ID and local request key.
- [ ] Implement progress text and `aria-live`; do not rely on color alone.
- [ ] Implement re-login continuation and reload recovery from server manifest plus minimal local resume metadata.
- [ ] Add Playwright coverage for interrupted transfer, reload, partial retry, and complete result with local record still visible.
- [ ] Run focused tests, recovery E2E, and anonymous regression E2E.
- [ ] Commit as `feat: add resumable transfer progress and results`.

## Task 10: Build owner-only candidate list, detail, signed photos, and delete

**Files:**
- Create: `features/candidates/server/repository.ts`
- Create: `features/candidates/server/service.ts`
- Create: `features/candidates/server/service.test.ts`
- Create: `app/my/candidates/page.tsx`
- Create: `app/my/candidates/[id]/page.tsx`
- Create: `components/candidates/CandidateList.tsx`
- Create: `components/candidates/CandidateList.test.tsx`
- Create: `components/candidates/CandidateDetail.tsx`
- Create: `components/candidates/CandidateDetail.test.tsx`
- Create: `app/api/candidates/[id]/photo-urls/route.ts`
- Create: `app/api/candidates/[id]/route.ts`
- Create: `tests/e2e/candidate-recovery-delete.spec.ts`

**Interface:**

```ts
export async function listCandidateDrafts(userId: string): Promise<CandidateDraftSummary[]>;
export async function getCandidateDraft(userId: string, id: string): Promise<CandidateDraftDetail | null>;
export async function createCandidatePhotoUrls(userId: string, id: string): Promise<SignedPhoto[]>;
export async function deleteCandidateDraft(userId: string, id: string): Promise<DeleteCandidateResult>;
```

- [ ] Write repository/service tests for empty list, ordered list, detail, short-lived signed URLs, missing candidate, cross-user read/delete, database delete failure, Storage delete partial failure, and retry response.
- [ ] Write component tests separating empty, load error, session expired, forbidden/not-found, detail, deleting, partial delete, and deleted states.
- [ ] Run focused tests and confirm failures.
- [ ] Implement owner-filtered list/detail and server-issued signed URLs with short expiry; never store a public photo URL.
- [ ] Implement candidate deletion with explicit confirmation and a structured result describing remaining DB/Storage scope.
- [ ] Add a separate `현재 브라우저 기록 삭제` action that calls existing local deletion only after its own confirmation.
- [ ] Show `이 집으로 결정` as a disabled/future explanation; do not create long-term home or contract records.
- [ ] Add cross-browser recovery and delete E2E using two isolated browser contexts.
- [ ] Run focused tests, E2E, ownership SQL tests, and regression suite.
- [ ] Commit as `feat: add private candidate recovery and deletion`.

## Task 11: Complete traceability, automation, accessibility, and pre-deploy evidence

**Files:**
- Modify: `vitest.config.ts`
- Modify: `package.json`
- Create: `scripts/check-secrets.mjs`
- Create: `scripts/check-account-sync-env.mjs`
- Create: `.github/workflows/check-account-sync.yml`
- Create: `docs/testing/zipsin-check-account-sync-test-plan.md`
- Create: `docs/testing/zipsin-check-account-sync-traceability.md`
- Create: `docs/testing/zipsin-check-account-sync-results.md`
- Create: `docs/deployment/zipsin-check-preview-runbook.md`
- Create: `docs/deployment/zipsin-check-rollback.md`
- Modify: `README.md`

- [ ] Expand Vitest coverage include paths to every new product module and keep all four thresholds at 80%.
- [ ] Map ZCA-001~009 and ZCA-T001~056 to exact source files, test files, and last command evidence.
- [ ] Add CI jobs for install, typecheck, unit/integration coverage, build, secret scan, SQL policy tests, and Playwright; a skipped unavailable dependency must fail the pre-deploy gate or be explicitly recorded as blocked.
- [ ] Add environment checks that list names only, never secret values, and fail production when test auth is enabled or provider/callback settings are inconsistent.
- [ ] Write Preview runbook with Supabase project setup, migration order, redirect allowlist, private bucket check, non-production provider state, seedless smoke test, and rollback steps.
- [ ] Run `npm ci`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, secret scan, SQL tests, and full Playwright suite.
- [ ] Record separate outcomes for build, automated browser tests, and manual browser inspection; never call build success browser success.
- [ ] Manually inspect Chromium at 320px, 390px, 1440px, keyboard-only, screen-reader landmarks/live regions, 200% zoom, slow network, and console/hydration errors.
- [ ] Obtain independent quality review against the approved spec; fix and re-run until P0/P1 are zero or stop with a documented blocker.
- [ ] Commit as `test: complete zipsin check account-sync quality gate`.

## Task 12: Synchronize records and request G6 approval

**Files:**
- Modify: `WORK_STATUS.md`
- Modify: `CONTINUE.md`
- Modify: `docs/README.md`
- Modify: `docs/conversations/2026-10-13-zipsin-check-idea.md`
- Create: `docs/worklogs/2026-10-13-zipsin-check-account-sync-implementation.md`
- Create: `docs/quality/zipsin-check-account-sync-final-review.md`

- [ ] Confirm `git diff` contains no secrets, personal contact data, generated uploads, or unrelated user changes.
- [ ] Record implemented scope, commits, migrations, coverage for all four metrics, browser evidence, known limits, rollback, and remaining production-only actions.
- [ ] Copy changed documentation to `/Users/zipsin/Desktop/코덱스랑/집신/` with the same relative paths.
- [ ] Push the feature branch safely and verify the remote commit.
- [ ] Present the user with the Preview-ready result and explicitly state that Production, DNS, and live OAuth are still unchanged.
- [ ] Request G6 user approval. Do not deploy, merge, alter DNS, or activate live providers before that approval.

## Requirement-to-Task Coverage

| Requirement | Implementation tasks | Primary verification |
|---|---|---|
| ZCA-001 Anonymous continuity | 1, 5, 6, 9 | T001~004, anonymous and recovery E2E |
| ZCA-002 One ZIPSIN account | 2, 4, 9 | T005~010, callback and session-resume tests |
| ZCA-003 Tenant acquisition attribution | 3, 4 | T011~014, profile and no-membership SQL tests |
| ZCA-004 Preview and consent | 5, 6 | T015~020, preview component/E2E tests |
| ZCA-005 Safe idempotent transfer | 3, 7, 8 | T021~030, service/HTTP/unique-key tests |
| ZCA-006 Verification and cross-device recovery | 7, 9, 10 | T037~040, finalize and two-context E2E |
| ZCA-007 Cancel, failure, and retry | 2, 4, 8, 9 | T005~010 and T021~030, recovery E2E |
| ZCA-008 Candidate/history separation | 3, 4, 10 | T011~014 and T031~036, no-side-effect tests |
| ZCA-009 Server/local deletion | 3, 10 | T041~046, owner and partial-delete tests |

## Plan Self-Review

- Every approved requirement ZCA-001~009 has at least one implementation task and one explicit test group.
- Anonymous use remains the baseline; login is user-triggered and cancellable.
- Account classification, candidate ownership, and resource membership are separate in code, schema, and tests.
- Server session, RLS, and private Storage provide three ownership checks; no browser-provided owner ID is trusted.
- Idempotency, partial failure, cleanup, retry, cross-device recovery, and dual deletion are designed before UI success states.
- The plan contains no production credentials, DNS mutation, live deployment, unfinished implementation marker, or unresolved product choice.
- Completion requires actual automated and manual browser evidence, not only a successful build.
