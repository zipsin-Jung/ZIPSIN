# 다음 Codex에서 이어서 작업하기

최신 통합 인증 작업은 다음 브랜치와 문서를 기준으로 이어갑니다.

- 브랜치: `codex/zipsin-shared-auth-integration`
- 계획: `docs/superpowers/plans/2026-10-14-zipsin-shared-auth-integration.md`
- 배포 절차: `docs/deployment/zipsin-check-preview-runbook.md`
- 검사 결과: `docs/testing/zipsin-check-account-sync-results.md`

집신과 집신체크는 같은 Next.js 앱·Supabase·사용자 ID를 사용합니다. 별도 체크 로그인 화면을 다시 만들지 마세요. 남은 일은 Preview 관리자 설정과 실제 Google·Kakao 왕복, `zipsin.net`·`ck.zipsin.net` 공유 세션 확인입니다. 사용자 승인 전 Production·DNS는 변경하지 않습니다.

현재 worktree:

- `/Users/zipsin/.codex/worktrees/shared-auth-integration/배포`
