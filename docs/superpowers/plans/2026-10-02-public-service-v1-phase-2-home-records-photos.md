# 공개형 서비스 V1 2단계 집·기록·사진 구현계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 권한 있는 사용자가 첫 집을 만들거나 초대로 참여하고, 기록과 비공개 사진을 저장·재확인하게 한다.

**Architecture:** 집, 계약, 참여, 기록, 첨부를 분리하고 Postgres RLS와 서버 action에서 함께 권한을 확인한다. 사진은 Supabase private bucket에 저장하고 만료되는 signed URL만 제공한다.

**Tech Stack:** Next.js App Router, Supabase Postgres/Storage, Zod, Vitest, Playwright

**Spec:** `docs/12-public-self-service-v1-spec.md` (`PSV1-HOME-001`, `PSV1-REC-001`, `PSV1-PHOTO-001`)

## Global Constraints

- 주소 일치만으로 참여를 생성하지 않는다.
- 장기 집 이력, 현재 계약, 사무소 내부 기록을 분리한다.
- 참여 종료 사용자는 새 기록·업로드를 할 수 없다.
- 사진 bucket은 public으로 만들지 않는다.

## Review Focus

- 직접 URL, 추측한 UUID, 만료 초대로 타인의 집에 접근하지 못한다.
- 이전 계약 개인정보와 첨부 metadata가 다음 계약에 노출되지 않는다.
- 중복 집 후보를 자동 병합하지 않는다.
- 업로드 성공 후 DB 저장 실패 시 고아 파일을 정리하거나 재처리한다.
- 긴 제목·많은 사진·느린 업로드에도 중복 기록이 생기지 않는다.

---

### Task 1: 집·계약·참여·기록·첨부 schema

**Files:** Create `supabase/migrations/202610020002_homes_records.sql`, modify `types/database.ts`, create `docs/technical/public-v1-permissions.md`, test `tests/integration/db/home-policies.test.ts`.

- [ ] 소유·초대·종료·이전 계약·다른 사용자 RLS 실패 테스트를 작성한다.
- [ ] `homes`, `contracts`, `memberships`, `invitations`, `records`, `attachments`, 감사 테이블과 RLS를 작성한다.
- [ ] migration 적용·되돌림·정책 테스트를 실행한다.
- [ ] `feat: add home record access schema`로 커밋한다.

### Task 2: 첫 집과 초대

**Files:** Create `app/(app)/homes/new/page.tsx`, `app/(app)/invites/[token]/page.tsx`, `features/homes/actions/create-home.ts`, `features/homes/actions/accept-invite.ts`, `features/homes/schemas/home.ts`; test `tests/integration/homes/*.test.ts`.

- [ ] 주소 검증·중복 후보·만료·폐기·재사용·권한 거부 테스트를 작성한다.
- [ ] 집 생성은 새 UUID를 만들고 중복 후보는 확인 상태로만 반환하게 구현한다.
- [ ] 초대 token은 해시 저장, 만료·폐기·1회 수락을 적용한다.
- [ ] 정상·거부·중복 흐름 테스트 후 `feat: add first home and invites`로 커밋한다.

### Task 3: 빈 홈과 집 타임라인

**Files:** Modify `app/(app)/home/page.tsx`, create `app/(app)/homes/[homeId]/page.tsx`, `features/homes/queries.ts`, `features/records/components/RecordTimeline.tsx`; test `tests/integration/homes/home-page.test.tsx`.

- [ ] 역할별 빈 행동, 목록, 권한 거부, 참여 종료 테스트를 작성한다.
- [ ] 서버 조회와 빈 화면·로딩·오류·타임라인을 구현한다.
- [ ] 직접 URL 거부와 모바일 키보드 검사를 실행한다.
- [ ] `feat: add home timeline`으로 커밋한다.

### Task 4: 기록 작성과 재시도

**Files:** Create `app/(app)/homes/[homeId]/records/new/page.tsx`, `features/records/actions/create-record.ts`, `features/records/schemas/record.ts`, `features/records/components/RecordForm.tsx`; test `tests/integration/records/create-record.test.ts`.

- [ ] 정상·권한 거부·참여 종료·중복 idempotency key·부분 실패 테스트를 작성한다.
- [ ] 서버 권한 확인, 안전한 공간 선택, 기록 저장과 입력 유지 오류를 구현한다.
- [ ] 반복 제출에도 한 건만 생성되는지 검증한다.
- [ ] `feat: add home records`로 커밋한다.

### Task 5: 비공개 사진 업로드와 모아보기

**Files:** Create `supabase/migrations/202610020003_private_photos.sql`, `app/(app)/photos/page.tsx`, `app/api/photos/sign/route.ts`, `features/photos/storage.ts`, `features/photos/components/PhotoUploader.tsx`; test `tests/integration/photos/*.test.ts`, `tests/e2e/home-record-photo.spec.ts`.

- [ ] 형식·용량·권한·만료 URL·업로드/DB 부분 실패 테스트를 작성한다.
- [ ] private bucket 정책, signed upload/read URL과 고아 파일 정리 경로를 구현한다.
- [ ] 사진이 집·기록에서 다시 보이고 타인에게는 거부되는 E2E를 실행한다.
- [ ] `feat: add private record photos`로 커밋한다.

### Task 6: 추적과 독립 검수

**Files:** Create `docs/traceability/public-v1-home-records-photos.md`, `docs/worklogs/YYYY-MM-DD-public-v1-home-records-photos.md`, modify `WORK_STATUS.md`.

- [ ] 타입·단위·통합·커버리지·빌드와 브라우저 결과를 분리 기록한다.
- [ ] 이전 계약·종료 참여·직접 URL·signed URL을 독립 검수한다.
- [ ] P0·P1 0건과 네 커버리지 80% 이상을 확인하고 승인 대기로 커밋한다.
