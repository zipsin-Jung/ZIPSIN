# 집신 배포 직전 완성 범위 정리

## 수행 순서

1. 최신 worktree와 Git 상태 확인
2. 인수인계·제품·권한·결정·품질 문서 확인
3. 실제 App Router 경로와 기능 소스 확인
4. 사용자 최종 지침과 현재 구현 차이 정리
5. 출시 완성 명세와 제품 방향 결정문 작성

## 확인 결과

- 최신 작업은 기존 `codex/public-v1-auth` 계열 worktree에 보존되어 있다.
- 공개 홈, 회원가입·로그인, 집 등록·목록·상세, 기록, 비공개 첨부, 채팅, 초대, 관계 종료와 앱 내비게이션 소스가 존재한다.
- 공개 홈은 사용자가 확정한 첫 문장과 여섯 생활 사례 가로 탐색을 아직 제공하지 않는다.
- 최신 Preview의 migration·환경변수와 실제 다계정 데이터 왕복 증거가 없다.
- 현재 worktree에는 `node_modules`가 없어 이번 범위 정리 단계에서 테스트를 실행하지 못했다. 의존성 복구 후 같은 커밋에서 새 증거를 만들어야 한다.
- 빌드 성공과 Preview 브라우저 검수는 별도 결과로 보고해야 한다.

## 작성 문서

- `docs/superpowers/specs/2026-10-13-release-candidate-completion-design.md`
- `docs/decisions/DEC-018-release-candidate-product-center.md`

## 다음 단계

사용자가 출시 완성 명세를 승인했다. 정확한 소스·테스트·명령·커밋 단위를 가진 `docs/superpowers/plans/2026-10-13-release-candidate-completion.md`를 작성했다. 계획 확인 후 공개 홈부터 테스트 우선으로 구현하고, Preview에서 실제 가입·집·기록·첨부·채팅·초대·종료를 검수한다.

Production은 사용자 승인 전 배포하지 않는다.
