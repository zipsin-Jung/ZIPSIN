# 집신 계약 중심 집 홈 1단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Apply `superpowers:test-driven-development` to every behavior change and `zipsin-quality-gate` before completion.

**Goal:** 가입 후 사용 목적과 실제 권한을 분리하고, 권한 있는 집을 열었을 때 계약 만기 D-day·각 당사자의 준비 상태·실제 데이터에 근거한 다음 행동 최대 3개를 바로 확인하게 한다.

**Architecture:** `profiles.usage_purpose`는 비권한 개인화 값으로 저장한다. 실제 접근은 기존 `office_memberships`, `home_memberships`, 계약 상태와 RLS가 계속 결정한다. 계약 날짜와 만기 계획 변경은 직접 테이블 쓰기가 아니라 보안 RPC를 통과하고, 계획 상태는 계약·사용자별로 분리한 append-only 감사 이벤트를 남긴다. 날짜·다음 행동 계산은 순수 도메인 함수로 분리해 서버 화면과 테스트가 같은 규칙을 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Supabase Postgres/RLS/RPC, Vitest, Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-10-13-contract-to-expiry-home-design.md` (`ZH-LIFE-001`, `ZH-LIFE-003`, `ZH-LIFE-004`)

## 범위 경계

이번 단계에 포함:

- 네 사용 목적과 공인중개사 세부 역할 선택
- 기존 활성 집·계약을 이용한 계약 요약
- 권한 있는 대표·소속공인중개사의 계약 시작·만기일 입력
- 임대인·임차인의 자기 만기 계획 저장
- D-day/D+day, 최대 3개 다음 행동, 명확한 빈 상태·오류 상태
- 단일 집 사용자와 여러 집 관리자에게 맞는 홈 우선순위

이번 단계에 포함하지 않음:

- 개인 사용자의 새 개인 집 공간 생성과 기존 공유 집 연결
- 공인중개사의 대리 만기 계획 입력
- 계획 상태의 외부 알림·법적 통지
- OCR·AI 분류·PDF 묶음 내보내기
- 사진·문서·채팅의 새 기능 확장
- 결제와 Production 배포

## 데이터 결정

### `profiles.usage_purpose`

- 허용값: `tenant`, `landlord`, `broker`, `management_other`
- 역할이 아니라 화면 안내용 값이다.
- 기존 사용자 백필: `landlord→landlord`, `tenant→tenant`, `principal_broker|associate_broker|assistant→broker`
- `management_other`는 `primary_role` 없이 온보딩을 완료할 수 있지만 유효한 초대 관계 없이는 집을 볼 수 없다.
- `broker`는 `principal_broker`, `associate_broker`, `assistant` 중 세부 역할이 있어야 온보딩 완료다.

### `contract_plan_states`

- 키: `(contract_id, subject_user_id)`
- 상태: `undecided`, `renewal_considering`, `move_out_preparing`
- 본인에게 유효한 현재 계약의 임대인·임차인 관계가 있을 때만 자기 상태를 변경한다.
- 사무소 구성원은 현재 상태를 읽을 수 있지만 이번 단계에서는 대신 변경할 수 없다.
- 상태 변경은 `contract_plan_events`에 actor, subject, 이전값, 새값, 시각을 남긴다.

### 계약 편집

- 집의 사무소에서 활성 `principal_broker` 또는 `associate_broker` 멤버만 계약 종류·시작일·만기일을 생성한다.
- 활성 계약의 날짜는 같은 권한으로 수정할 수 있다.
- `assistant`는 사진·문서·일정 보조 업무를 계속할 수 있지만 계약 날짜를 확정하지 않는다.
- 현재 집과 다른 집의 계약 ID 조합은 RPC에서 거부한다.

## 파일 구조

- `supabase/migrations/202610130011_contract_lifecycle_home.sql`: 목적·계약 계획·감사·계약 저장 RPC·RLS
- `features/auth/domain/purpose.ts`: 목적·세부 역할 파싱과 표시 데이터
- `features/auth/components/PurposePicker.tsx`: 네 입구와 공인중개사 세부 단계
- `features/auth/actions/save-purpose.ts`: 인증된 서버 액션과 RPC 호출
- `features/auth/guards/require-onboarding.ts`: 목적과 권한 역할을 분리한 완료 판단
- `features/contracts/domain/lifecycle.ts`: D-day·상태·다음 행동 순수 계산
- `features/contracts/schemas/contract.ts`: 계약 날짜·계획 상태 검증
- `features/contracts/services/contract-summary.ts`: RLS-visible 계약·계획·진척 조회
- `features/contracts/actions/save-contract.ts`: 계약 생성·날짜 변경 서버 액션
- `features/contracts/actions/save-plan.ts`: 자기 계획 변경 서버 액션
- `features/contracts/components/ContractSummary.tsx`: D-day·3상태·비통지 안내
- `features/contracts/components/NextActions.tsx`: 실제 데이터 기반 최대 3개 행동
- `features/contracts/components/ContractForm.tsx`: 권한 있는 중개사용 계약 날짜 폼
- `features/workspace/services/home-dashboard.ts`: 여러 집 우선순위 데이터 조합
- `features/workspace/components/HomeStart.tsx`: 전체 집 업무 홈
- `app/(app)/home/page.tsx`: 홈 서버 데이터 경계
- `app/(app)/homes/[homeId]/page.tsx`: 개별 집 홈 조합

### Task 1: 사용 목적과 실제 권한 분리

**Files:**
- Create: `supabase/migrations/202610130011_contract_lifecycle_home.sql`
- Create: `features/auth/domain/purpose.ts`
- Create: `features/auth/components/PurposePicker.tsx`
- Create: `features/auth/actions/save-purpose.ts`
- Modify: `features/auth/domain/profile.ts`
- Modify: `features/auth/domain/roles.ts`
- Modify: `features/auth/guards/require-onboarding.ts`
- Modify: `app/(app)/onboarding/role/page.tsx`
- Modify: `features/workspace/actions/create-office.ts`
- Modify: `app/(app)/my/page.tsx`
- Test: `tests/unit/auth/purpose.test.tsx`
- Test: `tests/unit/auth/profile.test.ts`
- Test: `tests/integration/auth/guards.test.ts`
- Test: `tests/integration/auth/usage-purpose-migration.test.ts`

**Produces:** `UsagePurpose`, `BrokerRole`, `parseUsageSelection()`, 목적을 포함한 `OnboardingProfile`, 목적·세부역할을 원자적으로 저장하는 `complete_usage_onboarding` RPC

- [x] **Step 1: 실패 테스트 작성** — 네 목적, broker 세부 역할 필수, management_other 무권한 완료, 목적 선택만으로 집 접근 SQL이 생기지 않음을 `TEST-ZH-LIFE-001-A~E`로 작성한다.
- [x] **Step 2: 실패 확인** — 목적 모듈·컬럼·RPC가 없어 테스트가 FAIL하는지 확인한다.
- [x] **Step 3: 최소 마이그레이션 구현** — `profiles.usage_purpose`, `associate_broker` 역할 허용, 기존 사용자 안전 백필, 조합 검증 RPC를 한 트랜잭션에 구현한다.
- [x] **Step 4: 도메인·가드 구현** — 온보딩 완료 조건을 `휴대전화+필수동의+목적+(broker면 세부 역할)`로 계산하고 `primaryRole`은 권한 판단용 보조 값으로 유지한다.
- [x] **Step 5: 목적 선택 UI 구현** — 네 카드, 공인중개사 세부 선택, `선택만으로 기록이 열리지 않음` 안내, 관리·기타 초대 안내를 모바일·PC 공통 흐름으로 만든다.
- [x] **Step 6: 기존 경계 회귀 확인** — 대표만 사무소 생성 가능하고 다른 목적·세부 역할은 우회할 수 없는지 확인한다.
- [x] **Step 7: 검사·커밋** — 관련 단위·통합 테스트와 `git diff --check`; `feat: separate usage purpose from access roles`.

### Task 2: 계약 날짜와 만기 계획 저장 경계

**Files:**
- Modify: `supabase/migrations/202610130011_contract_lifecycle_home.sql`
- Create: `features/contracts/schemas/contract.ts`
- Create: `features/contracts/actions/save-contract.ts`
- Create: `features/contracts/actions/save-plan.ts`
- Create: `features/contracts/services/save-contract.ts`
- Create: `features/contracts/services/save-plan.ts`
- Test: `tests/unit/contracts/contract-schema.test.ts`
- Test: `tests/unit/contracts/save-contract.test.ts`
- Test: `tests/unit/contracts/save-plan.test.ts`
- Test: `tests/integration/db/contract-lifecycle-policies.test.ts`
- Test: `tests/stress/contract-plan-idempotency.test.ts`

**Produces:** `upsert_active_contract_for_home`와 `set_own_contract_plan` RPC, 계약별 사용자 상태와 append-only 이벤트

- [ ] **Step 1: 실패 테스트 작성** — 날짜 역전·잘못된 상태 거부, 대표/소속 허용, 보조원·무관계자 거부, 임대인/임차인 자기 상태만 변경, 종료 계약 거부, 중복 제출 일관성을 `TEST-ZH-LIFE-003-A~H`로 작성한다.
- [ ] **Step 2: 실패 확인** — 신규 RPC·테이블이 없어 FAIL하는지 확인한다.
- [ ] **Step 3: 계약 저장 RPC 구현** — 집·사무소·활성 멤버십을 잠금 검증하고 계약 생성/날짜 변경과 감사 이벤트를 원자 처리한다.
- [ ] **Step 4: 계획 상태 RLS·RPC 구현** — 활성 현재 계약 관계와 subject=auth.uid를 검사하고 upsert와 이벤트 기록을 한 트랜잭션에서 처리한다.
- [ ] **Step 5: 서버 검증 계층 구현** — Zod로 날짜·UUID·상태를 검증하고 DB 내부 오류를 사용자에게 노출하지 않는 결과 코드로 변환한다.
- [ ] **Step 6: 회귀 보안 검사** — 이전 계약·종료 관계·다른 집 계약·주소 동일 집이 서로 분리되는지 확인한다.
- [ ] **Step 7: 검사·커밋** — 계약 단위·DB·스트레스 테스트; `feat: secure contract dates and expiry plans`.

### Task 3: D-day와 다음 행동 도메인

**Files:**
- Create: `features/contracts/domain/lifecycle.ts`
- Create: `tests/unit/contracts/lifecycle.test.ts`
- Modify: `vitest.config.ts`

**Produces:** `formatContractDay()`, `buildLifecycleProgress()`, `buildNextActions()`

- [ ] **Step 1: 실패 테스트 작성** — 만기일 없음, D-112, D-day, D+1, 한국 시간 날짜 경계, 완료 데이터 기반 최대 3개, 상태별 만기 준비를 `TEST-ZH-LIFE-003-I~L`, `TEST-ZH-LIFE-004-A~D`로 작성한다.
- [ ] **Step 2: 실패 확인** — 모듈 없음으로 FAIL하는지 확인한다.
- [ ] **Step 3: 날짜 계산 구현** — 시간대 영향 없이 `YYYY-MM-DD` 달력 날짜 차이를 계산하고 잘못된 날짜는 D-day를 숨긴다.
- [ ] **Step 4: 다음 행동 규칙 구현** — 계약 날짜, 계약 문서, 입주 사진, 열린 할 일, 계획 상태 등 실제 데이터만 보고 우선순위가 높은 3개 이하를 반환한다.
- [ ] **Step 5: 커버리지 포함** — 신규 계약 domain/schema/service를 coverage 대상에 추가한다.
- [ ] **Step 6: 검사·커밋** — 도메인 테스트와 경계값 검사; `feat: calculate contract lifecycle guidance`.

### Task 4: 안전한 계약 요약 데이터 서비스

**Files:**
- Create: `features/contracts/services/contract-summary.ts`
- Create: `features/workspace/services/home-dashboard.ts`
- Create: `tests/unit/contracts/contract-summary.test.ts`
- Create: `tests/unit/workspace/home-dashboard.test.ts`
- Modify: `app/(app)/home/page.tsx`
- Modify: `tests/unit/workspace/home-page-data.test.tsx`

**Produces:** 개별 `ContractHomeSummary`와 여러 집 `HomeDashboardResult`

- [ ] **Step 1: 실패 테스트 작성** — RLS-visible 활성 계약만 선택, 계약 없음을 오류와 구분, 알림 수와 채팅 미읽음 수 분리, 만기 임박→열린 할 일→최근 사용 순 정렬을 `TEST-ZH-DATA-001~006`으로 작성한다.
- [ ] **Step 2: 실패 확인** — 서비스 없음으로 FAIL하는지 확인한다.
- [ ] **Step 3: 개별 요약 로더 구현** — 집→활성 계약→본인 관계→당사자별 계획→실제 기록·열린 일 순으로 최소 컬럼만 조회한다.
- [ ] **Step 4: 전체 홈 로더 구현** — 여러 집을 한 번씩 조합하고 N+1 호출을 피하며 한 집 사용자는 해당 집 우선, 여러 집 사용자는 업무 우선순위를 반환한다.
- [ ] **Step 5: 오류 경계 구현** — DB 실패와 정상 빈 상태를 분리하고 내부 메시지를 숨긴다.
- [ ] **Step 6: 검사·커밋** — 데이터 서비스와 서버 페이지 테스트; `feat: load contract-centered home summaries`.

### Task 5: 개별 집 홈 UI와 계약 입력

**Files:**
- Create: `features/contracts/components/ContractSummary.tsx`
- Create: `features/contracts/components/NextActions.tsx`
- Create: `features/contracts/components/ContractForm.tsx`
- Create: `tests/unit/contracts/contract-summary-ui.test.tsx`
- Create: `tests/unit/contracts/next-actions.test.tsx`
- Create: `tests/unit/contracts/contract-form.test.tsx`
- Modify: `app/(app)/homes/[homeId]/page.tsx`
- Modify: `tests/unit/homes/home-pages.test.tsx`

**Produces:** 집 이름·마스킹 주소·D-day·3상태·비통지 안내·최대 3개 행동·네 단계 진행을 한 화면에 조합한 집 홈

- [ ] **Step 1: 실패 테스트 작성** — 3초 안에 읽을 상단 정보, 세 상태, 비통지 문구, 타인 상태 덮어쓰기 금지, 최대 3개 CTA, 역할별 계약 편집 노출, 빈 상태·오류 상태를 `TEST-ZH-UI-001~008`로 작성한다.
- [ ] **Step 2: 실패 확인** — 기존 대형 그라데이션 히어로와 계약 정보 부재로 FAIL하는지 확인한다.
- [ ] **Step 3: ContractSummary 구현** — 집 이름, 일부 마스킹 주소, D-day/날짜, 본인 상태 버튼, 상대 상태 읽기, 불일치 안내를 좁은 화면부터 구현한다.
- [ ] **Step 4: NextActions 구현** — 행동 하나당 이유·완료 기준·실제 경로 하나만 제공하고 3개를 넘기지 않는다.
- [ ] **Step 5: ContractForm 구현** — 허용된 중개사에게만 종류·시작일·만기일 폼을 보여주고 서버 오류·중복 제출·포커스 이동을 처리한다.
- [ ] **Step 6: 집 홈 재조합** — 기존 기록·첨부·집 채팅·사람 링크를 보존하면서 계약 요약→지금 할 일→집의 시간→최근 기록 순으로 재배치한다.
- [ ] **Step 7: 검사·커밋** — UI·서버 페이지 테스트; `feat: build the contract-centered home experience`.

### Task 6: 여러 집 업무 홈

**Files:**
- Modify: `features/workspace/components/HomeStart.tsx`
- Modify: `tests/unit/workspace/home-start.test.tsx`
- Modify: `features/navigation/components/AppNavigation.tsx`
- Modify: `tests/unit/navigation/app-navigation.test.tsx`

**Produces:** 한 집 사용자는 해당 집의 다음 행동, 여러 집 관리자는 오늘 확인할 집·만기 임박·답변 대기·가까운 일정·최근 집을 우선하는 `/home`

- [ ] **Step 1: 실패 테스트 작성** — 홍보형 설명 배너 제거, 한 집/여러 집 분기, 계약 D-day와 실제 행동, 목적별 안전한 빈 상태, 현재 메뉴를 `TEST-ZH-HOME-001~007`로 작성한다.
- [ ] **Step 2: 실패 확인** — 현재 마케팅형 `PlatformIntro` 때문에 FAIL하는지 확인한다.
- [ ] **Step 3: HomeStart 재구성** — 기능 설명 대신 실제 집과 업무 우선순위를 첫 화면에 두고, 집이 없으면 목적별로 `사무소 만들기` 또는 `초대 확인` 한 행동만 보여준다.
- [ ] **Step 4: 전역 내비게이션 정리** — 홈·집·추가·채팅·마이를 유지하고 추가 버튼은 가능한 실제 행동으로 연결한다.
- [ ] **Step 5: 검사·커밋** — 홈·내비게이션 테스트; `feat: prioritize real homes and deadlines`.

### Task 7: 전체 검증·문서·Preview

**Files:**
- Create: `tests/e2e/contract-lifecycle-home.spec.ts`
- Modify: `docs/traceability/release-candidate-v1.md`
- Modify: `docs/03-feature-definition.md`
- Modify: `docs/04-user-flow.md`
- Modify: `docs/05-authorization-model.md`
- Modify: `WORK_STATUS.md`
- Modify: `CONTINUE.md`
- Create: `docs/worklogs/2026-10-13-contract-home-phase-1-implementation.md`

**Produces:** 자동검사·실제 브라우저·문서 추적·Preview 승인 후보

- [ ] **Step 1: E2E 작성** — 가입→목적 선택→사무소/초대→집→계약 입력→D-day→자기 계획→새로고침 유지 흐름과 무권한 거부를 작성한다.
- [ ] **Step 2: 자동검사** — `npm test`, `npm run test:coverage`, `npm run typecheck`, `npm run build`; 네 커버리지 지표 80% 이상을 확인한다.
- [ ] **Step 3: 보안 검사** — 목적 선택만으로 접근 불가, 다른 집 계약 ID, 종료 관계, 보조원 계약 수정, 타인 계획 변경, 주소 동일 집 분리를 확인한다.
- [ ] **Step 4: 실제 브라우저 검수** — 320·390·768·1440px, 키보드, 색상 대비, 가로 넘침, 로딩·빈 화면·오류 화면, 콘솔·hydration 오류 0건을 확인한다.
- [ ] **Step 5: 독립 품질 게이트** — PRD·사용자 흐름·권한·개인정보·접근성·테스트 추적을 읽기 전용으로 검수하고 P0·P1을 수정한다.
- [ ] **Step 6: 문서·대화·작업기록 갱신** — 요구사항→소스→테스트→결과를 연결하고 바탕화면 `코덱스랑/집신`에 동일 구조로 동기화한다.
- [ ] **Step 7: Git·Preview** — 비밀정보 검사를 거쳐 기능 브랜치를 원격에 푸시하고 Vercel Preview만 확인한다.
- [ ] **Step 8: 사용자 승인 보고** — 사용할 수 있는 기능, 아직 없는 기능, 테스트 결과, Preview 주소, Production 전 승인 항목만 한 장으로 제출한다.

## 롤백

- 앱 롤백: 기능 브랜치 이전 Preview/커밋으로 되돌리고 기존 역할·집·기록 화면을 유지한다.
- DB 롤백: 새 컬럼·테이블을 즉시 삭제하지 않고 신규 RPC 권한을 회수해 쓰기를 중단한다. 기존 계약·기록·관계 데이터는 보존한다.
- 목적 값은 접근 권한에 사용하지 않으므로 표시 기능을 꺼도 기존 RLS 경계가 유지된다.
- 계획 상태는 별도 테이블이므로 기존 계약 행을 훼손하지 않는다.

## 자체 검토 결과

- `ZH-LIFE-001`: Tasks 1·6·7에 연결된다.
- `ZH-LIFE-003`: Tasks 2·3·4·5·7에 연결된다.
- `ZH-LIFE-004`: Tasks 3·4·5·6·7에 연결된다.
- 사용 목적을 권한으로 쓰지 않는 구조, 임대인·임차인 상태 분리, 법적 통지가 아닌 안내, 실제 데이터만 완료 처리하는 기준이 모두 테스트 항목에 포함됐다.
- 아직 정책이 정해지지 않은 개인 집 자동 연결, 대리 입력, 외부 알림, 보관기간은 코드 범위에서 제외했다.
