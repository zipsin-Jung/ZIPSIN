# 공개 홈 웹앱 설치·모션 추적표

- 날짜: 2026-10-14
- 상태: 로컬·Vercel Preview 검증 완료, 사용자 승인 대기
- 범위: 비로그인 공개 `/`

| 요구사항·수용 기준 | 소스 | 대표 테스트·증거 | 상태 |
|---|---|---|---|
| REQ-PUB-INSTALL-001 / AC-INSTALL-001~003 헤더 설치·로그인·시작 진입 | `components/PublicHome.tsx`, `InstallAppButton.tsx` | `public-home.test.tsx`, `app-navigation.spec.ts` | 통과 |
| REQ-PUB-INSTALL-002 / AC-INSTALL-004~008 플랫폼별 설치 상태·안내·포커스 복귀 | `install-state.ts`, `InstallAppButton.tsx`, `InstallGuideDialog.tsx` | `install-state.test.ts`, `install-app-button.test.tsx`, TEST-PWA-PROMPT-ERROR-001 | 통과 |
| REQ-PUB-INSTALL-003 / AC-INSTALL-009~011 Manifest·아이콘·시작 경로 | `app/manifest.ts`, `app/layout.tsx`, `public/icons/` | `manifest.test.ts`, `npm run build`, Preview manifest | 통과 |
| REQ-PUB-VISUAL-001 / AC-VISUAL-001~003 승인 이미지 가시성·crop | `HomeStoryCarousel.tsx`, `PublicHome.module.css` | TEST-PUB-ANIM-CROP-320/390/768/1440, 시작·완료 캡처 | 통과 |
| REQ-PUB-MOTION-001 / AC-MOTION-001~005 네 장 고유 1회 모션·재실행 | `HomeStoryCarousel.tsx`, `PublicHome.module.css` | TEST-PUB-ANIM-001~004, TEST-RC-HERO-HOVER-CLICK-001 | 통과 |
| REQ-PUB-A11Y-001 / AC-A11Y-001~005 모션 감소·lazy·CLS·axe·console | `HomeStoryCarousel.tsx`, `PublicHome.module.css` | TEST-PUB-ANIM-REDUCE-001, TEST-PUB-IMAGE-LAZY-001, TEST-RC-RESP-* | 통과 |
| AC-SAFE-001 온라인 전용·가짜 스토어·오프라인 보장 금지 | `InstallGuideDialog.tsx`, `manifest.ts` | 설치 안내 단위·E2E | 통과 |

## 로컬 검증

- `npm run typecheck`: 오류 0건
- `npm test -- --run`: 91개 파일 통과·2개 skip, 432개 테스트 통과·2개 skip
- `npm run test:coverage -- --maxWorkers=2`: Statements 86.26%, Branches 82.53%, Functions 86.80%, Lines 89.41%
- `npm run build`: Next.js 16.4 webpack Production build 성공, `/manifest.webmanifest` 정적 라우트 확인
- `npm run test:e2e -- --workers=2`: Chromium 37개 통과·11개 skip
- 4 workers 첫 전체 E2E는 로컬 자원 경합으로 Next dev 서버가 종료되어 실패했고, 동일 스위트를 2 workers로 재실행해 모두 통과했다.

## 독립 품질 검수

초기 판정은 P2 4건으로 `Ready to merge: 아니오`였다. 다음을 재발 테스트와 함께 수정했다.

1. 비활성 원본 PNG 8.98MB 조기 로딩→활성 장면 배경만 렌더링
2. hover 예약 후 click 시 모션 2회 실행→수동 선택 전 예약 해제
3. `prompt()`·`userChoice` 거부 시 안내 소실→일반·iOS 안내로 복구
4. 768px 완료 crop 지붕 잘림→세로 프레임·종료 위치 조정, 네 크기 시작·완료 E2E 추가

수정 후 P0·P1·P2 재발 테스트는 모두 통과했다. 별도 2차 리뷰는 중복하지 않았다.

## Preview 검증

- 배포 `zipsin-hghk8i68l-zipsin-jung.vercel.app`: `Ready`
- 고정 브랜치 Preview: `https://zipsin-git-codex-contract-to-expiry-home-zipsin-jung.vercel.app`
- `/`, `/login`, `/signup`: Vercel 보호 우회 검증에서 HTTP 200
- `/manifest.webmanifest`: HTTPS 응답에서 name·start_url·scope·standalone·192·512·maskable 확인
- 실제 인앱 브라우저: 첫 장면 이미지·문구, 앱 받기, 일반 설치 안내, 제목 포커스를 시각 확인

## 남은 실기기 확인

- 실제 Chromium이 `beforeinstallprompt`를 제공하는 환경의 네이티브 설치창·standalone 재실행
- 실제 iPhone Safari `홈 화면에 추가`
- Production은 사용자 승인 전까지 미반영
