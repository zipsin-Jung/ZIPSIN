# Public Home Four-Story Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 확정한 네 장의 이미지를 공개 메인 `/`에 적용해, 집신의 의미를 첫 화면에서 이해하고 직접 가입으로 이동할 수 있는 접근 가능한 스토리 캐러셀을 완성한다.

**Architecture:** `PublicHome`은 Server Component로 유지하고, 상태·타이머·포인터 입력이 필요한 `HomeStoryCarousel`만 Client Component로 격리한다. 네 장의 카피·이미지·제품 증거는 하나의 데이터 배열을 원천으로 사용하며, 기존 Hero와 `ScenarioExplorer`의 중복은 하나의 캐러셀로 통합한다.

**Tech Stack:** Next.js 16.4 App Router, React 19, TypeScript, CSS Modules, `next/image`, Vitest + Testing Library, Playwright + axe

**Spec:** `docs/superpowers/specs/2026-10-14-public-home-story-carousel-design.md`

## Global Constraints

- 네 장의 순서는 `모인다 → 이어진다 → 연결된다 → 가치가 된다`로 고정한다.
- 승인 원본 네 장만 프로젝트 자산으로 복사하고 임시 경로를 런타임에서 참조하지 않는다.
- 첫 장은 7초 뒤 2장으로 넘어가며 4장까지 한 번만 자동재생하고 멈춘다.
- 점 hover는 250ms 후 선택하며 click·tap·키보드·swipe 같은 명시적 조작 후에는 재생 버튼 전까지 자동재생하지 않는다.
- `prefers-reduced-motion: reduce`에서는 자동재생과 이동·회전 애니메이션을 끈다.
- 카카오톡·문자·통화 이력 연동 또는 자동 가져오기를 표현하거나 구현하지 않는다.
- 주소만으로 기록 열람, 법적 검증, 하자 없음, 자산 가격 상승을 보장하지 않는다.
- 외부 캐러셀 패키지, 3D page-curl, 영상, 소리, Production 배포를 추가하지 않는다.
- 320·390·768·1440px에서 가로 넘침이 없어야 하며 조작 버튼은 최소 44×44px이어야 한다.
- 첫 장만 우선 로드하고 나머지는 지연 로드한다. 이미지 실패 시 문구·제품 UI·가입 CTA는 남는다.

## File Structure

- `features/public-home/scenarios.ts`: 네 장의 고정 카피·이미지·제품 증거 타입을 제공한다.
- `features/public-home/components/HomeStoryCarousel.tsx`: 자동재생, 점·화살표·키보드·swipe, pause, 이미지 실패와 접근성 상태를 담당한다.
- `features/public-home/components/ProductEvidence.tsx`: 선택 장면에 대응하는 실제 집신 제품 예시를 표시하되 동작하지 않는 가짜 버튼을 만들지 않는다.
- `components/PublicHome.tsx`: 공개 홈 서버 구조와 실제 `/signup`, `/login`, `/support` 경로를 유지하고 캐러셀을 한 번만 배치한다.
- `components/PublicHome.module.css`: 네 장 무대, 전환, 반응형, 포커스, reduced-motion과 이미지 폴백을 담당한다.
- `public/images/public-home/story-*.png`: 사용자 확정 이미지 네 장의 영구 공개 자산이다.
- `tests/unit/features/public-home/home-story-carousel.test.tsx`: 전환 상태와 실패·접근성 경계를 검증한다.
- `tests/unit/navigation/public-home.test.tsx`: 공개 홈 카피·경로·중복 제거·제품 기능 경계를 검증한다.
- `tests/e2e/landing.spec.ts`, `tests/e2e/release-responsive-accessibility.spec.ts`: 실제 브라우저에서 가입 이동, 제어, 반응형, axe, console·hydration 오류를 검증한다.

## Review Focus

- 탭이 숨겨졌다 다시 보일 때 남은 시간을 이어가지 말고 새 7초 주기로 재생하며, 수동 모드였다면 재생하지 않는다 — Task 2 timer test.
- hover 점을 250ms 전에 벗어나면 장면이 바뀌지 않고, 250ms를 채운 한 점만 선택된다 — Task 2 fake-timer test.
- 수동 조작 뒤 hover·focus가 풀려도 자동재생이 몰래 재개되지 않는다 — Task 2 manual-mode test.
- reduced-motion 사용자는 첫 장을 정적으로 보고 수동 버튼으로만 즉시 전환한다 — Task 2 media-query test와 Task 4 E2E.
- 이미지 로딩 실패나 작은 화면 swipe에서도 카피·제품 증거·가입 CTA가 사라지거나 세로 스크롤이 가로 제스처로 오인되지 않는다 — Task 2 fallback/swipe test와 Task 4 E2E.

