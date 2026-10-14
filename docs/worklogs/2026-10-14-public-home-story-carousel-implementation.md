# 공개 메인 4장 스토리 캐러셀 구현 기록

- 날짜: 2026-10-14
- 상태: 로컬·Vercel Preview 검증 완료, 사용자 화면 승인 대기
- 범위: 공개 `/`만 변경, 로그인 후 앱·DB·권한·Production 미변경

## 요청

사용자가 당시 확정한 네 장 이미지를 공개 메인에 적용했다. 이후 순서와 카피는 `2026-10-14-public-home-story-arc-refinement.md`의 재승인 결과로 대체한다.

## 수행 순서

기존 코드·문서 확인 → 요구사항·테스트 연결 → 네 장 데이터 → 캐러셀 상호작용 → 승인 이미지와 홈 통합 → 반응형·접근성 검수 → 전체 품질 게이트 → 문서·GitHub·Preview 정리

## 변경 내용

- 승인 이미지 네 장을 `public/images/public-home/`에 영구 자산으로 저장했다.
- 공개 Hero와 중복 사례 탐색을 하나의 `HomeStoryCarousel`로 통합했다.
- 7초 간격 1회 자동재생과 마지막 장 정지, 250ms 점 hover, click/tap, 이전·다음, 키보드, swipe, 재생·일시정지를 구현했다.
- 모션 감소, 탭 숨김, 이미지 실패, JavaScript 비활성 첫 화면과 실제 `/signup`, `/login`, `/support` 경로를 보존했다.
- 활성 콘텐츠 높이를 측정해 모바일의 큰 빈 공간을 제거했다.
- 기존 내비게이션 E2E의 예전 첫 문장을 새 승인 첫 문장으로 갱신했다.
- 독립 검수에서 합성 이벤트가 놓친 실제 모바일 swipe, 누름 중 자동재생, 화면 밖 자동재생과 CTA 방향키 포커스 손실을 발견했다.
- 실제 CDP touch 이벤트와 IntersectionObserver 기반 재발 테스트를 추가하고 네 문제를 수정했다.
- 재검수에서 무대 밖 pointer release 뒤 누름 상태가 남는 경계를 추가로 발견해 전역 종료 처리와 실제 브라우저 재발 테스트를 보강했다.
- 모바일 표시 순서를 설명→이미지·제품 증거→CTA로 맞추고 `n / 4` 페이지 숫자를 복원했다.

## 검증 결과

- `npm run typecheck`: 오류 0건
- `npm run test:coverage`: 88개 파일 통과·2개 skip, 417개 테스트 통과·2개 skip
- 커버리지: Statements 85.89%, Branches 81.96%, Functions 87.09%, Lines 89.25%
- `npm run build`: Next.js 16.4 webpack Production build 성공
- `npx playwright test --project=chromium`: 28개 통과·외부 환경 전용 11개 skip
- 공개 홈 집중 E2E: 12개 통과
- 320·390·768·1440px: 가로 넘침 ≤1px, 버튼 44px 이상, axe 위반 0, console/pageerror 0, CLS ≤0.1
- 390px과 1440px 전체 페이지 스크린샷을 직접 확인했다.
- Vercel Preview `https://zipsin-ovyzr9ro1-zipsin-jung.vercel.app/`가 `Ready`인 것을 확인했다.
- 실제 Preview 브라우저에서 공개 홈과 네 장 자동 전환·목차 직접 선택을 확인했고, 3번 `연결된다`와 4번 `가치가 된다`의 승인 이미지·문구·제품 증거 UI가 함께 바뀌는 것을 시각 검수했다.
- Preview 보호 인증을 통과한 요청에서 `/`, `/signup`, `/login`은 200, 로그인 전 `/support`는 보호 경로로 307 응답하는 것을 확인했다.

## 사용할 수 있는 기능

- 네 장 자동·수동 탐색과 모바일 swipe
- 네 장마다 연결된 설명·승인 이미지·제품 증거 UI
- 실제 회원가입·로그인·고객지원 경로
- 키보드·모션 감소·이미지 실패 대응

## 아직 사용할 수 없는 기능

- 이미지에 보이는 외부 통화·문자·메신저 기록 자동 가져오기
- PDF 자동 생성, OCR·AI 자동분류, 법적 검증과 자산 가치 상승 보장
- 앱스토어 다운로드
- 이번 작업에서의 Production 반영

## 남은 일

사용자가 Preview 화면을 최종 승인한다. 승인 전에는 Production을 변경하지 않는다.

바탕화면 문서함에는 관련 설계·결정·대화·작업기록·추적표를 같은 구조로 복사했다. 바탕화면의 `WORK_STATUS.md`는 저장소 기준본과 다른 독립 변경이 있어 덮어쓰지 않고 저장소 안의 기준본만 갱신했다.

## 커밋

- `49a4ec7 feat: define public home story content`
- `b97a24a feat: add accessible home story carousel`
- `3c93df9 feat: integrate four-story public home`
- `d844dbe test: verify public home carousel journeys`
- `64d9a65 test: align public home navigation journey`
- `9445a78 docs: record public home carousel delivery`
- `7e66b55 fix: harden public home carousel interactions`
- `5d6e413 fix: release carousel pointer outside stage`
