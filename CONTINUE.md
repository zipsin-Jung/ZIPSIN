# 다음 Codex에서 이어서 작업하기

최신 종합 인수인계 프롬프트는 다음 문서입니다.

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

실제 파일과 Git 상태를 인수인계 문서보다 우선합니다. 1단계 로컬 구현과 독립 검수 보완은 `f612c47`까지 반영됐습니다. 다음 작업은 Preview에 `202610130011_contract_lifecycle_home.sql`을 안전하게 적용하고 폐기 가능한 대표·소속공인중개사·보조원·임대인·임차인 계정으로 계약 날짜·D-day·본인 계획 저장·새로고침 유지·관계 종료·타인 계약 ID 거부를 확인하는 것입니다. 이 실제 Postgres/RLS 증거 전에는 품질 게이트를 통과로 표시하지 마세요. 사용자 승인 전에는 Production migration·배포를 하지 마세요.
