# 공개 홈 웹앱 설치·시네마틱 모션 구현계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 홈에 실제 PWA 설치 진입을 추가하고 승인 이미지 네 장을 서로 다른 1회성 모션으로 선명하게 보여준다.

**Architecture:** 설치 기능은 Manifest, 순수 상태 판별, Client 설치 버튼과 네이티브 dialog로 분리한다. 캐러셀은 기존 가로 이동·접근성 구조를 보존하고, 이미지 전경·확장 배경과 `data-story`별 CSS 모션만 추가한다. 서비스 워커·오프라인 캐시·외부 PWA 패키지는 사용하지 않는다.

**Tech Stack:** Next.js 16.4 App Router, React 19, TypeScript, CSS Modules, Vitest, Testing Library, Playwright, axe, Sharp(설치된 Next.js 의존성으로 아이콘 1회 생성)

**Spec:** `docs/superpowers/specs/2026-10-14-public-home-install-motion-design.md`

## Global Constraints

- 기존 `/`의 단일 viewport와 4장 가로 캐러셀을 유지한다.
- 기존 `/login`, `/signup`, 카카오 문의와 로그인 뒤 제품을 변경하지 않는다.
- 지원 Chromium에서만 사용자 클릭 뒤 설치 프롬프트를 호출한다.
- iOS·미지원 브라우저는 정확한 설치 안내를 제공하고 성공을 가장하지 않는다.
- 서비스 워커, 오프라인 캐시, 푸시, 앱스토어 배지, QR과 네이티브 앱 표현을 추가하지 않는다.
- 모든 장면 모션은 활성화 때 한 번 실행하고 3.5초 안에 정지한다.
- `prefers-reduced-motion: reduce`에서는 모션과 자동재생을 중지하고 완성 상태를 즉시 표시한다.
- 320·390·768·1440px에서 문서 overflow 1px 이하, 조작 대상 44px 이상, CLS 0.1 이하를 유지한다.
- 사용자 승인 전 Production을 변경하지 않는다.

## Review Focus

- `beforeinstallprompt`가 늦게 도착하거나 오지 않을 때 버튼이 무반응이 아니라 안내로 전환되는지 Task 2 단위 테스트로 고정한다.
- 사용자가 설치를 취소했을 때 `앱 설치됨`으로 거짓 표시하지 않는지 Task 2 단위 테스트로 고정한다.
- iPadOS가 데스크톱 user agent를 사용하는 경우 touch point와 플랫폼을 함께 보고 iOS 안내로 분기하는지 Task 2 단위 테스트로 고정한다.
- 첫 세로 이미지의 시작·종료 crop이 320·390·768·1440px에서 핵심 내용을 가리지 않는지 Task 5 시각·경계 E2E로 고정한다.
- 애니메이션 재선택·자동재생·사용자 수동 조작이 충돌하지 않는지 Task 4 단위 테스트와 Task 5 E2E로 고정한다.

## Requirement Coverage

| 요구사항 | 구현 작업 | 대표 검증 |
|---|---|---|
| REQ-PUB-INSTALL-001 | Task 3 | TEST-PUB-INSTALL-CTA-001, 4개 viewport 헤더 경계 |
| REQ-PUB-INSTALL-002 | Task 2 | TEST-PWA-INSTALL/CHOICE/IOS/FALLBACK/STANDALONE |
| REQ-PUB-INSTALL-003 | Task 1 | TEST-PWA-MANIFEST-001, Preview manifest 200 |
| REQ-PUB-VISUAL-001 | Task 4·5 | TEST-PUB-IMAGE-VIS-320/390/768/1440 |
| REQ-PUB-MOTION-001 | Task 4·5 | TEST-PUB-ANIM-001~004, TEST-PUB-ANIM-REDUCE-001 |
| REQ-PUB-A11Y-001·REQ-PUB-SAFE-001 | Task 2·5·6 | dialog focus, axe·console·CLS, Preview 실제 검수 |

