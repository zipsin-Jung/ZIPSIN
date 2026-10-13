# 집신 로그인 홈 시각 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가입 사용자가 생활 속 문제를 즉시 이해하고, 집별 기록을 체크하듯 하나씩 남기며, 기록이 쌓인 뒤에는 실제 할 일·집·대화를 바로 이어가는 고급 로그인 홈을 만든다.

**Architecture:** 교육용 생활 사진과 실제 사용자 기록을 명확히 분리한다. `PainPointExplorer`는 문제 인식을, `HomeRecordChecklist`는 실제 기록 준비 상태를, `HomeStart`는 역할·데이터 상태별 구성을 담당한다. 서버 페이지는 로그인 세션과 RLS로만 홈 데이터를 조회하고 비공개 이미지는 짧은 signed URL로 전달한다.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS, Supabase RLS/Storage, Vitest/Testing Library, Playwright, `@fontsource-variable/pretendard`

**Spec:** `docs/superpowers/specs/2026-10-13-home-visual-redesign-design.md`

## Global Constraints

- 기존 프로젝트와 Git 기록을 보존하고 새 프로젝트를 만들지 않는다.
- 기본 첫 장면은 `흩어진 사진과 파일`이다.
- 교육용 AI 사진을 사용자의 실제 집 기록이나 실제 고객 사례로 표현하지 않는다.
- 완료 수는 실제 저장 데이터만으로 계산한다.
- 주소나 집 ID만으로 사진·기록 접근 범위를 넓히지 않는다.
- 비공개 사진은 로그인 세션·RLS·300초 signed URL을 통과한 JPEG·PNG만 사용한다.
- 본문 16px 이상, 주요 버튼 48px 이상, 320·390·768·1440px 가로 넘침 0건을 지킨다.
- Production은 사용자 Preview 승인 전 배포하지 않는다.

## Review Focus

- 이미지가 실패해도 질문·설명·CTA가 남아야 한다. Task 3의 `TEST-ZH-PAIN-003`이 검증한다.
- 조회 오류를 정상 빈 상태로 표시하면 안 된다. Task 4의 `TEST-ZH-DATA-003`이 검증한다.
- 관계가 끝난 사용자의 사진을 홈에 표시하면 안 된다. Task 4의 RLS 경계 테스트가 검증한다.
- 일반 문서를 계약서로, 일반 메모를 설비 기록으로 잘못 완료 처리하면 안 된다. Task 2의 템플릿 키 테스트가 검증한다.
- 키보드·작은 화면에서 장면과 상세 설명을 사용할 수 있어야 한다. Task 5의 Playwright 검사가 검증한다.

---

## 파일 구조

- `public/images/home-pain-*.png`: 승인된 교육용 생활 사진 세 장
- `features/workspace/domain/home-checklist.ts`: 실제 기록에서 체크리스트 상태 계산
- `features/workspace/components/PainPointExplorer.tsx`: 문제 장면 선택과 해결 설명
- `features/workspace/components/HomeRecordChecklist.tsx`: 완료 상태와 `왜 필요한가요?`
- `features/workspace/components/HomeStart.tsx`: 상태별 홈 조합
- `features/workspace/services/home-dashboard.ts`: RLS-visible 데이터와 안전한 썸네일 조회
- `app/(app)/home/page.tsx`: 서버 경계·오류 상태·컴포넌트 연결
- `app/(app)/layout.tsx`, `features/navigation/components/AppNavigation.tsx`, `app/globals.css`: 앱 헤더·폰트·토큰

### Task 1: 승인 이미지와 한글 타이포 기반

**Files:**
- Create: `public/images/home-pain-scattered-records-v1.png`
- Create: `public/images/home-pain-paper-contract-v1.png`
- Create: `public/images/home-pain-ceiling-aircon-v1.png`
- Modify: `package.json`, `package-lock.json`
- Modify: `app/layout.tsx`, `app/globals.css`
- Test: `tests/unit/design/app-typography.test.tsx`

**Interfaces:**
- Produces: 세 고정 이미지 경로와 전역 `--font-sans`, 앱 전용 색·타이포 토큰

- [ ] **Step 1: 실패 테스트 작성** — 전역 레이아웃이 Pretendard Variable CSS를 포함하고 앱 본문 토큰이 16px 이상인지 검사한다.
- [ ] **Step 2: 실패 확인** — `npm test -- tests/unit/design/app-typography.test.tsx`; 현재 Arial 우선으로 FAIL.
- [ ] **Step 3: 이미지 복사** — 승인 이미지 생성 결과를 위 세 경로에 비파괴적으로 복사한다.
- [ ] **Step 4: 폰트 설치·적용** — `npm install @fontsource-variable/pretendard` 후 `app/layout.tsx`에서 로컬 번들 CSS를 불러오고 `globals.css`의 Arial 우선 스택을 교체한다.
- [ ] **Step 5: 디자인 토큰 적용** — `#F7F7F3`, `#16211E`, `#5D6A65`, `#0E5A4D`, `#083E37`, `#EAF2EF`, `#C98A2E`를 앱 전용 변수로 정의한다.
- [ ] **Step 6: 검사·커밋** — 단위 테스트, `git diff --check`; `feat: add home editorial assets and typography`.

