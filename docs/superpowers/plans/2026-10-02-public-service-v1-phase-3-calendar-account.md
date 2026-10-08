# 공개형 서비스 V1 3단계 캘린더·계정 구현계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 집과 기록에 연결된 월간 일정과 계정·동의·탈퇴 요청 화면을 완성한다.

**Architecture:** 일정은 집 참여 권한을 상속하되 서버와 RLS에서 다시 검사한다. 계정 설정은 프로필 변경, 선택 동의 변경, 재인증이 필요한 탈퇴 요청을 분리한다.

**Tech Stack:** Next.js App Router, Supabase Postgres, Vitest, Testing Library, Playwright, axe

**Spec:** `docs/12-public-self-service-v1-spec.md` (`PSV1-CAL-001`, `PSV1-ACCOUNT-001`)

## Global Constraints

- 일정은 Asia/Seoul 기준으로 입력·표시하고 DB에는 명확한 시간대를 저장한다.
- 종료된 참여자는 일정 상세 조회·생성·수정을 할 수 없다.
- 마케팅 동의는 필수 동의와 독립적으로 변경한다.
- 탈퇴는 즉시 삭제로 오해시키지 않고 요청 상태와 영향을 보여준다.

## Review Focus

- 월 경계·자정·서머타임 외부 입력에서 날짜가 하루 어긋나지 않는다.
- 권한 없는 일정 제목과 연결 기록이 목록 응답에도 노출되지 않는다.
- 중복 일정 제출과 저장 실패가 안전하게 처리된다.
- 선택 동의 변경이 필수 동의 이력을 덮어쓰지 않는다.
- 탈퇴 요청 재전송과 세션 만료가 중복 요청을 만들지 않는다.

---

### Task 1: 일정 schema와 시간 변환

**Files:** Create `supabase/migrations/202610020004_events.sql`, `features/calendar/domain/time.ts`, modify `types/database.ts`; test `tests/unit/calendar/time.test.ts`, `tests/integration/db/event-policies.test.ts`.

- [ ] 월 경계·자정·권한·종료 참여 테스트를 작성한다.
- [ ] `events` schema, RLS와 서울 시간 변환 함수를 구현한다.
- [ ] migration·단위·정책 테스트 후 `feat: add property calendar schema`로 커밋한다.

### Task 2: 월간 캘린더와 일정 작성

**Files:** Create `app/(app)/calendar/page.tsx`, `features/calendar/actions/create-event.ts`, `features/calendar/queries.ts`, `features/calendar/components/MonthCalendar.tsx`, `EventForm.tsx`; test `tests/integration/calendar/*.test.ts`, `tests/e2e/calendar.spec.ts`.

- [ ] 빈 달·월 이동·오늘·연결 이동·중복·오류 테스트를 작성한다.
- [ ] 월간 조회와 집·기록 연결 일정 작성을 구현한다.
- [ ] 320·390·1440px와 키보드 E2E 후 `feat: add linked home calendar`로 커밋한다.

### Task 3: 계정·동의·탈퇴 요청

**Files:** Create `supabase/migrations/202610020005_account_requests.sql`, `app/(app)/settings/account/page.tsx`, `features/account/actions/update-consents.ts`, `request-deletion.ts`, `features/account/components/AccountSettings.tsx`; test `tests/integration/account/*.test.ts`.

- [ ] 선택 동의·필수 이력 보존·재인증·중복 탈퇴·오류 테스트를 작성한다.
- [ ] 계정 화면과 서버 action, `account_deletion_requests`를 구현한다.
- [ ] 탈퇴 요청이 즉시 실제 데이터 삭제를 실행하지 않음을 검증한다.
- [ ] `feat: add account consent controls`로 커밋한다.

### Task 4: 접근성·추적·독립 검수

**Files:** Create `docs/traceability/public-v1-calendar-account.md`, `docs/worklogs/YYYY-MM-DD-public-v1-calendar-account.md`, modify `WORK_STATUS.md`.

- [ ] axe, 수동 키보드, 확대, 모바일과 긴 텍스트 검수를 수행한다.
- [ ] 자동검사와 브라우저 결과를 분리 기록하고 P0·P1을 수정한다.
- [ ] 네 커버리지 80% 이상과 독립 검수 통과 후 승인 대기로 커밋한다.