---

### Task 1: 설치 Manifest와 브랜드 아이콘

**Files:**
- Create: `app/manifest.ts`
- Create: `public/icons/zipsin-app-192.png`
- Create: `public/icons/zipsin-app-512.png`
- Create: `public/icons/zipsin-apple-touch.png`
- Modify: `app/layout.tsx`
- Test: `tests/unit/app/manifest.test.ts`

**Interfaces:**
- Consumes: 기존 `/` 진입과 `public/icon.svg` 브랜드 색상·형태.
- Produces: `manifest(): MetadataRoute.Manifest`, `/manifest.webmanifest`, 192·512·180px 설치 아이콘과 Apple web app metadata.

- [ ] **Step 1: `TEST-PWA-MANIFEST-001` 실패 테스트 작성**

`manifest()`가 `name: '집신 ZIPSIN'`, `short_name: '집신'`, `id/start_url/scope: '/'`, `display: 'standalone'`, 딥그린 theme와 192·512 아이콘을 반환하는지 검사한다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/app/manifest.test.ts`

Expected: `app/manifest.ts` 미존재 또는 기대 필드 불일치로 FAIL.

- [ ] **Step 3: Manifest와 아이콘 최소 구현**

`public/icon.svg`를 입력으로 설치된 `sharp`를 사용해 192×192, 512×512, 180×180 PNG를 1회 생성한다. `app/manifest.ts`에 아이콘 경로와 512px `purpose: 'any maskable'`을 정의한다. `app/layout.tsx`의 `metadata`에는 manifest·appleWebApp·apple touch icon을, 별도 `Viewport` export에는 themeColor를 연결해 Next.js 16.4의 메타데이터 규칙을 따른다.

- [ ] **Step 4: 테스트·정적 크기 확인**

Run: `npx vitest run tests/unit/app/manifest.test.ts && file public/icons/zipsin-app-192.png public/icons/zipsin-app-512.png public/icons/zipsin-apple-touch.png`

Expected: PASS, 각각 192×192·512×512·180×180 PNG.

- [ ] **Step 5: 커밋**

```bash
git add app/manifest.ts app/layout.tsx public/icons tests/unit/app/manifest.test.ts
git commit -m "feat: 집신 웹앱 설치 메타데이터 추가"
```

### Task 2: 설치 상태 판별과 안내 대화상자

**Files:**
- Create: `features/install/install-state.ts`
- Create: `features/install/components/InstallGuideDialog.tsx`
- Create: `features/install/components/InstallAppButton.tsx`
- Create: `features/install/components/InstallAppButton.module.css`
- Modify: `vitest.config.ts`
- Test: `tests/unit/features/install/install-state.test.ts`
- Test: `tests/unit/features/install/install-app-button.test.tsx`

**Interfaces:**
- Consumes: browser `beforeinstallprompt`, `appinstalled`, `matchMedia('(display-mode: standalone)')`, navigator platform·touch points.
- Produces: `InstallMode = 'prompt-ready' | 'ios-guide' | 'generic-guide' | 'installed'`, `resolveInstallMode(input): InstallMode`, `<InstallAppButton />`, `<InstallGuideDialog mode open onClose />`.

- [ ] **Step 1: 순수 상태 판별 실패 테스트 작성**

`TEST-PWA-IOS-001`, `TEST-PWA-FALLBACK-001`, `TEST-PWA-STANDALONE-001`로 prompt 우선순위, iPhone·touch 기반 iPadOS, 일반 안내, standalone·navigator standalone을 검사한다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/features/install/install-state.test.ts`

Expected: 모듈 미존재로 FAIL.

- [ ] **Step 3: `resolveInstallMode` 최소 구현**

