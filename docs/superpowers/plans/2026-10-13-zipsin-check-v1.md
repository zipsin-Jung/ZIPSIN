# ZIPSIN Check V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, and superpowers:test-driven-development for every behavior change.

**Goal:** 비회원이 `/check`에서 빠른 또는 꼼꼼한 방식으로 집을 확인하고, 이유를 배우며, 결과 요약과 최대 3채 비교까지 완료하는 로컬 저장형 V1을 구현합니다.

**Architecture:** 기존 Next.js 정적 export를 유지합니다. 도메인 규칙은 `lib/zipsin-check`의 순수 함수로, 화면은 `components/zipsin-check`의 클라이언트 컴포넌트로 분리하고, 버전형 `localStorage` 어댑터로만 저장합니다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Vitest, Testing Library, jsdom

**Spec:** `docs/19-zipsin-check-v1-product-spec.md`, `docs/21-zipsin-check-v1-technical-spec.md`, `docs/decisions/DEC-016-zipsin-check-local-first-v1.md`

## Global Constraints

- 실제 가입, 서버 저장, 사진, 정확 주소, 외부 조회를 만들지 않습니다.
- 실패 테스트를 먼저 확인한 뒤 최소 구현하고 다시 통과시킵니다.
- 기존 랜딩과 `/demo`를 변경하지 않으며 필요한 진입 링크만 별도 승인 범위에서 추가합니다.
- 사용자 데이터는 삭제하지 않고 후보 제외·복원을 사용합니다.
- 새 집신체크 제품 코드 네 가지 커버리지 지표를 각각 80% 이상으로 유지합니다.

## Review Focus

- 빠른/꼼꼼 모드가 같은 공통 핵심을 유지하는지
- `주의`와 `미확인`이 점수에 묻히지 않는지
- 설명이 체크 진행을 막지 않고 키보드로 동작하는지
- 로컬 저장 오류와 손상 상태에서 기존 화면이 사라지지 않는지
- 가입·저장 기능이 실제 구현된 것처럼 오인되지 않는지

---

### Task 1: 도메인 타입과 체크 카탈로그

**Files:**
- Create: `lib/zipsin-check/types.ts`
- Create: `lib/zipsin-check/catalog.ts`
- Test: `lib/zipsin-check/catalog.test.ts`

1. 공통 핵심 ID가 두 깊이에서 같고 모든 항목에 `why/how/question/nextAction`이 있다는 실패 테스트를 작성합니다.
2. `npm test -- lib/zipsin-check/catalog.test.ts`로 모듈 부재 실패를 확인합니다.
3. 깊이·상태·출처·항목·후보 타입과 최소 카탈로그를 구현합니다.
4. 같은 명령으로 테스트 통과를 확인합니다.
5. `git diff --check` 후 해당 파일만 커밋합니다.

### Task 2: 상태 전환·요약·비교 규칙

**Files:**
- Create: `lib/zipsin-check/state.ts`
- Test: `lib/zipsin-check/state.test.ts`

1. `createCandidate`, `answerItem`, `switchDepth`, `buildSummary`, `compareCandidates`, `archiveCandidate`, `restoreCandidate`, 위험정보 검사에 대한 실패 테스트를 작성합니다.
2. `npm test -- lib/zipsin-check/state.test.ts`에서 실패 원인을 확인합니다.
3. 답 보존, 건너뜀의 미확인 처리, 주의 비상쇄, 공통 핵심 비교, 최대 3개 활성 후보, soft archive를 순수 함수로 구현합니다.
4. 테스트를 다시 실행해 모든 분기를 통과시킵니다.
5. 타입검사 후 해당 파일만 커밋합니다.

### Task 3: 버전형 로컬 저장

**Files:**
- Create: `lib/zipsin-check/storage.ts`
- Test: `lib/zipsin-check/storage.test.ts`

1. 정상 저장·복원, 접근 실패, 손상 JSON, 다른 스키마, 저장 용량 오류 테스트를 먼저 작성합니다.
2. `npm test -- lib/zipsin-check/storage.test.ts`의 실패를 확인합니다.
3. `zipsin-check:v1` 키와 검증 결과 타입을 구현하되 손상 원본을 자동 삭제하지 않습니다.
4. 테스트와 타입검사를 통과시킵니다.
5. 해당 파일만 커밋합니다.

### Task 4: `/check` 시작 화면과 앱 뼈대

**Files:**
- Create: `app/check/page.tsx`
- Create: `components/zipsin-check/ZipsinCheckApp.tsx`
- Create: `components/zipsin-check/CheckStart.tsx`
- Create: `components/zipsin-check/ZipsinCheck.module.css`
- Test: `components/zipsin-check/ZipsinCheckApp.test.tsx`