---

### Task 1: 네 장 데이터와 제품 증거를 테스트로 고정

**Files:**
- Modify: `features/public-home/scenarios.ts`
- Modify: `features/public-home/components/ProductEvidence.tsx`
- Modify: `tests/unit/navigation/public-home.test.tsx`

**Interfaces:**
- Produces: `HomeStoryId = 'gather' | 'continuity' | 'communication' | 'home-history'`
- Produces: `EvidenceType = 'gather' | 'continuity' | 'communication' | 'home-history'`
- Produces: `PublicHomeStory { id, shortTitle, headline, description, conclusion?, evidenceType, imageSrc, imageAlt }`
- Produces: `publicHomeStories: readonly PublicHomeStory[]`
- Produces: `ProductEvidence({ story }: { story: PublicHomeStory })`

- [ ] **Step 1: 기존 공개 홈 단위 테스트를 새 네 장 계약으로 변경해 실패를 확인한다**

  `TEST-RC-HERO-STORY-001`은 정확히 네 장, 순서 `모인다·이어진다·연결된다·가치가 된다`, 첫 문장 `집에 관한 모든 일, 이제 집신으로.`을 검사한다. `TEST-RC-HERO-SAFE-001`은 `카카오톡 연동`, `자동 가져오기`, `검증된 집`, `가치 상승 보장` 문구가 없고 3장에 `집별 연락처`, `집신 채팅`, `초대`가 있는지 검사한다.

- [ ] **Step 2: 실패 테스트를 실행한다**

  Run: `npm test -- tests/unit/navigation/public-home.test.tsx`

  Expected: 기존 탭·카피·evidence 타입 때문에 FAIL.

- [ ] **Step 3: `publicHomeStories`와 네 종류 `ProductEvidence`를 최소 구현한다**

  1장은 `사진·문서·대화·일정`, 2장은 `입주 사진→문서→수리→일정→접근 종료→새 관계`, 3장은 `직접 초대→집별 연락처→집신 채팅→새 기록`, 4장은 `입주→확인→교체→수리→현재`만 보여준다. 3장에는 외부 기록이 자동 수집되지 않는다는 짧은 안내를 포함하고, 모든 제품 예시는 비동작 표현 요소로 렌더링한다.

- [ ] **Step 4: 단위 테스트를 다시 실행한다**

  Run: `npm test -- tests/unit/navigation/public-home.test.tsx`

  Expected: 새 콘텐츠 관련 테스트 PASS.

- [ ] **Step 5: 첫 구현 단위를 커밋한다**

  ```bash
  git add features/public-home/scenarios.ts features/public-home/components/ProductEvidence.tsx tests/unit/navigation/public-home.test.tsx
  git commit -m "feat: define public home story content"
  ```

### Task 2: 접근 가능한 캐러셀 상호작용 구현

**Files:**
- Create: `features/public-home/components/HomeStoryCarousel.tsx`
- Create: `tests/unit/features/public-home/home-story-carousel.test.tsx`
- Preserve but stop importing: `features/public-home/components/ScenarioExplorer.tsx`

**Interfaces:**
- Consumes: `publicHomeStories`, `PublicHomeStory`, `ProductEvidence({ story })` from Task 1.
- Produces: `HomeStoryCarousel(): JSX.Element`
- Internal constants: `AUTOPLAY_MS = 7000`, `HOVER_SELECT_MS = 250`, `HOVER_RESUME_MS = 1500`, `SWIPE_THRESHOLD_PX = 48`

- [ ] **Step 1: 첫 장 SSR·접근성·수동 제어 실패 테스트를 작성한다**

  `TEST-RC-HERO-A11Y-001`은 이름 있는 carousel region, `1 / 4`, 이전·다음·재생/일시정지 버튼, 네 목차 버튼과 첫 CTA를 검사하고 inactive 장면이 읽기·탭 순서에서 제외되는지 확인한다. `TEST-RC-HERO-MANUAL-001`은 click, ArrowLeft/Right, Home, End가 선택 장면만 바꾸고 포커스를 강제로 옮기지 않으며 첫 장의 이전·마지막 장의 다음 버튼이 disabled인지 검사한다.

