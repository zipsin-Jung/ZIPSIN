# Claude 협업 인수인계

이 파일은 Claude와 집신 작업을 이어갈 때의 최상위 진입점입니다.

1. `AGENTS.md`
2. `WORK_STATUS.md`
3. `CONTINUE.md`
4. `CLAUDE.md`
5. `docs/00-working-rules.md`
6. `docs/23-claude-collaboration-handoff-master-prompt.md`
7. `agent-system/README.md`
8. `agent-system/agents/shared-rules.md`

실제 후속 작업은 반드시 다음 worktree에서 시작합니다.

- 위치: `/Users/zipsin/.codex/worktrees/shared-auth-integration/배포`
- 브랜치: `codex/zipsin-shared-auth-integration`
- 기준 커밋: `8e4f7a85ab2adf1aafb7f6161b0144016b06b7e9`
- 상태: 로그인 카드 개편·자동 테스트·인수인계 문서는 원격 브랜치에 반영됐습니다. SOLAPI API Key·Secret, Vercel 서버 환경변수, 실문자 왕복과 Preview 최종 확인은 남아 있습니다.

요약만 믿지 말고 `git status --short --branch`, `git diff`, 관련 문서와 코드를 직접 확인하세요. 비밀키·인증번호·전화번호는 대화·문서·Git에 기록하지 않습니다.
