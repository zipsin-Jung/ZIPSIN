# Mission 5 Repair Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persistent fictional repair-record CRUD and single-image flow for Mission 5.

**Architecture:** Next.js App Router Server Components and Server Actions call a server-only Supabase repository. Shared validation and form components keep create/update behavior consistent, while private Storage objects are displayed with signed URLs.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase JS, Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-10-08-mission5-repair-records-design.md`

## Global Constraints

- Preserve `/` and `/demo` behavior.
- Use only fictional, non-sensitive records; never commit secrets.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- One image: JPEG, PNG, or WebP, at most 5MB.
- Do not claim browser or deployed QA from build output.

## Review Focus

- Empty or malformed text/date input returns field-specific Korean errors.
- Wrong MIME type or image over 5MB never reaches Storage.
- Invalid, missing, or deleted IDs render the dedicated not-found state.
- Upload/insert and replacement/update partial failures clean up the new object.
- URL query parsing clamps bad pages and ignores unknown statuses safely.

---

### Task 1: Validation and query contract

**Files:** Create `lib/repairs/types.ts`, `lib/repairs/schema.ts`, `lib/repairs/schema.test.ts`.

**Interfaces:** Produce `validateRepairFormData`, `parseListParams`, enum labels, `RepairRecord`, and `RepairActionState`.

- [ ] Write tests for text bounds, enums, dates, file MIME/size, and URL params; run them and confirm feature-missing failures.
- [ ] Implement the smallest validation and parsing module; rerun the focused tests and full suite.

### Task 2: Supabase schema and repository

**Files:** Create `.env.example`, `supabase/migrations/20261008000000_create_repair_records.sql`, `lib/supabase/server.ts`, `lib/repairs/repository.ts`, and repository tests.

**Interfaces:** Produce list/get/create/update/delete record functions and private-image upload/remove/sign helpers.

- [ ] Write repository contract and cleanup tests with a fake adapter; confirm expected failures.
- [ ] Add Supabase dependency, migration, server client, and repository behavior; run focused and full tests.

### Task 3: Server actions and shared form

**Files:** Create `app/records/actions.ts`, `components/records/RepairForm.tsx`, `components/records/SubmitButton.tsx`, tests.

**Interfaces:** Produce `createRepair`, `updateRepair`, and `deleteRepair` actions with `RepairActionState`.

- [ ] Write tests for validation mapping, success results, and mutation failures; confirm failures.
- [ ] Implement actions and create/edit form states with pending submission and image preview; run tests.

### Task 4: Routes and reusable record UI

**Files:** Create records list/new/detail/edit/loading/error/not-found routes and record cards, filters, pagination, delete button.

**Interfaces:** Consume the repository and action contracts from Tasks 2-3.

- [ ] Write component behavior tests for empty/results/delete-confirmation states; confirm failures.
- [ ] Implement all routes and navigation, including a landing-page entry link; run full tests.

### Task 5: Documentation, QA, and release

**Files:** Modify `README.md`, `WORK_STATUS.md`, affected product docs; create QA checklist and worklog; mirror docs to the Desktop library.

- [ ] Run format/static review, typecheck, unit tests, coverage, production build, and dependency audit separately.
- [ ] Apply the Supabase migration and environment values where credentials are available.
- [ ] Run browser QA at 1440/390/320 and the complete deployed CRUD/upload cycle; record only observed results.
- [ ] Review the diff, commit the feature branch, push safely, and prepare/attach the Mission 5 PR if repository permissions allow.