- [ ] **Step 2: 자동재생과 중지 조건의 fake-timer 실패 테스트를 작성한다**

  `TEST-RC-HERO-AUTO-001`은 7초마다 1→2→3→4 한 번 이동 후 멈춤, `TEST-RC-HERO-HOVER-001`은 249ms에는 유지·250ms에는 선택·이탈 시 예약 취소, carousel hover 해제 1.5초 뒤의 재개를 검사한다. `TEST-RC-HERO-FOCUS-001`은 focus-within 동안 pause와 focus 이탈 후 1.5초 재개, `TEST-RC-HERO-MANUAL-002`는 수동 조작 후 시간 경과·hover/focus 해제에도 정지, `TEST-RC-HERO-VISIBILITY-001`은 문서 숨김 pause와 visible 복귀 새 주기를 검사한다.

- [ ] **Step 3: reduced-motion·swipe·이미지 실패의 실패 테스트를 작성한다**

  `TEST-RC-HERO-MOTION-001`은 reduced-motion에서 자동재생 없음, `TEST-RC-HERO-SWIPE-001`은 수평 48px 이상만 이동하고 세로 우세 제스처는 무시, `TEST-RC-HERO-ERROR-001`은 이미지 오류 뒤에도 headline·evidence·`/signup` CTA가 남는지 검사한다.

- [ ] **Step 4: 새 단위 테스트가 구현 부재로 실패하는지 확인한다**

  Run: `npm test -- tests/unit/features/public-home/home-story-carousel.test.tsx`

  Expected: `HomeStoryCarousel` module not found 또는 요구 동작 미구현으로 FAIL.

- [ ] **Step 5: `HomeStoryCarousel`을 최소 Client Component로 구현한다**

  선택 index, autoplay 여부, manual 여부, pause 원인, 이미지 실패 ID, pointer 시작 좌표를 컴포넌트 내부 상태·ref로 관리한다. inactive slide는 `hidden` 또는 `aria-hidden`과 `inert`로 읽기·탭 순서에서 제외하고, 자동 변경을 live region으로 반복 낭독하지 않는다. 첫 장 이미지에만 `priority`를 적용한다.

- [ ] **Step 6: 새 캐러셀 단위 테스트를 통과시킨다**

  Run: `npm test -- tests/unit/features/public-home/home-story-carousel.test.tsx`

  Expected: 모든 캐러셀 상태 테스트 PASS, 열린 timer 경고 없음.

- [ ] **Step 7: 상호작용 구현 단위를 커밋한다**

  ```bash
  git add features/public-home/components/HomeStoryCarousel.tsx tests/unit/features/public-home/home-story-carousel.test.tsx
  git commit -m "feat: add accessible home story carousel"
  ```

### Task 3: 승인 이미지와 공개 홈 레이아웃 통합

**Files:**
- Create: `public/images/public-home/story-01-gather.png`
- Create: `public/images/public-home/story-02-continuity.png`
- Create: `public/images/public-home/story-03-communication.png`
- Create: `public/images/public-home/story-04-home-history.png`
- Modify: `components/PublicHome.tsx`
- Modify: `components/PublicHome.module.css`
- Modify: `features/public-home/scenarios.ts`
- Modify: `tests/unit/navigation/public-home.test.tsx`
- Preserve but stop importing: `features/public-home/components/ScenarioExplorer.tsx`

**Interfaces:**
- Consumes: `HomeStoryCarousel()` from Task 2.
- Produces: 공개 `/`의 단일 Hero/story stage, 실제 `/signup`, `/login`, `/support` 링크와 중복 없는 하단 설명.

- [ ] **Step 1: 중복 제거와 실제 경로를 고정하는 실패 테스트를 추가한다**

  `TEST-RC-HERO-INTEGRATION-001`은 carousel이 한 번만 존재하고 옛 `이런 순간에 집신` 탭 UI와 Hero 제품 카드가 중복되지 않는지 검사한다. `TEST-RC-PUB-003`은 로그인·웹 시작·고객지원 경로와 가짜 앱 다운로드 부재를 유지한다.