1. 빠른/꼼꼼 선택, 예상 시간, 별칭 건너뛰기, 복구 상태에 대한 컴포넌트 실패 테스트를 작성합니다.
2. 대상 테스트가 실패하는 것을 확인합니다.
3. 모바일 우선 시작 화면과 상태 전환 뼈대를 구현합니다.
4. 접근 가능한 이름과 최소 44px 조작 영역을 검증하고 테스트·타입검사를 통과시킵니다.
5. 해당 파일만 커밋합니다.

### Task 5: 체크 진행과 단계형 설명

**Files:**
- Create: `components/zipsin-check/CheckFlow.tsx`
- Modify: `components/zipsin-check/ZipsinCheckApp.tsx`
- Modify: `components/zipsin-check/ZipsinCheck.module.css`
- Test: `components/zipsin-check/CheckFlow.test.tsx`

1. 상태·출처 선택, 모드 전환 답 보존, 설명 기본 접힘, `aria-expanded`, 미응답 완료와 위험 메모 차단 테스트를 작성합니다.
2. 실패를 확인한 뒤 한 화면 한 항목의 최소 UI를 구현합니다.
3. 화면 전환 포커스, 키보드 조작, 동작 줄이기 스타일을 추가합니다.
4. 대상 테스트와 타입검사를 통과시킵니다.
5. 해당 파일만 커밋합니다.

### Task 6: 방문 요약과 후보 비교

**Files:**
- Create: `components/zipsin-check/CheckSummary.tsx`
- Create: `components/zipsin-check/CheckCompare.tsx`
- Modify: `components/zipsin-check/ZipsinCheckApp.tsx`
- Modify: `components/zipsin-check/ZipsinCheck.module.css`
- Test: `components/zipsin-check/CheckSummary.test.tsx`
- Test: `components/zipsin-check/CheckCompare.test.tsx`

1. 주의 독립 노출, 미확인 다음 행동, 면책 문구, 다른 깊이의 공통 축 비교, 추가 항목 비평가 테스트를 작성합니다.
2. 실패를 확인하고 요약·최대 3채 비교 UI를 구현합니다.
3. 색상 외 문구·아이콘으로 상태를 구분합니다.
4. 대상 테스트와 타입검사를 통과시킵니다.
5. 해당 파일만 커밋합니다.

### Task 7: 저장 복구와 가입 안내 시나리오

**Files:**
- Modify: `components/zipsin-check/ZipsinCheckApp.tsx`
- Modify: `components/zipsin-check/ZipsinCheckApp.test.tsx`

1. 새로고침 복구, 저장 실패 시 현재 답 유지, 후보 제외·복원, `/#signup` 안내와 “현재 계정 저장 아님” 문구 테스트를 먼저 작성합니다.
2. 실패를 확인하고 저장 어댑터를 앱에 연결합니다.
3. 첫 방문과 저장 복구 흐름을 모두 통과시킵니다.
4. 대상 테스트와 타입검사를 통과시킵니다.
5. 해당 파일만 커밋합니다.

### Task 8: 커버리지·회귀·실제 브라우저 검수

**Files:**
- Modify: `vitest.config.mjs`
- Modify: `docs/19-zipsin-check-v1-product-spec.md`
- Create: `docs/worklogs/2026-10-13-zipsin-check-v1-implementation.md`
- Modify: `WORK_STATUS.md`

1. 커버리지 수집 대상에 집신체크 제품 코드를 추가하고 네 지표 80% 문턱을 설정합니다.
2. `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, `git diff --check`를 실행합니다.
3. 실제 미리보기 서버에서 `/`, `/demo`, `/check` HTTP 응답을 확인합니다.
4. 브라우저로 `/check`의 빠른 완주, 꼼꼼→빠른 전환, 서로 다른 깊이 비교, 새로고침 복구를 실행합니다.
5. 320px, 390px, 데스크톱에서 가로 넘침·포커스·44px 조작 영역을 확인합니다.
6. 제품 명세 추적표에 요구사항↔소스↔테스트↔실행 증거를 기록하고, 빌드와 브라우저 검수 결과를 구분해 작업일지를 작성합니다.
7. 독립 품질 검수와 수정·재검수를 거친 뒤 `검수 통과, 사용자 승인 대기`로 보고합니다.
8. 관련 문서를 바탕화면 문서함에 복사하고, 민감정보 검사를 거쳐 안전한 Git 변경만 커밋·푸시합니다.
