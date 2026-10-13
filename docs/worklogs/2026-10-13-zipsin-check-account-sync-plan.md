# 2026-10-13 집신체크 단일계정·후보기록 이전 구현계획

## 수행 순서

1. 승인된 제품·UX·기술 설계와 현재 V2 코드 구조를 확인했습니다.
2. 서버 런타임, 인증, DB·RLS·Storage, 이전, 복원·삭제, 품질검수 순서로 TDD 작업을 분해했습니다.
3. 각 작업에 정확한 파일, 인터페이스, 실패 테스트, 검증 명령과 커밋 경계를 지정했습니다.
4. 계정 분류와 실제 집·계약 권한을 분리하는 결정을 `DEC-020`에 기록했습니다.
5. 계획을 승인 명세 ZCA-001~009, 실패·복구·롤백, 80% 네 지표와 실제 브라우저 기준으로 자체 검토했습니다.

## 결과

- 구현계획: `docs/superpowers/plans/2026-10-13-zipsin-check-account-sync.md`
- 결정 기록: `docs/decisions/DEC-020-zipsin-check-single-account-transfer-boundary.md`
- 제품 코드는 변경하지 않았습니다.
- 다음 게이트는 구현계획 사용자 승인입니다.

## 남은 일

- 계획 승인 후 `superpowers:executing-plans` 절차로 Task 1부터 TDD 구현
- Preview 전 전체 자동검사, 실제 브라우저 검수와 독립 품질검수
- G6 승인 전 Production·DNS·실 OAuth 변경 금지
