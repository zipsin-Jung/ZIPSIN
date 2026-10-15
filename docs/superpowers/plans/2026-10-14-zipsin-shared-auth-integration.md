# ZIPSIN Shared Auth Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `zipsin.net` and `ck.zipsin.net` use the same ZIPSIN signup, login, Supabase user ID, and session while preserving anonymous check records and safe return.

**Architecture:** Use the primary ZIPSIN authenticated application as the integration base and merge the public `/ck` experience into it. Centralize auth start and callback on `zipsin.net`, share the production cookie across `.zipsin.net`, and return to an allowlisted check destination through a server-owned intent rather than a browser-supplied external URL.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth/Postgres/RLS/Storage, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-10-14-zipsin-shared-auth-integration-design.md`

## Global Constraints

- Preserve every existing anonymous check, memo, photo, comparison, and deletion behavior.
- Do not create a second member database, password system, OAuth callback, or signup UI.
- Do not commit provider secrets or real user data.
- Do not claim integration completion before real Preview provider and cross-domain session verification.
- Keep Production deployment and DNS changes behind final user approval.

## Review Focus

- Production site URL accidentally resolving to localhost must fail before deployment.
- External, encoded, or protocol-relative return destinations must be rejected.
- Existing users must not have roles overwritten by a check-origin login.
- A successful login must not delete local check records before server verification.
- Logout and token refresh must behave consistently across both hosts and concurrent tabs.

---

### Task 1: Establish the integration branch and preserve both products

**Files:** Git history and conflict resolutions only; no feature deletion.

- [ ] Create an isolated integration branch from the current primary ZIPSIN auth branch.
- [ ] Merge the approved ZIPSIN Check commits while preserving primary auth routes and `/ck` routes.
- [ ] Run the pre-change auth and check suites to identify integration-only failures.
- [ ] Commit the conflict resolution separately.

### Task 2: Pin the shared-auth contract with failing tests

**Files:** auth domain tests, callback tests, login entry tests, check navigation tests.

- [ ] Add failing tests for one shared login/signup UI, safe check return, same account source, no existing-role overwrite, and Production localhost rejection.
- [ ] Run focused tests and confirm each fails for the missing integration behavior.
- [ ] Add cross-host logout and callback replay cases.

### Task 3: Centralize login, signup, and callback

**Files:** `app/(auth)/**`, `features/auth/**`, `lib/supabase/**`, `proxy.ts`.

- [ ] Remove the duplicate check-only login implementation from the integrated tree.
- [ ] Route check login and signup entry to the primary ZIPSIN auth pages with a server-owned intent.
- [ ] Implement allowlisted return resolution and callback replay protection.
- [ ] Keep Google·Kakao visible only when configured; keep Naver hidden until verified.
- [ ] Run focused tests until green.

### Task 4: Share and validate the session across subdomains

**Files:** Supabase SSR cookie adapter, proxy/session tests, environment validation.

- [ ] Add failing tests for the Production `.zipsin.net` cookie attributes and Preview isolation.
- [ ] Implement shared Production cookie options without widening unrelated cookies.
- [ ] Reject Production localhost/loopback site and callback values.
- [ ] Verify protected server actions and APIs still validate the Supabase user and RLS independently.
- [ ] Run auth, environment, and authorization suites.

### Task 5: Preserve check state and attribution through authentication

**Files:** `/ck` entry components, resume store, onboarding/profile service and tests.

- [ ] Add failing tests for local record survival, exact candidate return, `signup_source=zipsin_check`, existing-role preservation, and no home/contract membership creation.
- [ ] Implement the minimal intent/resume metadata required for the round trip.
- [ ] Keep candidate transfer consent separate from general signup and marketing consent.
- [ ] Run check, onboarding, transfer, and RLS suites.

### Task 6: Configure Preview safely and perform real browser verification

**Files:** `.env.example`, environment checker, deployment runbook, no secrets.

- [ ] Document Vercel, Supabase, Google, and Kakao configuration without copying secrets.
- [ ] Connect the same Preview Supabase project and provider callbacks.
- [ ] Verify new/existing Google and Kakao users, cancel/error, `/ck` return, refresh, cross-host session, and logout in a real browser.
- [ ] Verify 320px, 390px, 768px, 1440px, keyboard, focus, and 200% zoom.

### Task 7: Complete quality gates and handoff

**Files:** traceability, quality report, worklog, status documents.

- [ ] Run full unit/integration/E2E, typecheck, build, secret scan, and four-metric coverage.
- [ ] Obtain independent quality review with P0/P1 at zero.
- [ ] Mirror changed documents to the desktop ZIPSIN document library.
- [ ] Commit and push the safe integration branch, then confirm the Vercel Preview.
- [ ] Request final user approval before Production DNS or deployment changes.
