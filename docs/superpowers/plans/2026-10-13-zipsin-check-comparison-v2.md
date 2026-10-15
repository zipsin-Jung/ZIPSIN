# Zipsin Check Comparison V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사회초년생이 여러 집을 빠르게 기록하고 그중 2~3채의 가격·생활조건·현장 5개·담당자를 같은 행에서 비교할 수 있는 로컬 우선 집신체크 V2를 만든다.

**Architecture:** 기존 Next.js App Router 정적 앱을 유지하되 텍스트 저장을 `zipsin-check:v2`로 분리하고 v1을 비파괴 변환한다. 등록·현장체크·후보선택·비교 계산을 작은 순수 모듈과 컴포넌트로 분리하며, 사진은 후보 ID를 유지한 기존 IndexedDB를 계속 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, localStorage, IndexedDB, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-10-13-zipsin-check-comparison-design.md`

## Global Constraints

- 집은 최소 10채 보관하고 `compareCandidateIds`로 2~3채만 비교한다.
- 별명 미입력 시 `오늘 본 집 N`으로 즉시 시작하며 상세 정보는 모두 선택 입력이다.
- 현장 기본 항목은 물·배수, 곰팡이·누수, 채광·소음, 창문·문, 옵션·파손의 정확히 5개다.
- 상세 행동 체크는 `직접 해봄`, 큰 항목 상태는 `괜찮음 / 다시 확인 / 미확인`으로 의미를 섞지 않는다.
- 주소·연락처·사진은 가입 전 현재 브라우저에만 저장하며 URL·로그·Git에 넣지 않는다.
- v1 원본은 자동 삭제·덮어쓰기하지 않고 후보 ID를 보존한다.
- 총점·순위·안전 판정, 실제 로그인·서버 이전·운영 배포는 구현하지 않는다.
- 측정 대상 제품 코드의 lines/statements/functions/branches를 각각 80% 이상 유지한다.

## Review Focus

- 손상되거나 부분적인 v1/v2 값: 빈 상태로 덮어쓰지 않고 v1 원본과 현재 화면을 보존하는 테스트를 Task 1에 둔다.
- 0원과 미입력·음수·과대 금액: 서로 다른 표시와 저장 차단을 Task 2와 Task 5에서 검증한다.
- 후보 4채 이상과 중복·없는 비교 ID: 기록을 삭제하지 않고 선택 목록만 정규화하는 테스트를 Task 2에 둔다.
- 위험 전화번호·`javascript:`/`data:` 링크: 실행하지 않고 수정 안내를 내는 테스트를 Task 6에 둔다.
- 후보 영구 삭제 중 사진 제거 실패: 텍스트를 성공처럼 숨기지 않고 부분 실패와 재시도를 안내하는 테스트를 Task 2와 Task 7에 둔다.

---

## File Map

- `lib/zipsin-check/types.ts`: V2 도메인 타입과 저장 스키마
- `lib/zipsin-check/storage.ts`: v1 읽기, v2 검증·저장, 비파괴 마이그레이션
- `lib/zipsin-check/catalog.ts`: 현장 5개와 상세 행동 원본
- `lib/zipsin-check/state.ts`: 후보 생성·수정·선택·비교 계산 순수 함수
- `lib/zipsin-check/contact.ts`: 전화번호 정규화와 안전한 매물 URL 검증
- `lib/zipsin-check/photo-store.ts`: 후보별 사진 일괄 제거
- `components/zipsin-check/CandidateForm.tsx`: 간단·상세 등록과 수정
- `components/zipsin-check/MemoPhotoSheet.tsx`: 메모와 사진을 함께 다루는 시트
- `components/zipsin-check/ComparePicker.tsx`: 여러 후보 중 2~3채 선택
- `components/zipsin-check/CheckStart.tsx`: 후보 목록과 새 집 등록 진입
- `components/zipsin-check/CheckFlow.tsx`: 현장 5개와 선택 상세 행동
- `components/zipsin-check/CheckCompare.tsx`: 고정 행 동일 기준 비교표
- `components/zipsin-check/ZipsinCheckApp.tsx`: V2 화면 전환·저장·삭제 조정
- `components/zipsin-check/ZipsinCheck.module.css`: 모바일 고정 열·헤더와 컴팩트 UI

### Task 1: V2 타입과 비파괴 마이그레이션

**Files:**
- Modify: `lib/zipsin-check/types.ts`
- Modify: `lib/zipsin-check/storage.ts`
- Modify: `lib/zipsin-check/storage.test.ts`

**Interfaces:**
- Produces: `StoredCheckStateV2`, `CandidateV2`, `loadCheckStateV2(storage)`, `saveCheckStateV2(state, storage)`, `migrateV1ToV2(v1)`
- Preserves: v1 `candidate.id`, `answers`, `createdAt`, `updatedAt`, IndexedDB photo linkage

- [ ] **Step 1: Write failing migration tests**

Add tests named `v1 후보 ID와 답을 보존해 v2로 옮긴다`, `선택 필드가 없는 v1을 반복 변환해도 같다`, `손상 v2가 있어도 v1 원본을 덮어쓰지 않는다`, `v2 저장 실패를 성공으로 보고하지 않는다`. Assert `schemaVersion === 2`, preserved IDs/answers, `intakeMode === 'simple'`, and untouched `zipsin-check:v1` raw text.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- --run lib/zipsin-check/storage.test.ts`