### Task 2: 실제 기록 체크리스트 계산

**Files:**
- Create: `features/workspace/domain/home-checklist.ts`
- Create: `tests/unit/workspace/home-checklist.test.ts`
- Modify: `features/records/components/RecordForm.tsx`
- Modify: `app/(app)/homes/[homeId]/records/new/page.tsx`
- Test: `tests/unit/records/record-form.test.tsx`

**Interfaces:**
- Produces: `buildHomeChecklist(input: HomeChecklistInput): HomeChecklistItem[]`
- `HomeChecklistInput`: `homeId`, `recordKinds`, `recordTitles`, `hasReadyPhoto`, `activeRelationshipCount`, `canInvite`
- 항목 ID: `home`, `condition_photo`, `contract_document`, `equipment`, `change_history`, `people`

- [ ] **Step 1: 실패 테스트 작성** — 실제 photo/document/repair/relationship 데이터만 해당 항목을 완료하고, 설비는 `설비 정보 ·` 템플릿으로 작성된 note만 완료하는 `TEST-ZH-CHECK-001~004`를 작성한다.
- [ ] **Step 2: 실패 확인** — `npm test -- tests/unit/workspace/home-checklist.test.ts`; 모듈 없음으로 FAIL.
- [ ] **Step 3: 순수 계산 함수 구현** — 완료 상태, 라벨, 짧은 이유, 개인정보 주의, 실제 href를 반환한다.
- [ ] **Step 4: 템플릿 진입 구현** — `/records/new?template=equipment|contract|condition`을 안전한 허용 목록으로 파싱해 RecordForm의 종류·제목 안내를 미리 선택하되 사용자가 수정할 수 있게 한다.
- [ ] **Step 5: 검사·커밋** — 체크리스트와 폼 테스트; `feat: add evidence-based home record checklist`.

### Task 3: 문제 인식 장면과 상세 설명 UI

**Files:**
- Create: `features/workspace/components/PainPointExplorer.tsx`
- Create: `features/workspace/components/HomeRecordChecklist.tsx`
- Create: `tests/unit/workspace/pain-point-explorer.test.tsx`
- Create: `tests/unit/workspace/home-record-checklist.test.tsx`

**Interfaces:**
- Consumes: Task 1 이미지 경로, Task 2 `HomeChecklistItem[]`
- Produces: `PainPointExplorer({ initialScene? })`, `HomeRecordChecklist({ homeLabel, items })`

- [ ] **Step 1: 실패 테스트 작성** — 기본 사진 혼란 장면, 세 장면 전환, 연결 CTA, 이미지 실패 폴백을 `TEST-ZH-PAIN-001~003`으로 작성한다.
- [ ] **Step 2: 실패 확인** — 두 신규 테스트 파일 실행; 컴포넌트 없음으로 FAIL.
- [ ] **Step 3: 장면 탐색 구현** — 데스크톱 탭과 모바일 스와이프/버튼을 같은 상태 모델로 제공하고 한 번에 질문 1개·해결 1개만 강조한다.
- [ ] **Step 4: 체크리스트 구현** — `완료 n/6`, 완료·미완료 중립 상태, 접근 가능한 `<details><summary>왜 필요한가요?</summary>`와 CTA를 구현한다.
- [ ] **Step 5: 검사·커밋** — 컴포넌트 테스트와 axe 가능한 정적 검사를 실행; `feat: add guided home pain points and checklist`.

### Task 4: 안전한 실제 홈 데이터

**Files:**
- Create: `features/workspace/services/home-dashboard.ts`
- Create: `tests/unit/workspace/home-dashboard.test.ts`
- Modify: `app/(app)/home/page.tsx`
- Modify: `tests/unit/workspace/home-page-data.test.tsx`

**Interfaces:**
- Produces: `loadHomeDashboard(supabase, userId): Promise<HomeDashboardResult>`
- 성공 결과: `offices`, `homes`, `recordsByHome`, `checklistsByHome`, `thumbnailByHome`, `unreadChatCount`, `nextTask`
- 실패 결과: 안전한 `errorCode`만 포함하고 내부 DB 메시지는 노출하지 않음

