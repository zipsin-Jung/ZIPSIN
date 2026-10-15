# 집신 에이전트 시스템

집신은 여섯 역할과 일곱 개의 재사용 스킬로 운영합니다. 에이전트는 책임 주체이고 스킬은 반복 가능한 작업 절차입니다.

## 에이전트

- [공통 규칙](agents/shared-rules.md)
- [총괄비서](agents/chief-of-staff.md)
- [제품기획](agents/product-planning.md)
- [UX·UI 디자인](agents/ux-ui-design.md)
- [설계·개발](agents/architecture-development.md)
- [검수·비판](agents/quality-critic.md)
- [시간선·대안 분석](agents/timeline-analyst.md)
- [이전 기획·디자인 역할 호환 안내](agents/product-design.md)

## 스킬

- `zipsin-project-kickoff`: 큰 작업의 최초 회의와 계획
- `zipsin-product-spec`: PRD·유저플로우·UI 추적
- `zipsin-feature-delivery`: 승인된 요구사항의 설계·구현
- `zipsin-quality-gate`: 독립 테스트와 품질 판정
- `zipsin-decision-review`: 중요한 선택의 근거 기반 비교
- `zipsin-timeline-analysis`: 과거·현재·미래 분기의 근거 기반 시간선 분석
- `zipsin-memory-sync`: 문서·대화·바탕화면·GitHub 동기화

## 상태

초안 작성, 독립 역할 검토와 사용자 승인을 마쳤으며 집신의 공식 작업 체계로 적용합니다.

## 외부 협업 에이전트 인계

Claude 등 다른 에이전트와 이어서 작업할 때는 `templates/external-agent-handoff.md`를 사용합니다. 인계물은 정확한 worktree·브랜치·HEAD·미커밋 상태와 `REQ/AC → FLOW/SCREEN/STATE → 소스 → TEST-ID → 결과` 추적을 포함해야 합니다. 인계 문서는 실제 파일과 Git 상태를 대체하지 않습니다.