Expected: FAIL because V2 types and functions do not exist.

- [ ] **Step 3: Define exact V2 types**

In `types.ts`, add `IntakeMode = 'simple' | 'detailed'`, `ListingInfo`, `RentalTerms`, `ContactInfo`, `CommuteInfo`, `CandidateV2`, and `StoredCheckStateV2`. `StoredCheckStateV2` has `schemaVersion: 2`, `candidates`, `compareCandidateIds`, and optional `activeCandidateId`; monetary fields are `number | undefined` in won.

- [ ] **Step 4: Implement V2 validation and migration**

Use storage key `zipsin-check:v2`. Load valid v2 first; otherwise read but never mutate v1, transform candidate IDs and answers unchanged, normalize compare IDs to unique active candidates, then persist v2 only if serialization succeeds. Return explicit `source: 'v2' | 'migrated-v1' | 'empty'` or `reason` for recovery UI.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run lib/zipsin-check/storage.test.ts`

Expected: all storage tests PASS.

- [ ] **Step 6: Commit the migration unit**

```bash
git add lib/zipsin-check/types.ts lib/zipsin-check/storage.ts lib/zipsin-check/storage.test.ts
git commit -m "feat: add non-destructive zipsin check v2 migration"
```

### Task 2: 후보 생성·비교 선택·영구 삭제 상태

**Files:**
- Modify: `lib/zipsin-check/state.ts`
- Modify: `lib/zipsin-check/state.test.ts`
- Modify: `lib/zipsin-check/photo-store.ts`
- Modify: `lib/zipsin-check/photo-store.test.ts`

**Interfaces:**
- Consumes: `CandidateV2`, `StoredCheckStateV2` from Task 1
- Produces: `createCandidateV2(input)`, `updateCandidateDetails(candidate, details, now)`, `toggleComparison(ids, candidateId)`, `removeCandidate(state, candidateId)`, `PhotoStore.removeCandidate(candidateId)`

- [ ] **Step 1: Write failing candidate lifecycle tests**

Cover automatic `오늘 본 집 N`, trimmed alias, at least 10 active candidates, comparison selection order, duplicate/missing/archived ID removal, fourth selection rejection without record deletion, and comparison deselection preserving answers/photos.

- [ ] **Step 2: Write failing deletion tests**

Assert `removeCandidate` removes the candidate ID from candidates, active ID, and compare IDs. Extend the fake IndexedDB test to prove `removeCandidate` deletes every photo for exactly that candidate and leaves other candidates untouched; add an abort/failure case.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run lib/zipsin-check/state.test.ts lib/zipsin-check/photo-store.test.ts`

Expected: FAIL on missing V2 lifecycle functions.

- [ ] **Step 4: Implement pure lifecycle functions and photo bulk removal**