- [ ] **Step 1: 실패 테스트 작성** — 권한 있는 집만 반환, 최대 3개 JPEG·PNG 썸네일, HEIC·PDF 제외, 조회 오류 구분을 `TEST-ZH-DATA-001~003`으로 작성한다.
- [ ] **Step 2: 실패 확인** — `npm test -- tests/unit/workspace/home-dashboard.test.ts`; 서비스 없음으로 FAIL.
- [ ] **Step 3: 서버 서비스 구현** — 기존 사용자 세션 Supabase만 사용하고 RLS-visible home → record → ready attachment 순서로 조회한다.
- [ ] **Step 4: signed URL 구현** — 선택된 storage path만 300초 URL로 만들고 실패한 사진은 해당 집의 `사진 없음` 상태로 낮춘다.
- [ ] **Step 5: 페이지 연결** — 정상 빈 상태와 오류 상태를 분리하여 HomeStart에 전달한다.
- [ ] **Step 6: RLS 경계 확인** — 종료 관계 fixture에서 다른 집 attachment가 결과에 없음을 통합 테스트한다.
- [ ] **Step 7: 검사·커밋** — 관련 단위·통합 테스트; `feat: load private home dashboard evidence`.

### Task 5: 홈·헤더 최종 조합

**Files:**
- Modify: `features/workspace/components/HomeStart.tsx`
- Modify: `app/(app)/layout.tsx`
- Modify: `features/navigation/components/AppNavigation.tsx`
- Modify: `tests/unit/workspace/home-start.test.tsx`
- Modify: `tests/unit/navigation/app-navigation.test.tsx`

**Interfaces:**
- Consumes: Task 3 컴포넌트, Task 4 `HomeDashboardResult`
- Produces: 신규·초기·활성·오류 상태의 완성된 `/home`

- [ ] **Step 1: 실패 테스트 갱신** — 홍보형 3단계 배너 부재, 문제 장면·체크리스트·실제 업무 상태, 역할별 CTA, 현재 메뉴 표시를 검증한다.
- [ ] **Step 2: 실패 확인** — 현재 HomeStart의 마케팅 히어로 때문에 FAIL.
- [ ] **Step 3: HomeStart 재구성** — 신규 사용자는 문제 장면과 단일 시작 행동, 초기 사용자는 선택 집 체크리스트, 활성 사용자는 오늘 할 일·최근 집·대화를 우선한다.
- [ ] **Step 4: 헤더 재구성** — 임시 Z 타일을 실제 집신 로고로 바꾸고 모바일·PC 현재 메뉴, 알림, 마이를 명확히 한다.
- [ ] **Step 5: 시각 토큰 적용** — 대형 그라데이션·글래스·강한 그림자를 제거하고 1440px 8:4, 모바일 1열 순서를 구현한다.
- [ ] **Step 6: 검사·커밋** — HomeStart·내비게이션 테스트; `feat: redesign the signed-in home workspace`.

### Task 6: 전체 품질 게이트와 Preview

**Files:**
- Create: `tests/e2e/home-guided-onboarding.spec.ts`
- Modify: `docs/traceability/release-candidate-v1.md`
- Modify: `WORK_STATUS.md`
- Create: `docs/worklogs/2026-10-13-home-visual-redesign-implementation.md`

**Interfaces:**
- Consumes: Tasks 1~5 전체
- Produces: 테스트 증거, 추적표, Preview 승인 후보

- [ ] **Step 1: E2E 작성** — 390·1440px에서 장면 → `왜 필요한가요?` → 기록 작성 → 체크 완료 반영, 키보드 접근, 가로 넘침, 이미지 실패를 검증한다.
- [ ] **Step 2: 전체 검사** — `npm test`, `npm run test:coverage`, `npm run typecheck`, `npm run build`; 커버리지 네 지표 80% 이상.
- [ ] **Step 3: 브라우저 검수** — 320·390·768·1440px, 콘솔·hydration 오류 0, 실제 글꼴·사진·CTA·빈 상태를 확인한다.
- [ ] **Step 4: 독립 품질검수** — PRD·권한·개인정보·접근성·성능·시각 일관성을 읽기 전용으로 재검수한다.
- [ ] **Step 5: 문서·바탕화면 동기화** — 요구사항→소스→테스트→결과 추적과 대화·작업기록을 갱신한다.
- [ ] **Step 6: Git·Preview** — 비밀정보 검사를 거쳐 `codex/public-v1-auth`에 푸시하고 Vercel Preview만 확인한다.
- [ ] **Step 7: 사용자 보고** — 실제 기능, 미완성 기능, 테스트 결과, Preview 주소, Production 전 승인 항목만 한 장으로 보고한다.

## 자체 검토 결과

- ZH-UX-001은 Tasks 1·3·5·6에 연결됩니다.
- ZH-UX-002는 Tasks 2·3·4·6에 연결됩니다.
- ZH-UX-003은 Tasks 4·5·6에 연결됩니다.
- ZH-UX-004는 Tasks 1·3·5·6에 연결됩니다.
- 새 결제·법적 효력·권한 정책·Production 배포는 포함하지 않았습니다.