정확한 입력 타입을 `{ promptAvailable: boolean; ios: boolean; standalone: boolean }`로 고정하고 `installed → prompt-ready → ios-guide → generic-guide` 우선순위를 구현한다. iOS 탐지는 별도 `isIosLike(navigatorLike)` 순수 함수로 제공한다. `vitest.config.ts`의 coverage include에 `features/install/**/*.{ts,tsx}`를 추가한다.

- [ ] **Step 4: 설치 버튼·dialog 실패 테스트 작성**

`TEST-PWA-INSTALL-001`은 이벤트가 와도 자동 prompt하지 않고 클릭 때 한 번 호출하는지 검사한다. `TEST-PWA-CHOICE-001`은 accepted만 installed, dismissed는 기존 상태 유지인지 검사한다. 안내 dialog는 제목 포커스, Escape 닫기, 버튼 포커스 복귀와 온라인 전용 문구를 검사한다.

- [ ] **Step 5: 실패 확인**

Run: `npx vitest run tests/unit/features/install/install-app-button.test.tsx`

Expected: 컴포넌트 미존재로 FAIL.

- [ ] **Step 6: Client 컴포넌트 최소 구현**

`BeforeInstallPromptEvent` 타입을 컴포넌트 파일에 정의한다. 이벤트를 ref에 보관하고 사용자 클릭 때만 `prompt()`와 `userChoice`를 처리한다. iOS·일반 안내는 네이티브 `<dialog>`의 `showModal/close`를 사용하고 열기 버튼으로 포커스를 복귀시킨다. `appinstalled`와 standalone 상태는 `installed`로 갱신한다.

- [ ] **Step 7: 집중 테스트 통과**

Run: `npx vitest run tests/unit/features/install/install-state.test.ts tests/unit/features/install/install-app-button.test.tsx`

Expected: 전부 PASS, console error 0.

- [ ] **Step 8: 커밋**

```bash
git add features/install tests/unit/features/install vitest.config.ts
git commit -m "feat: 플랫폼별 집신 웹앱 설치 흐름 추가"
```

### Task 3: 공개 홈 헤더 설치 CTA 통합

**Files:**
- Modify: `components/PublicHome.tsx`
- Modify: `components/PublicHome.module.css`
- Modify: `tests/unit/navigation/public-home.test.tsx`
- Modify: `tests/e2e/app-navigation.spec.ts`

**Interfaces:**
- Consumes: Task 2의 `<InstallAppButton />`.
- Produces: 데스크톱 `앱으로 다운로드 → 로그인 → 웹에서 시작하기`, 모바일 `앱 받기` 헤더.

- [ ] **Step 1: 헤더 계약 실패 테스트 작성**

기존 `앱 다운로드 링크가 없다` 검사를 제거하고 `TEST-PUB-INSTALL-CTA-001`로 설치 버튼, login/signup 링크, 44px 이름과 순서를 검사한다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/navigation/public-home.test.tsx`

Expected: 설치 버튼 미존재로 FAIL.

- [ ] **Step 3: 헤더 통합과 반응형 최소 구현**

`PublicHome.tsx`의 `headerActions` 첫 항목으로 설치 버튼을 추가한다. 600px 이하에서는 헤더 login/signup을 숨기고 설치 버튼의 짧은 라벨을 보여주되 활성 장면의 login/signup CTA는 유지한다.

- [ ] **Step 4: 단위·내비게이션 테스트 통과**

Run: `npx vitest run tests/unit/navigation/public-home.test.tsx`

Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add components/PublicHome.tsx components/PublicHome.module.css tests/unit/navigation/public-home.test.tsx tests/e2e/app-navigation.spec.ts
git commit -m "feat: 공개 홈에 앱 설치 CTA 연결"
```

### Task 4: 네 장 이미지 무대와 고유 모션

**Files:**
- Modify: `features/public-home/components/HomeStoryCarousel.tsx`
- Modify: `components/PublicHome.module.css`
- Modify: `tests/unit/features/public-home/home-story-carousel.test.tsx`

