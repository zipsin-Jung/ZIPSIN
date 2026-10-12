# 집신 유료 파일럿 배포 전 구현계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공인중개사무소가 집 5채를 등록하고 직원·임대인·임차인과 기록·파일·할 일을 안전하게 이어갈 수 있는 유료 파일럿을 배포 직전 상태까지 완성한다.

**Architecture:** 기존 인증과 `202610130001_office_home_records.sql`을 보존하고 후속 hardening migration에서 직접 쓰기를 원자 RPC로 교체한다. Next.js App Router 서버 액션이 입력을 검증하고 RPC를 호출하며, 조회는 RLS와 관계 기반 쿼리를 함께 사용한다. 첨부파일은 Supabase private bucket과 5분 signed URL만 사용한다.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage, Zod, Vitest, React Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-10-13-paid-pilot-predeployment-design.md`

## Global Constraints

- 주소나 추측한 UUID는 접근 권한이 아니다.
- 기존 인증 코드와 migration을 삭제·재작성하지 않는다.
- 집 생성·초대 수락·담당 배정·권한 종료는 원자 RPC로 처리한다.
- 사무소 내부 기록과 현재 계약 공유 기록을 분리한다.
- 이전 계약자의 개인정보와 파일은 다음 계약에 노출하지 않는다.
- 실제 결제·채팅·PDF·OCR·AI·영구 집 키·공개 주소 검색은 제외한다.
- Production migration·배포·원격 푸시는 사용자 최종 승인 전 실행하지 않는다.
- 새 제품 코드까지 포함해 Statements, Branches, Functions, Lines 각각 80% 이상을 유지한다.

## Review Focus

- 서로 다른 사무소·집·계약 ID를 섞은 요청은 저장 전 서버와 DB 모두에서 거부한다.
- 만료·철회·재사용·동시 수락 초대는 멤버십을 한 건만 만들거나 모두 거부한다.
- 담당·소속·계약 종료 다음 요청부터 조회·쓰기·signed URL 발급을 거부한다.
- 중복 클릭·재시도·부분 업로드 실패에도 중복 데이터와 고아 파일을 만들지 않는다.
- 320px·390px·1440px, 키보드, 느린 네트워크에서도 입력 보존과 복구가 가능하다.

---

### Task 1: 권한 기반 강화와 공통 도메인

**Files:**
- Create: `supabase/migrations/202610130002_paid_pilot_core.sql`
- Create: `features/workspace/domain/permissions.ts`
- Create: `features/workspace/domain/errors.ts`
- Modify: `supabase/migrations/202610130001_office_home_records.sql`은 수정하지 않음
- Modify: `types/database.ts`
- Test: `tests/integration/db/paid-pilot-policies.test.ts`
- Test: `tests/unit/workspace/permissions.test.ts`

**Interfaces:**
- Produces: `canCreateRecord(role, space, kind)`, 안전한 오류 코드, 후속 Task가 호출할 RPC와 강화된 제약

- [ ] 실패 테스트로 직접 home/record update, 혼합 ID, 종료 관계, 재초대·재배정 제약을 고정한다.
- [ ] 테스트가 기존 정책의 허점을 이유로 실패하는지 확인한다.
- [ ] 직접 쓰기 권한 회수, 활성 관계 partial unique, 기록 불변 필드, 관계 종료·초대 조합 제약을 후속 migration에 구현한다.
- [ ] 공통 권한·오류 도메인을 최소 구현하고 집중·전체 테스트를 통과시킨다.
- [ ] `fix: harden paid pilot access boundaries`로 커밋한다.

### Task 2: 첫 집 등록과 집 목록

**Files:**
- Create: `app/(app)/homes/new/page.tsx`, `app/(app)/homes/page.tsx`
- Create: `features/homes/actions/create-home.ts`, `features/homes/services/create-home.ts`
- Create: `features/homes/components/HomeForm.tsx`, `features/homes/schemas/home.ts`
- Modify: `features/workspace/components/HomeStart.tsx`, `app/(app)/home/page.tsx`, migration/types
- Test: `tests/unit/homes/home-form.test.tsx`, `tests/integration/homes/create-home.test.ts`

**Interfaces:**
- Produces: `create_home_for_office(p_office_id,p_address_line1,p_address_detail,p_home_label,p_idempotency_key) returns uuid`

- [ ] 주소 검증·입력 유지·중복 제출·다른 사무소·자동 병합 금지 테스트를 먼저 실패시킨다.
- [ ] RPC에서 집·대표 담당·감사 기록을 원자 생성하고 서버 액션/화면을 구현한다.
- [ ] 성공 시 집 상세로 이동하고 실패 시 입력을 유지한다.
- [ ] 집중·전체 테스트 후 `feat: add first office home registration`으로 커밋한다.

### Task 3: 직원 초대와 담당 배정

**Files:**
- Create: `app/(app)/office/members/page.tsx`, `app/(app)/invitations/[token]/page.tsx`, `app/(app)/homes/[homeId]/assignees/page.tsx`
- Create: `features/invitations/*`, `features/assignments/*`
- Modify: migration/types/app navigation
- Test: `tests/unit/invitations/*.test.ts`, `tests/integration/invitations/office-invite.test.ts`, `tests/integration/assignments/home-assignment.test.ts`

**Interfaces:**
- Produces: `create_office_invitation`, `accept_office_invitation`, `revoke_invitation`, `assign_office_member_to_home`, `end_office_home_assignment`

- [ ] 토큰 해시·만료·철회·재사용·동시 수락·대표 전용·보조원 권한 제한 실패 테스트를 작성한다.
- [ ] 담당 대상 동일 사무소·활성 관계·중복·종료 테스트를 작성한다.
- [ ] 원자 RPC, 서버 액션, 초대 수락과 담당 UI를 최소 구현한다.
- [ ] 전체 테스트 후 `feat: add office invitations and home assignments`로 커밋한다.

### Task 4: 집 상세·타임라인·기록·할 일

**Files:**
- Create: `app/(app)/homes/[homeId]/page.tsx`, `app/(app)/homes/[homeId]/records/new/page.tsx`, `app/(app)/tasks/page.tsx`
- Create: `features/records/*`, `features/tasks/*`
- Modify: migration/types/home dashboard
- Test: `tests/unit/records/*.test.tsx`, `tests/integration/records/create-record.test.ts`, `tests/integration/tasks/task-state.test.ts`

**Interfaces:**
- Produces: `create_home_record`, `update_home_record`, `update_task_state`; record kinds `note|photo|document|repair|task`

- [ ] 공간별 권한·혼합 ID·종료 관계·멱등성·입력 유지·보조원 제한 테스트를 먼저 실패시킨다.
- [ ] 기록 핵심 식별자 불변과 작성자/대표 수정 권한을 DB와 서버에서 구현한다.
- [ ] 최신순 타임라인과 오늘·지연·답변 대기 할 일 화면을 구현한다.
- [ ] 전체 테스트 후 `feat: add home record timeline and tasks`로 커밋한다.

### Task 5: 비공개 사진·문서

**Files:**
- Create: `supabase/migrations/202610130003_private_attachments.sql`
- Create: `app/api/attachments/[attachmentId]/url/route.ts`
- Create: `features/attachments/*`
- Test: `tests/unit/attachments/*.test.tsx`, `tests/integration/attachments/private-upload.test.ts`

**Interfaces:**
- Produces: `prepare_attachment_upload`, `complete_attachment_upload`; private bucket `home-records`; JPEG/PNG/HEIC/PDF, 20MB, 기록당 10개, signed URL 5분

- [ ] 형식·크기·개수·타인 경로·종료 관계·부분실패·고아 파일 테스트를 먼저 실패시킨다.
- [ ] 비공개 정책, 업로드 준비/완료, signed URL, 성공·실패 분리 UI를 구현한다.
- [ ] 전체 테스트 후 `feat: add private record attachments`로 커밋한다.

### Task 6: 임대인·임차인 초대와 권한 종료

**Files:**
- Create: `app/(app)/homes/[homeId]/participants/page.tsx`
- Create: `features/participants/*`, `features/access/*`
- Modify: invitation page, migration/types
- Test: `tests/integration/participants/home-invite.test.ts`, `tests/integration/access/revocation.test.ts`

**Interfaces:**
- Produces: `create_home_invitation`, `accept_home_invitation`, `end_office_membership`, `end_home_membership`, `end_contract`

- [ ] 현재 계약만 허용·이전 계약 차단·내부 기록 비노출·종료 즉시 거부·기록 보존 테스트를 먼저 실패시킨다.
- [ ] 직원 종료 시 활성 담당도 함께 종료하고 모든 종료를 감사 기록에 남긴다.
- [ ] 관계자 초대와 종료 UI를 구현하고 전체 테스트 후 `feat: add contract participants and access revocation`으로 커밋한다.

### Task 7: 실제 사무소 업무 홈과 앱 내비게이션

**Files:**
- Create: `components/app/AppNavigation.tsx`, `features/dashboard/*`
- Modify: `app/(app)/layout.tsx`, `app/(app)/home/page.tsx`
- Test: `tests/unit/dashboard/*.test.tsx`, `tests/e2e/paid-pilot-navigation.spec.ts`

**Interfaces:**
- Consumes: homes, records, tasks, memberships from Tasks 2~6
- Produces: 역할별 `홈/집/할 일/마이`, 대표 `구성원 관리`, 오늘 할 일·최근 집·확인 기록·최근 활동

- [ ] 역할별 노출·빈/로딩/오류/종료·모바일 내비게이션 테스트를 먼저 실패시킨다.
- [ ] 320px·390px·1440px와 44px 터치 영역을 만족하는 셸과 홈을 구현한다.
- [ ] 전체 테스트 후 `feat: add paid pilot workspace dashboard`로 커밋한다.

### Task 8: 시나리오·스트레스·커버리지·추적 문서

**Files:**
- Create: `tests/e2e/paid-pilot-happy-path.spec.ts`, `tests/e2e/paid-pilot-permissions.spec.ts`
- Create: `tests/stress/invitation-acceptance.test.ts`, `tests/stress/idempotent-record-write.test.ts`
- Create: `docs/traceability/paid-pilot-v1.md`, `docs/quality/paid-pilot-v1-report.md`, `docs/worklogs/2026-10-13-paid-pilot-v1.md`
- Modify: `WORK_STATUS.md`

**Interfaces:**
- Produces: REQ/AC/FLOW/SCREEN/SOURCE/TEST 실행 증거와 최종 품질 판정

- [ ] 대표→집 5채→직원→담당→기록→파일→관계자→종료 E2E와 권한 음성 시나리오를 작성한다.
- [ ] 합성 데이터로 초대 10회 동시 수락, 기록 20회 중복 요청, 집 50채/기록 500건 경계 테스트를 안전한 로컬/Preview에서 실행한다.
- [ ] `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, Chromium/WebKit E2E와 접근성 검사를 분리 실행한다.
- [ ] 실제 Preview가 준비된 경우 6계정 RLS 시나리오를 수행하고, 준비되지 않으면 미검증으로 명시한다.
- [ ] 네 커버리지 지표 80% 이상과 P0·P1 0건을 확인하고 문서·바탕화면을 동기화한다.
- [ ] `test: verify paid pilot predeployment`와 `docs: trace paid pilot delivery`로 커밋한다.

### Task 9: 독립 검수와 배포 승인 대기

**Files:**
- Modify: 검수에서 발견된 결함의 해당 테스트·소스·품질 보고서

- [ ] 독립 검수 에이전트가 전체 diff, Review Focus, 추적표와 실행 증거를 검토한다.
- [ ] P0·P1은 재현 테스트 RED→수정→GREEN→전체 회귀 한 번의 수정 패스로 처리한다.
- [ ] 최종 Git 상태와 커밋을 확인하고 민감정보·미추적 산출물을 검사한다.
- [ ] 원격 푸시·Preview migration·Vercel 배포는 실행하지 않고 사용자에게 각각의 영향과 함께 최종 승인을 요청한다.