- [ ] **Step 2: 변경한 공개 홈 테스트가 실패하는지 확인한다**

  Run: `npm test -- tests/unit/navigation/public-home.test.tsx`

  Expected: 기존 Hero와 ScenarioExplorer 중복 때문에 FAIL.

- [ ] **Step 3: 사용자 확정 원본 네 장을 영구 자산명으로 복사하고 크기를 확인한다**

  Source 1: `/var/folders/38/66fqc8v92m5g_g6w_h7jxctw0000gn/T/codex-clipboard-6e758a35-5e66-428a-b95a-f281849a8ca7.png`

  Source 2: `/var/folders/38/66fqc8v92m5g_g6w_h7jxctw0000gn/T/codex-clipboard-c184b1af-c293-4565-88c2-961a993b65e6.png`

  Source 3: `/var/folders/38/66fqc8v92m5g_g6w_h7jxctw0000gn/T/codex-clipboard-12d2cfde-16c8-4f1f-9e05-ba68aa1938dc.png`

  Source 4: `/var/folders/38/66fqc8v92m5g_g6w_h7jxctw0000gn/T/codex-clipboard-2d06aee4-eae2-44f5-bd28-dc58ba015fd4.png`

  Verify: `sips -g pixelWidth -g pixelHeight public/images/public-home/story-*.png`

- [ ] **Step 4: `PublicHome`을 단일 캐러셀 구조로 통합한다**

  현재 header/footer, 개인정보 원칙, 이용 방법과 최종 CTA는 보존한다. 기존 Hero 이미지·제품 카드와 별도 `ScenarioExplorer` section은 제거하고 intro 안에 `HomeStoryCarousel`을 한 번 배치한다.

- [ ] **Step 5: 네 장 전용 CSS와 반응형 레이아웃을 구현한다**

  데스크톱은 카피와 이미지·evidence를 나란히, 모바일은 카피→이미지→evidence→CTA 순서로 쌓는다. 첫 세로 이미지는 `object-fit: contain`으로 자르지 않고, 2~4장 wide 이미지는 고정 aspect stage 안에서 핵심이 보이도록 한다. 모션, 44px 버튼, focus-visible, 이미지 폴백, `prefers-reduced-motion`을 포함한다.

- [ ] **Step 6: 통합 단위 테스트와 정적 자산 경로를 확인한다**

  Run: `npm test -- tests/unit/navigation/public-home.test.tsx tests/unit/features/public-home/home-story-carousel.test.tsx`

  Expected: PASS, 네 이미지 경로가 모두 `public/images/public-home/story-*`를 가리킴.

- [ ] **Step 7: 화면 통합 단위를 커밋한다**

  ```bash
  git add components/PublicHome.tsx components/PublicHome.module.css features/public-home public/images/public-home/story-*.png tests/unit
  git commit -m "feat: integrate four-story public home"
  ```

### Task 4: 실제 브라우저 반응형·접근성 시나리오 완성

**Files:**
- Modify: `tests/e2e/landing.spec.ts`
- Modify: `tests/e2e/release-responsive-accessibility.spec.ts`

**Interfaces:**
- Consumes: 공개 `/`의 carousel region과 이름 있는 controls.
- Produces: 320·390·768·1440px, reduced-motion, 수동 조작, 가입 이동, console·hydration·axe·overflow 검증.

- [ ] **Step 1: 새 네 장과 가입 경로 E2E를 작성해 실패를 확인한다**

  첫 장 headline·승인 이미지 alt, 다음 버튼으로 2장, 3장의 `집신 채팅`, End 키로 4장의 `위치와 서류만 보고 계신가요?`, 첫 `/signup` 이동을 검사한다. JavaScript를 끈 별도 context에서도 첫 장 headline과 `/signup` CTA가 서버 HTML로 보이는지 검사한다.

- [ ] **Step 2: 네 viewport에서 제어 크기·overflow·axe·console 실패를 검사한다**

  각 viewport에서 carousel 존재, 버튼 44px, 수동 이동 후 선택 유지, 네 장의 무대 높이 차이 ≤2px, layout-shift 합계 ≤0.1, 문서 가로 넘침 ≤1px, axe 위반 0, console/pageerror 0을 검사하고 screenshot을 남긴다.

