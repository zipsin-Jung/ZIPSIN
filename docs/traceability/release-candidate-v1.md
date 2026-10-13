# 집신 출시 후보 v1 추적표

- 검증 기준 리비전: `56baeb35a121cafe8a94545e6a42c631cfaf2788` + Task 5 검증 작업 트리
- 최종 Task 5 커밋과 Preview 리비전은 Task 6 보고서에 고정한다.

| REQ / AC | 흐름·화면·상태 | 소스 | TEST-ID / 테스트 | 수준 | 결과 |
|---|---|---|---|---|---|
| RC-PUB-001 | 비로그인 → 공개 홈 → 로그인·가입 | `components/PublicHome.tsx`, `features/public-home/` | TEST-RC-PUB-001~005, TEST-RC-RESP-320/390/768/1440 | 단위+브라우저 | 통과 |
| RC-ROLE-001 | 역할 선택 후 가능한 첫 행동 | `features/workspace/components/HomeStart.tsx` | `home-start.test.tsx`, `home-pages.test.tsx` | 단위 | 통과 |
| RC-HOME-001 | 집 등록 → 빈 타임라인 → 첫 기록 | `features/homes/`, `app/(app)/homes/` | TEST-RC-REC-001 | 단위+통합 | 통과 |
| RC-REC-001 | 저장 실패시 입력 보존 | `features/records/components/RecordForm.tsx` | TEST-RC-REC-002 | 단위 | 통과 |
| RC-FILE-001 | 여러 파일 중 부분 실패 → 실패분만 재시도 | `features/attachments/components/AttachmentUploader.tsx` | TEST-RC-FILE-001 | 단위 | 통과 |
| RC-IDEM-001 | 동일 기록 20회 요청 → 1개 기록 | `create_home_record` RPC | TEST-RC-IDEM-001 | Preview 스트레스 | 환경 준비 대기 |
| RC-ACL-001~004 | 추측 ID·이전 계약·퇴사·관계 종료 거부 | `supabase/migrations/202610130010_revocation_boundaries.sql` 등 | TEST-RC-ACL-001~004 | DB 계약+브라우저 | 로컬 계약 통과, Preview 상태 대기 |
| RC-INV-001 | 만료·재사용·철회·범위 혼합 초대 거부 | 사무소·관계 초대 RPC | TEST-RC-INV-001 | 통합 | 통과 |
| RC-CHAT-001 | 현재 관계를 매 읽기·쓰기·파일 요청에 재확인 | `can_access_chat_room`, 첨부 경로 | `tests/integration/chat/`, `launch-permissions.spec.ts` | 통합+Preview E2E | 로컬 통과, Preview 계정 대기 |

## 커버리지 범위

`vitest.config.mts` 에 명시한 출시 핵심 제품 코드만 측정한다. 레포지토리 전체 커버리지로 표현하지 않는다.

- Statements: 92.57% (461/498)
- Branches: 86.19% (331/384)
- Functions: 94.82% (110/116)
- Lines: 94.54% (381/403)

