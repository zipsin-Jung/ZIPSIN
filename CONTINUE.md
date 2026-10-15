# 다음 Codex에서 이어서 작업하기

Claude와 협업하거나 다른 에이전트에게 인계할 때는 `CLAUDE_HANDOFF.md`와 `docs/23-claude-collaboration-handoff-master-prompt.md`를 먼저 사용합니다.

최신 통합 인증 작업은 다음 브랜치와 문서를 기준으로 이어갑니다.

- 브랜치: `codex/zipsin-shared-auth-integration`
- 계획: `docs/superpowers/plans/2026-10-14-zipsin-shared-auth-integration.md`
- 배포 절차: `docs/deployment/zipsin-check-preview-runbook.md`
- 검사 결과: `docs/testing/zipsin-check-account-sync-results.md`

집신과 집신체크는 같은 Next.js 앱·Supabase·사용자 ID를 사용합니다. 별도 체크 로그인 화면을 다시 만들지 마세요. 남은 일은 Preview 관리자 설정과 실제 Google·Kakao 왕복, `zipsin.net`·`ck.zipsin.net` 공유 세션 확인입니다. 사용자 승인 전 Production·DNS는 변경하지 않습니다.

인계 시점에는 `REQ-AUTH-LOGIN-001` 로그인 카드 개편이 미커밋입니다. 기능 집중 테스트 16건, 타입 검사와 Chromium 4개 반응형 시나리오는 통과했습니다. 전체 테스트는 다수 기존 파일의 5초 시간초과로 아직 최종 통과 증거가 없으므로 단일 worker 재실행이 필요합니다. SOLAPI 계정과 발신번호 등록은 완료했으나 API Key·Secret·Vercel 서버 환경변수와 실문자 왕복은 미완료입니다.

현재 worktree:

- `/Users/zipsin/.codex/worktrees/shared-auth-integration/배포`