**Interfaces:**
- Consumes: 기존 `publicHomeStories`, selectedIndex, 승인 이미지와 가로 트랙.
- Produces: `data-motion-story`가 있는 활성 이미지 무대, 장식용 확장 배경, 접근 가능한 선명 전경, 장면별 1회 CSS 모션.

- [ ] **Step 1: 장면별 구조·재진입 실패 테스트 작성**

`TEST-PUB-ANIM-001~004`로 네 장이 각각 `gather/continuity/communication/history` motion id를 갖고 장식 배경은 접근성 트리에서 숨겨지며 선명 전경 alt는 하나만 유지되는지 검사한다. 2장 이동 후 1장 재선택 시 활성 motion run id가 바뀌는지 검사한다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/unit/features/public-home/home-story-carousel.test.tsx`

Expected: motion id·장식 배경·재실행 식별자 미존재로 FAIL.

- [ ] **Step 3: 이미지 무대 최소 구현**

`HomeStoryCarousel`에 `activationSequence`를 추가하고 수동·자동 선택마다 활성 장면의 run id를 갱신한다. 각 이미지 프레임은 `aria-hidden` 확장 배경과 기존 alt를 가진 선명 전경을 렌더링한다. 이미지 실패 시 기존 fallback과 CTA를 유지한다.

- [ ] **Step 4: 장면별 CSS 모션 구현**

- `gather`: 상단 혼란에서 아래 집으로 세로 pan·focus·1회 빛.
- `continuity`: 세 구간 좌→우 reveal·기록선 sweep.
- `communication`: 왼쪽 혼란에서 중앙을 거쳐 오른쪽 카드로 pan·route glow.
- `history`: 방 안정 zoom과 에어컨→벽지→배관→바닥→휴대폰 spotlight.

모두 transform·opacity·clip-path 중심으로 2.2~3.4초 안에 종료한다. 큰 외곽 카드·중첩 테두리를 약화하고 데스크톱 이미지 비중을 56~60%로 높인다.

- [ ] **Step 5: reduced-motion 정지 상태 구현**

모든 전경·배경·pseudo 모션의 animation을 제거하고 최종 transform·object-position·opacity를 즉시 적용한다. 기존 자동재생 중지 동작을 유지한다.

- [ ] **Step 6: 집중 테스트 통과**

Run: `npx vitest run tests/unit/features/public-home/home-story-carousel.test.tsx tests/unit/navigation/public-home.test.tsx`

Expected: 전부 PASS.

- [ ] **Step 7: 커밋**

```bash
git add features/public-home/components/HomeStoryCarousel.tsx components/PublicHome.module.css tests/unit/features/public-home/home-story-carousel.test.tsx
git commit -m "feat: 공개 홈 네 장의 시네마틱 모션 추가"
```

### Task 5: 반응형·접근성·설치 E2E 검수

**Files:**
- Modify: `tests/e2e/release-responsive-accessibility.spec.ts`
- Modify: `tests/e2e/app-navigation.spec.ts`
- Modify: `tests/e2e/landing.spec.ts`

**Interfaces:**
- Consumes: Task 1~4의 manifest, install CTA/dialog, 장면별 motion DOM과 CSS.
- Produces: 320·390·768·1440 회귀 증거, reduced-motion, dialog와 Preview 설치 경로 검사.

- [ ] **Step 1: E2E 실패 검사 추가**

`TEST-PUB-IMAGE-VIS-*`는 이미지 선명 전경이 viewport 안에 있고 최소 장면 너비·높이를 차지하는지, 헤더 설치 버튼과 카카오·캐러셀 제어가 겹치지 않는지 검사한다. `TEST-PUB-ANIM-REDUCE-001`은 computed animation name이 `none`이고 첫 장이 유지되는지 검사한다. install E2E는 generic dialog 열기·Escape·포커스 복귀를 검사한다.

- [ ] **Step 2: 대상 E2E 실패 확인**

Run: `npx playwright test tests/e2e/release-responsive-accessibility.spec.ts tests/e2e/app-navigation.spec.ts tests/e2e/landing.spec.ts`

Expected: 새 이미지 면적·설치 dialog·motion 검사 중 하나 이상 FAIL.

- [ ] **Step 3: breakpoint별 crop·헤더·대화상자 수정**

320·390·768·1440에서 화면 경계, 44px, Kakao 비겹침, 첫 이미지 시작·완성 위치를 맞춘다. 200% 확대와 낮은 높이는 기존 내부 스크롤 안전장치를 유지한다.

- [ ] **Step 4: 대상 E2E 통과와 캡처**

Run: `npx playwright test tests/e2e/release-responsive-accessibility.spec.ts tests/e2e/app-navigation.spec.ts tests/e2e/landing.spec.ts`

Expected: PASS, `test-results/`에 네 viewport·reduced-motion 캡처, axe·console·pageerror 0, CLS ≤0.1.

- [ ] **Step 5: 커밋**

```bash
git add components/PublicHome.module.css tests/e2e
git commit -m "test: 앱 설치와 이미지 모션 반응형 검증"
```

### Task 6: 전체 품질게이트·문서·Preview

**Files:**
- Create: `docs/traceability/public-home-install-motion.md`
- Create: `docs/worklogs/2026-10-14-public-home-install-motion-implementation.md`
- Modify: `docs/superpowers/specs/2026-10-14-public-home-install-motion-design.md`
- Modify: `docs/decisions/DEC-025-public-web-app-installation.md`
- Modify: `WORK_STATUS.md`

**Interfaces:**
- Consumes: 모든 REQ·AC, 소스·테스트와 Preview 증거.
- Produces: 양방향 추적표, 독립 품질판정, GitHub branch와 Vercel Preview.

- [ ] **Step 1: 전체 자동 검증**

Run: `npm run typecheck && npm run test:coverage && npm run build && npm run test:e2e`

Expected: 타입 오류 0, 전체 단위·통합 통과, lines/statements/functions/branches 각각 80% 이상, build 성공, E2E 통과 또는 외부 환경 전용 skip만 존재.

- [ ] **Step 2: 독립 품질검수**

REQ↔AC↔화면↔소스↔TEST-ID를 대조하고 P0·P1·P2를 분리한다. P0·P1은 0이어야 하며, 수정 사항은 재검수한다.

- [ ] **Step 3: 로컬 실제 브라우저 시각검수**

1440 첫 장 약 0.5초·3초, 나머지 세 장 최종 상태, 390 첫 장 시작·완성, 320·768 경계와 reduced-motion을 직접 확인한다. build 성공을 브라우저 성공으로 대신하지 않는다.

- [ ] **Step 4: 문서·바탕화면 동기화**

추적표·작업기록·설계 상태·결정 상태·WORK_STATUS를 갱신한다. `/Users/zipsin/Desktop/코덱스랑/집신/`의 같은 구조로 안전하게 복사하고 사용자 수정 파일은 덮어쓰지 않는다.

- [ ] **Step 5: Git 보안검사·커밋·푸시**

Run: `git diff --check && git status --short`

민감정보 패턴을 검사하고 `codex/contract-to-expiry-home`에 커밋·푸시한다.

- [ ] **Step 6: Vercel Preview와 실제 설치 검증**

Preview가 `Ready`인지 확인하고 `/`, `/manifest.webmanifest`, `/signup`, `/login`을 실제 브라우저로 확인한다. Chromium에서 설치 prompt와 standalone 실행을 검수한다. 실제 iPhone Safari를 사용할 수 없으면 `미검증`으로 명시한다.

- [ ] **Step 7: 사용자 승인 요청**

실제 사용 가능 기능, 미검증·미지원 항목, 테스트 결과, Preview 주소와 Production 승인 항목만 한 장으로 보고한다. 사용자 승인 전 Production을 변경하지 않는다.
