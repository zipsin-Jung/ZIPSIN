# 공개 홈 웹앱 설치·시네마틱 모션 구현 기록

- 날짜: 2026-10-14
- 상태: 구현·Preview 검증 완료, 사용자 승인 대기
- 범위: 공개 `/`, 설치 메타데이터와 네 장면 모션

## 수행 순서

기존 인수인계·제품·결정 문서 확인 → 요구사항·수용 기준 확정 → Manifest·설치 상태 테스트 → 헤더 통합 → 네 장면 모션 → 320·390·768·1440px 경계 테스트 → 독립 품질검수 → 결함 재발·수정 → 전체 재검증 → 문서·Git·Preview

## 구현 내용

- `app/manifest.ts`에 앱 이름·시작 경로·scope·standalone·테마·아이콘을 정의했다.
- 192·512px 설치 아이콘과 180px Apple touch icon을 추가했다.
- 헤더 순서를 `앱으로 다운로드 → 로그인 → 웹에서 시작하기`로 고정했다.
- Chromium 설치 요청, iOS 안내, 일반 브라우저 안내, standalone 상태를 구분하고 안내창 포커스를 관리했다.
- 설치는 온라인 전용 PWA로 표현하고 앱스토어·오프라인·푸시를 약속하지 않았다.
- 네 승인 이미지에 모임·연속·연결·이력 강조를 다른 모션으로 적용했다.
- 모션 감소, 자동재생 정지, 키보드·swipe·hover·click·포커스 경계를 유지했다.

## 독립 검수와 수정

독립 검수가 P2 4건을 보고했다. 모두 수정 전 재현 테스트를 실패시킨 뒤 수정했다.

- 후속 PNG 네 장의 8.98MB 조기 로딩을 활성 배경 1장만 렌더링하도록 변경했다.
- hover 선택 타이머를 수동 click 전에 취소해 같은 모션이 두 번 시작하지 않게 했다.
- 설치 `prompt()`나 `userChoice`가 거부되어도 일반·iOS 설치 안내를 열도록 복구했다.
- 768px에서 집 지붕이 잘리는 종료 crop을 조정하고 네 viewport의 0.9초·3.4초 실제 모션 캡처를 자동화했다.

## 검증 결과

- 타입 검사: 오류 0건
- 단위·통합: 432개 통과·2개 skip
- 커버리지: Statements 86.26%, Branches 82.53%, Functions 86.80%, Lines 89.41%
- Next.js Production build: 성공
- Chromium E2E: 37개 통과·11개 skip
- 320·390·768·1440px: 시작·완료 이미지, 헤더·CTA·제어, 44px, overflow, axe, console·pageerror, CLS 검사 통과

## Preview 검증

- GitHub `codex/contract-to-expiry-home`에 코드를 푸시했다.
- Vercel 배포 `zipsin-hghk8i68l-zipsin-jung.vercel.app`의 target `preview`, 상태 `Ready`를 확인했다.
- 고정 주소 `https://zipsin-git-codex-contract-to-expiry-home-zipsin-jung.vercel.app`에서 공개 홈·로그인·회원가입이 200으로 응답했다.
- HTTPS manifest의 이름·시작 경로·standalone·아이콘·maskable을 확인했다.
- 실제 브라우저에서 첫 장면 완성 화면, 앱 받기, 일반 설치 안내와 제목 포커스를 확인했다.

## 아직 확인할 것

- 실제 Chromium의 네이티브 설치창·standalone 재실행
- 실제 iPhone Safari 설치
- 사용자의 Production 배포 승인

Production은 변경하지 않았다.