`toggleComparison` returns a discriminated result `{ok:true; ids:string[]} | {ok:false; reason:'max-three'}`. `PhotoStore.removeCandidate` uses one readwrite transaction and resolves only after commit.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run lib/zipsin-check/state.test.ts lib/zipsin-check/photo-store.test.ts`

Expected: all lifecycle and photo tests PASS.

- [ ] **Step 6: Commit the lifecycle unit**

```bash
git add lib/zipsin-check/state.ts lib/zipsin-check/state.test.ts lib/zipsin-check/photo-store.ts lib/zipsin-check/photo-store.test.ts
git commit -m "feat: separate saved homes from comparison selection"
```

### Task 3: 간단·상세 등록과 정보 수정

**Files:**
- Create: `components/zipsin-check/CandidateForm.tsx`
- Create: `components/zipsin-check/CandidateForm.test.tsx`
- Modify: `components/zipsin-check/CheckStart.tsx`
- Modify: `components/zipsin-check/ZipsinCheckApp.tsx`
- Modify: `components/zipsin-check/ZipsinCheckApp.test.tsx`

**Interfaces:**
- Consumes: `createCandidateV2`, `updateCandidateDetails`, V2 storage from Tasks 1–2
- Produces: `CandidateDraft`, `CandidateForm({mode, initial, onSubmit, onCancel})`

- [ ] **Step 1: Write failing registration tests**

Test default `간단하게`, no-input automatic alias, discovery values `당근/네이버부동산/직방/다방/부동산/지인/기타`, detailed optional fields, invalid negative/over-limit money, canceled edit preserving the candidate, and a simple candidate later enriched without losing answers.

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm test -- --run components/zipsin-check/CandidateForm.test.tsx components/zipsin-check/ZipsinCheckApp.test.tsx`

Expected: FAIL because the form and V2 app flow do not exist.

- [ ] **Step 3: Implement the compact form**

Keep one primary action. Simple mode shows alias and discovery source; detailed mode adds location, transaction type, deposit, rent, maintenance fee, commute minutes, move-in date, contact name, phone, and listing URL. Display a nearby notice that address and contact remain on this browser.

- [ ] **Step 4: Wire create and edit screens into the app**

Expand `Screen` with `new` and `edit`. Remove the active-candidate count limit; preserve instant start through the automatic alias path. Saving returns to check for new candidates and to the previous summary/compare context after edit.

- [ ] **Step 5: Run component tests and verify GREEN**

Run: `npm test -- --run components/zipsin-check/CandidateForm.test.tsx components/zipsin-check/ZipsinCheckApp.test.tsx`

Expected: registration and edit tests PASS.

- [ ] **Step 6: Commit the registration unit**

```bash
git add components/zipsin-check/CandidateForm.tsx components/zipsin-check/CandidateForm.test.tsx components/zipsin-check/CheckStart.tsx components/zipsin-check/ZipsinCheckApp.tsx components/zipsin-check/ZipsinCheckApp.test.tsx
git commit -m "feat: add simple and detailed home registration"
```

### Task 4: 현장 필수 5개와 메모 안 사진

**Files:**
- Modify: `lib/zipsin-check/catalog.ts`
- Modify: `lib/zipsin-check/catalog.test.ts`
- Modify: `lib/zipsin-check/types.ts`
- Modify: `lib/zipsin-check/state.ts`
- Modify: `components/zipsin-check/CheckFlow.tsx`
- Modify: `components/zipsin-check/CheckFlow.test.tsx`
- Create: `components/zipsin-check/MemoPhotoSheet.tsx`
- Create: `components/zipsin-check/MemoPhotoSheet.test.tsx`

**Interfaces:**
- Produces: `FIELD_ITEM_IDS` containing exactly five stable IDs, `FieldAction`, optional `CheckAnswer.actionChecks`, `MemoPhotoSheet`
- Reuses: `PhotoField` inside the memo surface

- [ ] **Step 1: Write failing catalog and semantics tests**

Assert exactly `water-drain`, `moisture-leak`, `light-noise`, `windows-doors`, `options-damage`; each has 1–3 action statements. Test that checking a detailed action does not automatically set the parent result to confirmed.

- [ ] **Step 2: Write failing interaction tests**

Assert five compact rows, square controls for `괜찮음/다시 확인`, default `미확인`, no photo control before memo opens, photo control inside the named memo sheet, memo/photo persistence, and independent detail-action checkboxes.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run lib/zipsin-check/catalog.test.ts components/zipsin-check/CheckFlow.test.tsx components/zipsin-check/MemoPhotoSheet.test.tsx`

Expected: FAIL on old 9-item rows and always-visible photo fields.

- [ ] **Step 4: Implement the five-item catalog and memo surface**

Preserve old item answers for migration/history but render only the five V2 field items by default. The memo surface owns the 120-character note and existing photo operations; closing without save leaves prior values unchanged.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run lib/zipsin-check/catalog.test.ts components/zipsin-check/CheckFlow.test.tsx components/zipsin-check/MemoPhotoSheet.test.tsx`

Expected: all field-flow tests PASS.

- [ ] **Step 6: Commit the field-check unit**

