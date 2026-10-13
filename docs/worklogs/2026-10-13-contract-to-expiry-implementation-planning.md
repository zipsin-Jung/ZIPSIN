# 계약 후부터 만기까지 구현 계획 작업기록

- 날짜: 2026-10-13
- 브랜치: `codex/contract-to-expiry-home`
- 작업 유형: 승인 명세의 구현 로드맵·1단계 상세 계획
- 예정 커밋: `docs: plan contract to expiry product delivery`
- 승인 상태: 1단계 구현 계획 사용자 검토 대기

## 수행 순서

1. 프로젝트 필수 문서와 승인된 제품 명세를 확인했다.
2. 최신 제품 worktree와 브랜치·Git 상태를 확인했다.
3. 기존 인증, 목적/역할, 집, 계약, 기록, 첨부, 채팅, 초대, RLS와 테스트 구조를 감사했다.
4. 기준 테스트를 실행해 73개 파일 344개 테스트 통과, 1개 skip을 확인했다.
5. 전체 구현을 세 단계로 나눈 로드맵을 작성했다.
6. 1단계의 DB·도메인·서버 액션·화면·단위/통합/스트레스/E2E·롤백 계획을 파일 단위로 작성했다.
7. 명세·결정·대화 문서에 사용자 개발 진행 승인을 반영했다.

## 핵심 설계 결정

- `임차인 / 임대인 / 공인중개사 / 관리·기타`는 `profiles.usage_purpose`에 저장하는 화면 개인화 값으로 두고 접근 권한으로 사용하지 않는다.
- 공인중개사는 대표·소속·보조 세부 역할을 별도로 선택한다.
- 관리·기타는 유효한 초대 관계가 없으면 어떤 집도 볼 수 없다.
- 임대인과 임차인의 만기 계획은 계약·사용자별로 나눠 저장하고 본인만 변경한다.
- 공인중개사의 대리 계획 입력은 위임·감사 정책이 필요하므로 이번 1단계에서 제외한다.
- 기존 집·계약·기록·채팅 RLS를 보존하고 새 변경은 보안 RPC와 감사 이벤트를 사용한다.

## 작성·갱신 파일

- `docs/superpowers/plans/2026-10-13-contract-to-expiry-roadmap.md`
- `docs/superpowers/plans/2026-10-13-contract-home-phase-1.md`
- `docs/superpowers/specs/2026-10-13-contract-to-expiry-home-design.md`
- `docs/decisions/DEC-021-contract-to-expiry-guided-home.md`
- `docs/23-contract-to-expiry-product-development-prompt.md`
- `docs/conversations/2026-10-13-contract-to-expiry-product-direction.md`
- `WORK_STATUS.md`
- `CONTINUE.md`

## 검증 결과

- 기준 단위·통합·스트레스 테스트: 73개 파일 통과, 344개 테스트 통과, 1개 skip
- 계획 문서 자체 검토: ZH-LIFE-001·003·004의 요구사항→작업→테스트 연결 확인
- `git diff --check`: 통과
- 제품 코드·DB·Preview·Production 변경: 없음
- 바탕화면의 `WORK_STATUS.md`, `CONTINUE.md`는 다른 집신체크 작업 내용이 있는 독립 변경 파일이므로 덮어쓰지 않는다. 이번 작업의 안전한 `docs/` 파일만 같은 경로로 추가·갱신한다.

## 남은 일

- 사용자에게 3단계 로드맵과 1단계 구현 범위를 검토받는다.
- 승인 후 Task 1부터 실패 테스트를 먼저 작성하고 순서대로 구현한다.
- 단계 1 구현이 끝난 뒤 전체 자동검사·실제 브라우저·독립 품질 게이트와 Preview 승인을 진행한다.
