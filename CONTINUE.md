# 다음 Codex에서 이어서 작업하기

최신 Claude·Codex 협업 인수인계 프롬프트는 다음 문서입니다.

- `docs/24-claude-collaboration-handoff-2026-10-15.md`

과거 Codex 전용 인수인계는 역사 자료로 보존합니다.

- `docs/13-codex-handoff-master-prompt.md`

새 Codex는 원본 폴더의 과거 상태가 아니라 아래 최신 worktree를 사용해야 합니다.

- `/Users/zipsin/.codex/worktrees/public-v1-auth-continue/배포`
- 브랜치: `codex/contract-to-expiry-home`
- 1단계 구현 기준 커밋은 작업 종료 시 `git log -1`로 확인하세요.

가장 최신 제품 방향과 실행 계획은 다음 문서를 먼저 확인합니다.

- `docs/23-contract-to-expiry-product-development-prompt.md`
- `docs/superpowers/specs/2026-10-13-contract-to-expiry-home-design.md`
- `docs/superpowers/plans/2026-10-13-contract-to-expiry-roadmap.md`
- `docs/superpowers/plans/2026-10-13-contract-home-phase-1.md`

실제 파일과 Git 상태를 인수인계 문서보다 우선합니다. 인수인계 작성 기준 HEAD는 `db22837`이며 최신 커밋이 더 앞서 있으면 되돌리지 않습니다. 사용자 최신 화면 과업은 중앙 카드형 로그인 수정안을 `기본·오류·390px 모바일` 세 상태로 먼저 제안하는 것입니다. 실제 로그인은 아이디+비밀번호이고, 이메일은 가입·복구, 휴대전화는 가입 인증입니다. 사용자 시안 승인 전에는 로그인 코드를 수정하지 않습니다.

전체 출시의 별도 차단 항목은 Preview에 `202610130011_contract_lifecycle_home.sql`이 적용됐는지 확인하고, 필요하면 백업·rollback 계획과 사용자 승인 뒤 Preview에만 적용해 폐기 가능한 대표·소속공인중개사·보조원·임대인·임차인 계정으로 계약 날짜·D-day·본인 계획 저장·새로고침 유지·관계 종료·타인 계약 ID 거부를 확인하는 것입니다. 이 실제 Postgres/RLS 증거 전에는 전체 제품 품질 게이트를 통과로 표시하지 마세요. 사용자 승인 전에는 Production migration·배포를 하지 마세요.

2026-10-14에는 공개 홈 네 생활 장면 이미지와 제품 UI 전환, 로그인 홈의 D-day·다음 행동·사진 없음·문서·대화 구조를 구현했습니다. 요구사항·자산·검증 기록은 `docs/superpowers/specs/2026-10-14-image-led-public-and-app-home-design.md`, `docs/design/2026-10-14-public-home-image-assets.md`, `docs/worklogs/2026-10-14-image-led-public-and-app-home.md`를 확인하세요. 이 시각 개선은 데이터베이스나 권한 모델을 바꾸지 않았습니다. Preview의 실제 Postgres/RLS 검증 차단 항목은 그대로 유지합니다.
