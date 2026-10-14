# 공개 홈 단일 화면 추적표

- 날짜: 2026-10-14
- 상태: Preview 실제 검수 완료, 사용자 승인 대기
- 대상: 공개 `/`

| 요구사항·수용 기준 | 화면·상태 | 소스 | 대표 테스트·증거 |
|---|---|---|---|
| REQ-PUB-SV-001 / AC-PUB-SV-001 단일 화면·하단 섹션 제거 | FIRST·전체 | `components/PublicHome.tsx`, `components/PublicHome.module.css` | `public-home.test.tsx`, TEST-PUB-SV-VIEWPORT-001 |
| REQ-PUB-SV-002 / AC-PUB-SV-002 가로 트랙·정확한 100% 이동 | FIRST~LAST | `features/public-home/components/HomeStoryCarousel.tsx` | `home-story-carousel.test.tsx`, TEST-RC-HERO-JOURNEY-001 |
| REQ-PUB-SV-002 / AC-PUB-SV-006 화살표·목차·키보드·swipe | MANUAL·MOBILE | `HomeStoryCarousel.tsx`, `PublicHome.module.css` | TEST-RC-HERO-SWIPE-001, TEST-RC-RESP-* |
| REQ-PUB-SV-003 / AC-PUB-SV-003 승인 이미지·카메라 이동·문장 reveal | FIRST·MOTION | `HomeStoryCarousel.tsx`, `PublicHome.module.css`, `scenarios.ts` | `home-story-carousel.test.tsx`, TEST-RC-RESP-* 문장 너비 검사, 4개 viewport 캡처 |
| REQ-PUB-SV-004 / AC-PUB-SV-004 모션 감소·정적 완성 상태 | REDUCED-MOTION | `HomeStoryCarousel.tsx`, `PublicHome.module.css` | TEST-RC-HERO-MOTION-001 |
| REQ-PUB-SV-004 / AC-PUB-SV-005 문서 무넘침·핵심 내용과 제어 viewport 내부 | 320·390·768·1440 | `PublicHome.module.css` | TEST-RC-RESP-320/390/768/1440, 제어 우·하단 경계 검사 |
| REQ-PUB-SV-004 / AC-PUB-SV-006 44px·접근성 트리·axe·오류 0 | 전체 | `HomeStoryCarousel.tsx`, CSS | TEST-RC-RESP-* axe·console·pageerror·CLS |
| AC-PUB-SV-007 가입·로그인·카카오 문의 유지 | CTA | `PublicHome.tsx`, `HomeStoryCarousel.tsx`, `KakaoInquiryButton.tsx` | `app-navigation.spec.ts`, `landing.spec.ts`, TEST-PUB-SV-KAKAO-001 포인터 도달·클릭 |
| 구현 경계 외부 연락 자동연동 오해 금지 | COMMUNICATION | `features/public-home/scenarios.ts` | TEST-RC-HERO-SAFE-001/002, TEST-RC-HERO-JOURNEY-001 |

## 로컬 검증 증거

- 타입 검사: 오류 0건
- 단위·통합: 416개 통과, 외부 환경 전용 2개 skip
- 커버리지: Statements 85.95% / Branches 82.41% / Functions 87.03% / Lines 89.15%
- Next.js 16.4.0 Production build: 성공
- Chromium 전체: 29개 통과, 외부 인증·Preview 데이터가 필요한 11개 skip
- 집중 반응형: 320·390·768·1440px에서 문서 가로·세로 overflow 1px 이하, 문장·제어 viewport 경계, 44px, axe, console·pageerror, CLS 검사

## Preview 검증

- Vercel Preview `Ready` 확인
- 실제 브라우저에서 첫 장 승인 문구와 네 장 좌우 이동 확인
- `/signup`, `/login` 실제 이동 확인
- 카카오 문의 경로 유지와 브라우저 console warning·error 0건 확인
- Preview: `https://zipsin-git-codex-contract-to-expiry-home-zipsin-jung.vercel.app`
- 사용자 화면 승인 뒤에만 Production 여부 결정

## 독립 품질 판정

- PASS — 검수 통과, 사용자 승인 대기
- P0 0 / P1 0 / P2 0
- 비차단 P3: 600px 이하에서는 헤더 로그인 글자를 숨기지만 활성 장면 안의 로그인 버튼을 유지한다.