```bash
git add lib/zipsin-check/catalog.ts lib/zipsin-check/catalog.test.ts lib/zipsin-check/types.ts lib/zipsin-check/state.ts components/zipsin-check/CheckFlow.tsx components/zipsin-check/CheckFlow.test.tsx components/zipsin-check/MemoPhotoSheet.tsx components/zipsin-check/MemoPhotoSheet.test.tsx
git commit -m "feat: reduce field checks to five essential rows"
```

### Task 5: 동일 행 비교 계산

**Files:**
- Modify: `lib/zipsin-check/state.ts`
- Modify: `lib/zipsin-check/state.test.ts`
- Create: `lib/zipsin-check/format.ts`
- Create: `lib/zipsin-check/format.test.ts`

**Interfaces:**
- Produces: `buildHomeComparison(candidates, compareCandidateIds): HomeComparisonRow[]`, `formatWon`, `formatRentalPrice`, `monthlyHousingCost`
- Row keys: `cover`, `location`, `price`, `maintenance`, `monthly-total`, `commute`, `move-in`, `discovery`, five field IDs, `follow-up-count`, `photo-count`, `contact`, `listing`

- [ ] **Step 1: Write failing format tests**

Assert `undefined → 미입력`, actual `0 → 0원`, won-to-만원 formatting, negative/unsafe integers rejected before persistence, and monthly total only when both rent and maintenance are present.

- [ ] **Step 2: Write failing comparison tests**

Cover 2/3 selected candidates, selection order, missing/archived/duplicate IDs, different intake/check depth, memo summary, `미입력` versus `미확인`, and no total score or ranking field.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run lib/zipsin-check/format.test.ts lib/zipsin-check/state.test.ts`

Expected: FAIL because formatters and comparison view model do not exist.

- [ ] **Step 4: Implement pure formatters and comparison ViewModel**

Keep calculation out of components. Return presentation-ready text/status plus candidate IDs, never persist derived score or rank.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run lib/zipsin-check/format.test.ts lib/zipsin-check/state.test.ts`

Expected: all comparison calculation tests PASS.

- [ ] **Step 6: Commit the comparison-model unit**

```bash
git add lib/zipsin-check/state.ts lib/zipsin-check/state.test.ts lib/zipsin-check/format.ts lib/zipsin-check/format.test.ts
git commit -m "feat: build aligned home comparison rows"
```

### Task 6: 후보 선택·모바일 비교표·안전한 재연락

**Files:**
- Create: `lib/zipsin-check/contact.ts`
- Create: `lib/zipsin-check/contact.test.ts`
- Create: `components/zipsin-check/ComparePicker.tsx`
- Create: `components/zipsin-check/ComparePicker.test.tsx`
- Modify: `components/zipsin-check/CheckCompare.tsx`
- Modify: `components/zipsin-check/CheckCompare.test.tsx`
- Modify: `components/zipsin-check/ZipsinCheckApp.tsx`
- Modify: `components/zipsin-check/ZipsinCheck.module.css`

**Interfaces:**
- Consumes: comparison selection and ViewModel from Tasks 2 and 5
- Produces: `normalizePhone(value): string | undefined`, `safeListingUrl(value): URL | undefined`, `ComparePicker`, accessible comparison table

- [ ] **Step 1: Write failing security and picker tests**

Test Korean mobile/hyphen/space normalization, invalid phone disabling, `http/https` acceptance, `javascript:/data:` rejection, unique house-labelled selection controls, 1-house disabled state, and fourth-selection guidance.

- [ ] **Step 2: Write failing comparison component tests**

Assert actual table semantics, row and column headers, selected order, exact `미입력/미확인/다시 확인` labels, unique `집명 전화하기/매물 보기/수정` names, masked default phone display, and no score/rank text.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run lib/zipsin-check/contact.test.ts components/zipsin-check/ComparePicker.test.tsx components/zipsin-check/CheckCompare.test.tsx`

Expected: FAIL on missing picker/security functions and old comparison cards.

- [ ] **Step 4: Implement picker and secure actions**

Use semantic buttons/checkboxes; `tel:` and external navigation are created only from validated values after explicit click. Do not record call or link history.

- [ ] **Step 5: Implement compact sticky comparison table**

Use the first column as sticky row headers and the top row as sticky house headers; candidate columns scroll horizontally. Keep touch actions 44px while using 13–15px table typography and no oversized cards.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- --run lib/zipsin-check/contact.test.ts components/zipsin-check/ComparePicker.test.tsx components/zipsin-check/CheckCompare.test.tsx`

