# 집신 정식 웹앱·채팅·고객지원 추적표

- 기준일: 2026-10-13
- 대상: 즉시 사용형 홈, 관계자 권한, 여섯 채팅방, 첨부, 차단·신고, 공식 고객지원
- 상태: 로컬 구현·자동검증 완료, Preview 실제 다계정 검증 대기

| 요구사항·수용 기준 | 흐름·화면·상태 | 대표 소스 | 대표 테스트 | 현재 증거 |
|---|---|---|---|---|
| 집은 주소가 아닌 사무소·현재 계약 관계로 접근 | 집 목록·상세, 허용·거부·종료 | `202610130004_office_wide_home_access.sql`, `202610130005_relationship_invitations.sql` | `office-home-access.test.ts`, `relationship-invitations.test.ts` | 로컬 정적·통합 검사 통과, Preview RLS 대기 |
| 임대인·임차인·수리기사 초대는 제한·만료·일회성 | 초대·미리보기·수락·종료 | `features/relationships/*`, `app/(app)/homes/[homeId]/people` | 관계자 초대 단위·통합 테스트 | 개인정보 없는 미리보기와 재사용 차단 자동검사 |
| 여섯 방은 현재 관계를 매 접근마다 확인 | 채팅 목록·방, 허용·종료·타 사무소 | `202610130007_chat_room_types.sql`, `features/chat/services/room-access.ts` | `chat-room-types.test.ts`, `chat-room-isolation.test.ts` | 1,000회 혼합 범위 정적 스트레스 통과 |
| 메시지는 중복 없이 저장되고 읽음은 역행하지 않음 | 전송·재시도·읽음·알림 | `202610130006_chat_core.sql`, `features/chat/services/message.ts` | `chat-core.test.ts`, `chat-idempotency.test.ts` | 20회 동일 재시도 고유키 검사 통과 |
| 첨부는 비공개이고 관계 종료 후 열리지 않음 | 준비·업로드·완료·열람·만료 | `202610130008_chat_ui_attachments.sql`, `features/chat/services/attachment.ts` | 채팅 첨부 통합·단위 테스트 | 형식·크기·개수·5분 링크 자동검사 |
| 차단·신고와 공식 지원 신원은 우회·사칭 불가 | 개인방 차단, 신고, 지원 답변 | `202610130009_chat_safety_support.sql`, `features/support/*` | `chat-safety.test.ts`, `support-access.test.ts` | 대표의 일반방 열람 거부와 공식 답변 검사 통과 |
| 홈은 실제 데이터와 작동 메뉴만 표시 | 신규·기존·연결 대기, 모바일 메뉴 | `HomeStart.tsx`, `AppNavigation.tsx`, 앱 레이아웃 | `home-start.test.tsx`, `app-navigation.test.tsx` | 실제 최근 집·새 메시지·다음 할 일과 5개 메뉴 검사 통과 |

## 역방향 대표 연결

| 테스트 | 보호하는 제품 행동 |
|---|---|
| `tests/stress/chat-room-isolation.test.ts` | 다른 방·다른 계약·종료 관계를 방 참여만으로 우회하지 못함 |
| `tests/integration/chat/chat-safety.test.ts` | 차단 사용자 재접근과 공식계정 사칭을 막음 |
| `tests/integration/support/support-access.test.ts` | 지원 대표가 일반 사용자 방을 열람하지 못함 |
| `tests/unit/workspace/home-start.test.tsx` | 홈이 가상 수치·담당자 문구 대신 실제 상태를 표시함 |
| `tests/e2e/launch-happy-path.spec.ts` | 가입 이후 집·기록·채팅·지원의 실제 연결(Preview 대기) |
| `tests/e2e/launch-permissions.spec.ts` | 타 집·종료 방의 실제 브라우저 거부(Preview 대기) |

커버리지는 `vitest.config.mts`의 선택된 인증·채팅 제품 코드 범위이며 저장소 전체 커버리지로 표현하지 않는다.
