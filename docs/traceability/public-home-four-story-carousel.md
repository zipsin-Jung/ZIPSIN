# 공개 메인 4장 스토리 캐러셀 추적표

- 날짜: 2026-10-14
- 상태: 로컬·Vercel Preview 검증 완료, 사용자 화면 승인 대기
- 대상: 공개 `/`

| 요구사항·수용 기준 | 화면·상태 | 소스 | 대표 테스트·증거 |
|---|---|---|---|
| RC-HERO-STORY-001 AC-01~03 네 장·고정 순서·첫 장 가치 | FIRST·네 장 | `features/public-home/scenarios.ts`, `components/PublicHome.tsx` | `home-story-content.test.tsx`, `public-home.test.tsx`, TEST-RC-HERO-JOURNEY-001 |
| RC-HERO-MOTION-001 AC-04 1회 자동재생·마지막 정지·화면 노출 때만 재생 | PLAYING·LAST·OFFSCREEN | `HomeStoryCarousel.tsx` | TEST-RC-HERO-AUTO-001, TEST-RC-HERO-VIEWPORT-001 단위·E2E |
| RC-HERO-MOTION-001 AC-05 점·화살표·키보드·실제 touch swipe | HOVER·MANUAL·MOBILE-SWIPE | `HomeStoryCarousel.tsx`, `PublicHome.module.css` | TEST-RC-HERO-HOVER-001, TEST-RC-HERO-MANUAL-001, TEST-RC-HERO-SWIPE-001 CDP touch |
| RC-HERO-MOTION-001 AC-06 수동 뒤 자동재생 중지·무대 밖 release 복구 | MANUAL·POINTER | `HomeStoryCarousel.tsx` | TEST-RC-HERO-MANUAL-002, TEST-RC-HERO-POINTER-001/002 단위·E2E |
| RC-HERO-MOTION-001 AC-07 모션 감소 | REDUCED-MOTION | `HomeStoryCarousel.tsx`, `PublicHome.module.css` | TEST-RC-HERO-MOTION-001 단위·E2E |
| RC-HERO-SAFE-001 AC-08~09 안전한 공개 표현 | 전체 | `scenarios.ts`, 승인 이미지 자산 | TEST-RC-HERO-SAFE-001, 공개 자산 수동 검토 |
| RC-HERO-SAFE-001 AC-10 이미지 오류에도 설명·CTA 유지 | IMAGE-ERROR | `HomeStoryCarousel.tsx` | TEST-RC-HERO-ERROR-001 |
| RC-HERO-RESP-001 AC-11 반응형·무가로넘침·콘텐츠 높이 | 320·390·768·1440 | `PublicHome.module.css`, `HomeStoryCarousel.tsx` | TEST-RC-RESP-320/390/768/1440, 전체 페이지 스크린샷 |
| RC-HERO-RESP-001 AC-12 44px·키보드·CTA 포커스 보존 | FOCUS·CONTROLS | `HomeStoryCarousel.tsx`, CSS | TEST-RC-HERO-A11Y-001, TEST-RC-HERO-FOCUS-002, TEST-RC-RESP-* |
| RC-HERO-RESP-001 AC-13 axe·console·hydration 0 | 전체 | 공개 홈 렌더링 | TEST-RC-RESP-* |
| RC-HERO-RESP-001 AC-14 첫 장 우선·CLS ≤0.1 | FIRST·LAZY | `HomeStoryCarousel.tsx` | TEST-RC-RESP-* layout-shift 측정 |

## 품질 증거

- 타입 오류 0건
- 단위·통합 417개 통과·외부 환경 전용 2개 skip
- 커버리지 Statements 85.89% / Branches 81.96% / Functions 87.09% / Lines 89.25%
- Production build 성공
- Chromium 28개 통과·환경변수와 Preview 데이터가 필요한 11개 skip
- Vercel Preview `Ready`, 실제 브라우저에서 네 장 자동 전환·목차 직접 선택·승인 이미지·제품 증거 UI 확인
- Preview 보호 요청 기준 `/`, `/signup`, `/login` 200, 로그인 전 `/support` 307
- 공개 홈 집중 Chromium 12개 통과

## 기능 경계

세 번째 장의 통화·문자·외부 메신저는 현재의 혼란을 설명하는 이미지다. 집신이 해당 기록을 가져오거나 연동하지 않는다. 직접 초대·집별 연락처·집신 채팅을 시작한 뒤의 새 기록만 제품에 쌓인다.