- [ ] **Step 3: reduced-motion과 모바일 swipe E2E를 추가한다**

  reduced-motion에서 8초 후에도 1장 유지, 모바일 390px에서 수평 swipe로 2장 이동, 세로 우세 gesture에서는 장면 유지 여부를 검사한다.

- [ ] **Step 4: E2E를 실행하고 실패 원인만 제품 코드에서 수정한다**

  Run: `npx playwright test tests/e2e/landing.spec.ts tests/e2e/release-responsive-accessibility.spec.ts --project=chromium`

  Expected: 모든 로컬 Chromium 시나리오 PASS.

- [ ] **Step 5: 브라우저 검수 단위를 커밋한다**

  ```bash
  git add tests/e2e/landing.spec.ts tests/e2e/release-responsive-accessibility.spec.ts components/PublicHome.module.css features/public-home/components/HomeStoryCarousel.tsx
  git commit -m "test: verify public home carousel journeys"
  ```

### Task 5: 전체 품질 게이트, 문서 동기화와 Preview 제출

**Files:**
- Modify: `docs/superpowers/specs/2026-10-14-public-home-story-carousel-design.md`
- Modify: `docs/decisions/DEC-023-public-home-four-story-carousel.md`
- Modify: `docs/conversations/2026-10-14-public-home-story-carousel.md`
- Modify: `docs/worklogs/2026-10-14-public-home-story-carousel-planning.md`
- Create: `docs/worklogs/2026-10-14-public-home-story-carousel-implementation.md`
- Modify: `WORK_STATUS.md`
- Modify or Create: `docs/traceability/public-home-four-story-carousel.md`

**Interfaces:**
- Consumes: Tasks 1–4의 소스·테스트 결과.
- Produces: 요구사항→소스→테스트 추적표, 바탕화면 문서 사본, GitHub branch, Vercel Preview URL과 한 장 완료 보고.

- [ ] **Step 1: 정적 품질과 전체 자동 검증을 실행한다**

  Run in order:

  ```bash
  npm run typecheck
  npm test
  npm run test:coverage
  npm run build
  npx playwright test --project=chromium
  git diff --check
  ```

  Expected: 타입 오류 0, 전체 단위·통합 PASS, statements·branches·functions·lines 각각 80% 이상, build 성공, 로컬 Chromium PASS, whitespace 오류 0.

- [ ] **Step 2: 실제 브라우저에서 네 viewport와 네 장을 시각 검수한다**

  각 viewport에서 이미지 잘림·텍스트 대비·초점 표시·height jump·가로 넘침·자동재생 방해·console/hydration 오류를 확인한다. 빌드 성공과 브라우저 검수 성공을 별도로 기록한다.

- [ ] **Step 3: 추적표·결정·대화·작업기록·WORK_STATUS를 실제 결과로 갱신한다**

  각 RC/AC를 소스 파일과 테스트 이름에 연결하고, 사용할 수 있는 기능·사용할 수 없는 기능·검증 수치·남은 외부 조건을 사실대로 기록한다.

- [ ] **Step 4: 문서만 같은 구조로 바탕화면 집신 폴더에 동기화한다**

  Destination: `/Users/zipsin/Desktop/코덱스랑/집신/`

  개인정보·인증정보·실제 계약 원본이 없는지 확인한 뒤 관련 문서 경로를 보존해 복사한다.

- [ ] **Step 5: 최종 변경 검토 후 Git 커밋·GitHub push한다**

  ```bash
  git status --short
  git diff --stat
  git add WORK_STATUS.md docs
  git commit -m "docs: record public home carousel delivery"
  git push origin codex/contract-to-expiry-home
  ```

- [ ] **Step 6: 새 Vercel Preview만 확인하고 Production은 건드리지 않는다**

  자동 생성된 branch Preview가 Ready인지 확인한 뒤 `/`, `/signup`, `/login`, `/support`와 네 carousel 장면을 실제 브라우저로 확인한다. Production alias·도메인·환경변수는 변경하지 않는다.

- [ ] **Step 7: 사용자에게 한 장 보고로 제출한다**

  다음 다섯 항목만 쉽게 보고한다: 실제로 사용할 수 있는 기능, 아직 사용할 수 없는 기능, 테스트 결과, Preview 주소, Production 전에 승인할 항목.