Expected: security, picker, accessibility, and comparison tests PASS.

- [ ] **Step 7: Commit the comparison UI unit**

```bash
git add lib/zipsin-check/contact.ts lib/zipsin-check/contact.test.ts components/zipsin-check/ComparePicker.tsx components/zipsin-check/ComparePicker.test.tsx components/zipsin-check/CheckCompare.tsx components/zipsin-check/CheckCompare.test.tsx components/zipsin-check/ZipsinCheckApp.tsx components/zipsin-check/ZipsinCheck.module.css
git commit -m "feat: add mobile home comparison table"
```

### Task 7: 영구 삭제 조정·전체 회귀·브라우저 검수·문서화

**Files:**
- Modify: `components/zipsin-check/ZipsinCheckApp.tsx`
- Modify: `components/zipsin-check/ZipsinCheckApp.test.tsx`
- Modify: `vitest.config.mjs`
- Modify: `docs/19-zipsin-check-v1-product-spec.md`
- Modify: `docs/21-zipsin-check-v1-technical-spec.md`
- Modify: `docs/decisions/DEC-019-zipsin-check-comparison-first-v2.md`
- Create: `docs/worklogs/2026-10-13-zipsin-check-comparison-implementation.md`
- Modify: `WORK_STATUS.md`

**Interfaces:**
- Consumes: all Tasks 1–6
- Produces: user-visible partial-deletion recovery, final trace table, independent QA handoff

- [ ] **Step 1: Write failing deletion orchestration tests**

Test confirmation copy naming the house and text/photos, cancel preserving all data, full success, photo removal failure retaining a visible retry state, and comparison IDs cleaned only when deletion is confirmed. Also assert `집신에 저장하기` is opt-in only, canceled/failed navigation leaves local V2 data intact, and no address/contact/photo upload request occurs in this local-only build.

- [ ] **Step 2: Run deletion integration tests and verify RED**

Run: `npm test -- --run components/zipsin-check/ZipsinCheckApp.test.tsx`

Expected: FAIL because the async deletion coordinator and recovery state do not exist.

- [ ] **Step 3: Implement deletion coordination and recovery**

Inject `PhotoStore` into the app for testing. Do not claim full deletion until IndexedDB commit succeeds; if text/photo operations diverge, identify what remains and provide retry without recreating deleted data.

- [ ] **Step 4: Run the full automated gate**

Run sequentially:

```bash
npm run test:coverage
npm run typecheck
npm run build
git diff --check
```

Expected: all tests PASS; statements, branches, functions, and lines each ≥80%; typecheck/build/diff check PASS. Record build separately from browser results.

- [ ] **Step 5: Perform actual browser scenarios**

At `/ck`, verify 320px, 390px, desktop, and 200% zoom for: empty start; simple/detail registration; five field checks; memo/photo; four or more saved homes; 2/3-house selection; horizontal table and sticky headers; edit return; safe phone/link controls; reload recovery; deletion success and simulated photo failure; no console errors.

- [ ] **Step 6: Perform real-device handoff**

Mark iPhone Safari and Android Chrome camera/touch/scroll checks as required user-device evidence. Do not claim them from desktop emulation.

- [ ] **Step 7: Update traceability and work records**

Map every ZCC/AC to FLOW/SCREEN/STATE, source symbol, exact test name, automated result, browser evidence, and remaining real-device limitation. Update the decision status only after independent QA.

- [ ] **Step 8: Request independent quality review**

Hand the final revision to a reviewer who did not implement it. Required result: P0/P1 zero and explicit PASS; otherwise return findings to the owning task and re-run the affected and full gates.

- [ ] **Step 9: Sync documents and commit**

```bash
git add WORK_STATUS.md vitest.config.mjs docs/19-zipsin-check-v1-product-spec.md docs/21-zipsin-check-v1-technical-spec.md docs/decisions/DEC-019-zipsin-check-comparison-first-v2.md docs/worklogs/2026-10-13-zipsin-check-comparison-implementation.md components/zipsin-check/ZipsinCheckApp.tsx components/zipsin-check/ZipsinCheckApp.test.tsx
git commit -m "test: verify zipsin check comparison v2"
git push origin codex/product-documentation
```

Copy every updated document to `/Users/zipsin/Desktop/코덱스랑/집신/` with the same relative path. Do not stage unrelated existing changes or sensitive example data.
