# 계약 중심 집 홈 1단계 구현 기록

- 날짜: 2026-10-13
- 브랜치: `codex/contract-to-expiry-home`
- Production 변경: 없음

## 수행 순서

1. 기존 상태·인수인계·제품·권한 문서와 현재 코드를 확인했다.
2. 사용 목적과 실제 역할·관계 권한을 분리했다.
3. 계약 날짜와 사용자별 만기 계획을 보안 RPC와 감사 이벤트로 구현했다.
4. D-day, 네 단계 진행, 실제 데이터 기반 다음 행동 최대 3개를 순수 도메인 규칙으로 만들었다.
5. 개별 집 홈과 한 집·여러 집 업무 홈을 실제 데이터 우선 화면으로 재구성했다.
6. 요구→소스→테스트 연결을 갱신하고 자동·브라우저 검사를 실행했다.

## 변경 내용

- `profiles.usage_purpose`와 공인중개사 세부 역할을 추가했다.
- `contract_plan_states`, append-only `contract_plan_events`, 계약·계획 저장 RPC를 추가했다.
- 계약 요약 서비스와 여러 집 우선순위 서비스를 추가했다.
- 집 상세에 보호 주소, D-day, 본인 계획, 불일치 안내, 다음 행동, 집의 시간, 계약 폼을 연결했다.
- 업무 홈의 홍보형 배너를 제거하고 실제 집·만기·열린 일을 우선했다.
- 모바일·PC 내비게이션에 현재 위치를 표시했다.

## 검증 결과

- `npm run test:coverage`: 86개 파일 통과, 2개 외부환경 테스트 파일 skip; 387개 통과, 2개 skip
- Coverage: Statements 91.36%, Branches 85.09%, Functions 95.03%, Lines 93.89%
- `npm run typecheck`: 통과
- `npm run build`: Next.js 16.4.0 webpack build 통과
- `npm run test:e2e`: 로컬 Chromium 22개 통과, 실제 Preview 계정·채팅 환경이 필요한 11개 skip
- 320·390·768·1440px 공개 홈 접근성·가로 넘침·콘솔 오류 검사는 통과했다.

## 남은 일

- Preview DB에 신규 migration을 백업·롤백 절차와 함께 적용한다.
- 폐기 가능한 Preview 계정으로 목적 선택→집→계약 날짜→D-day→본인 계획→새로고침 유지와 무권한 거부를 확인한다.
- Preview 주소를 사용자에게 제출해 화면 승인을 받는다.
- 실제 문자 인증, 결제, OCR, PDF 내보내기와 자동 분류는 이번 단계 범위가 아니다.
