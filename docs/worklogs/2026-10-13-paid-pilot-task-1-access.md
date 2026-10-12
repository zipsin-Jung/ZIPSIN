# 유료 파일럿 Task 1 권한 기반 강화

- 상태: 구현·로컬 검증 완료, 독립 검수 및 외부 반영 대기
- 작업 범위: 승인된 유료 파일럿 구현계획 Task 1
- 순서: 기존 지침·명세·코드 확인 → RED 테스트 → 최소 구현 → 집중/전체/타입/커버리지 검증 → 자체 검토 → 로컬 커밋
- 외부 네트워크, 비밀값, 원격 migration·푸시·배포는 사용하지 않았다.

## 변경

1. 기존 migration을 수정하지 않고 후속 `202610130002_paid_pilot_core.sql`에 직접 쓰기 회수, 사무소/집/계약 복합 제약, 활성 관계 partial unique, 관계·기록·초대 불변 trigger와 관계 기반 권한 helper를 추가했다.
2. `features/workspace/domain/permissions.ts`에 역할·공간·종류의 작성 능력을 정의하고 `errors.ts`에 원문 DB 오류를 노출하지 않는 공통 코드를 추가했다.
3. `types/database.ts`에 집의 사무소와 DB helper를 반영하고 관계 변경 타입에서 불변 필드를 제거했다.
4. 관련 기술 문서에 파일럿 우선 적용과 적용 전 데이터 검토·복구 원칙을 기록했다. 새 제품 방향 결정은 없으며 DEC-013과 승인된 명세를 구현했다.

## 테스트 연결

| 요구사항/수락 기준 | 흐름·상태 | 소스 | 테스트 | 수준과 범위 |
|---|---|---|---|---|
| HOME-001/AC-HOME-001~003, ASSIGN-001/AC-ASSIGN-001~004 | FLOW-PILOT-001/002/004, 권한 없음·종료 | migration: 복합 FK, partial unique, has_active_office_home_access | paid-pilot-policies: direct writes, canonical IDs, relationships, active assignment | SQL 정적 계약 검사, 실제 DB 미검증 |
| REC-001/AC-REC-001/003/004 | FLOW-PILOT-001~003, 정상·권한 없음 | permissions:canCreateRecord; migration:can_create_record/guard_record_update | permissions: 역할/공간/종류 26행; paid-pilot-policies: immutable record, DB record authorization | TS 실제 행동 + SQL 정적 검사 |
| MEMBER-001/AC-MEMBER-002/004/005, PARTY-001/AC-PARTY-001/002/004/005 | FLOW-PILOT-002/003, 만료·철회·사용·종료 | migration: invitation scope/consumption, guards, can_access_contract | paid-pilot-policies: invitation scope, contract termination/access | SQL 정적 계약 검사, 원자 초대 RPC 후속 |
| ACCESS-001/AC-ACCESS-001/002/004/005 | FLOW-PILOT-004, 종료 | migration: lifecycle/identity guards; errors:toWorkspaceErrorCode | paid-pilot-policies: terminal relationships; permissions: safe errors 12행 | TS 실제 행동 + SQL 정적 검사, 감사·종료 RPC 후속 |

## 실행 증거

- 첫 RED: DB 정적 검사 8개 실패. 기존 migration에는 직접 쓰기 회수·복합 FK·활성 partial unique·불변 trigger·안전한 helper가 없었다. 첫 단위 테스트는 미존재 모듈 import 오류가 발생해 정상 RED 증거로 세지 않았다.
- 단위 RED: 최소 함수 스텁으로 모듈 오류를 해소한 후 38개 중 25개가 실제 assertion으로 실패했다(허용 역할이 false, 공통 오류가 server_error, 안내가 빈 문자열).
- 자체 검토 RED: 생성된 unique 이름의 63바이트 제한을 발견하고 이름 의존 제거 검사, 종료 계약 복구 차단, 활성 소속 없는 담당 배정 검사를 먼저 추가했다. DB 검사 10개 중 3개 실패를 확인하고 수정했다.
- 최종 집중: `npm test -- tests/integration/db/paid-pilot-policies.test.ts tests/unit/workspace/permissions.test.ts --reporter=dot` → 48/48 통과.
- 전체: `npm test -- --reporter=dot` → 30개 파일, 174/174 통과.
- 타입: `npm run typecheck` → 종료 코드 0.
- 변경 검토: `git diff --check` 및 기존 migration의 `git diff --exit-code` → 종료 코드 0.
- 새 도메인 범위 커버리지: `npm test -- tests/unit/workspace/permissions.test.ts --coverage --coverage.include='features/workspace/domain/**/*.ts' --reporter=dot` → Statements 100%(23/23), Branches 100%(33/33), Functions 100%(3/3), Lines 100%(14/14). SQL·기존 인증·저장소 전체 커버리지로 표현하지 않는다.
- 빌드·실제 브라우저·실제 Postgres 검수는 이 Task에서 실행하지 않았다.

## 남은 일과 주의사항

- 실제 DB 문법·제약·RLS·동시성은 Task 8의 승인된 Preview 검수가 필요하다. 정적 검사는 실행 증거가 아니다. 새 DB 의존성은 총괄의 명시적 제한에 따라 추가하지 않았다.
- Task 2 집 생성 RPC는 `office_id`를 반드시 채운다. Task 3~6은 직접 쓰기 대신 원자 RPC를 구현한다. Task 6 소속 종료는 담당 관계도 함께 종료해 재초대 때 옛 배정이 재활성화되지 않게 한다.
- 개인 주 역할 `associate_broker`는 현재 기존 인증의 DB CHECK·역할 RPC·UI에 없다. 이번 Task는 사무소 역할 경계만 구현했으며 총괄에 후속 확인을 전달했다.
- 외부 migration 적용 전 기존 데이터 검토·백업이 필요하다. 모호한 사무소·불일치 조합·중복 활성·종료 시각 누락은 자동 정리하지 않는다.
- 바탕화면 복사는 지정 작업트리 안에서만 작업하라는 이번 위임 범위에 따라 총괄의 최종 문서 동기화에 남겼다. 원격 푸시·배포도 실행하지 않았다.
- 로컬 커밋 메시지: `fix: harden paid pilot access boundaries`. 정확한 해시는 `.superpowers/sdd/2026-10-13-paid-pilot-predeployment/task-1-report.md`에 기록한다.
