# 다음 Codex에서 이어서 작업하기

Claude와 협업하거나 다른 에이전트에게 인계할 때는 `CLAUDE_HANDOFF.md`와 `docs/23-claude-collaboration-handoff-master-prompt.md`를 먼저 사용합니다.

최신 통합 인증 작업은 다음 브랜치와 문서를 기준으로 이어갑니다.

- 브랜치: `codex/zipsin-shared-auth-integration`
- 계획: `docs/superpowers/plans/2026-10-14-zipsin-shared-auth-integration.md`
- 배포 절차: `docs/deployment/zipsin-check-preview-runbook.md`
- 검사 결과: `docs/testing/zipsin-check-account-sync-results.md`

집신과 집신체크는 같은 Next.js 앱·Supabase·사용자 ID를 사용합니다. 별도 체크 로그인 화면을 다시 만들지 마세요. 남은 일은 Preview 관리자 설정과 실제 Google·Kakao 왕복, `zipsin.net`·`ck.zipsin.net` 공유 세션 확인입니다. 사용자 승인 전 Production·DNS는 변경하지 않습니다.

인계 기준은 커밋 `8e4f7a85ab2adf1aafb7f6161b0144016b06b7e9`입니다. `REQ-AUTH-LOGIN-001` 로그인 카드 개편과 인수인계 문서는 원격 브랜치에 반영됐습니다. 전체 테스트는 단일 worker 기준 606건 통과·1건 건너뛰, 커버리지 네 지표 80% 이상, 타입 검사·빌드·Chromium·WebKit 반응형 8건과 키보드 2건이 통과했습니다. SOLAPI 계정과 발신번호 등록은 완료했으나 API Key·Secret·Vercel 서버 환경변수와 실문자 왕복은 미완료입니다.

현재 worktree:

- `/Users/zipsin/.codex/worktrees/shared-auth-integration/배포`
