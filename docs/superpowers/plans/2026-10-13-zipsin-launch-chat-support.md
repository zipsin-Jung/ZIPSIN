# 집신 정식 출시 핵심 흐름·챗·고객지원 구현계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가입한 사용자가 사무소·집·기록을 실제로 사용하고, 중개사·임대인·임차인·수리기사가 집신 안에서 안전하게 대화하며, 집신 대표와 공식 고객지원으로 직접 연결되는 정식 출시 핵심 흐름을 완성한다.

**Architecture:** 기존 인증·사무소·집·기록·첨부 migration은 삭제하지 않고 후속 migration으로 권한을 통일한다. 사무소 구성원은 별도 담당 배정 없이 자기 사무소의 집을 사용하고, 외부 관계자는 활성 계약·수리 초대·방 참여로만 접근한다. 메시지는 Postgres 원자 RPC를 원본으로 삼고 Supabase Realtime은 수신 향상 기능으로만 사용한다.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/RLS/Storage/Realtime, Zod, Vitest, React Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-10-13-zipsin-chat-support-design.md`

## Global Constraints

- 채팅과 공식 사용자 흐름에 별도 담당자 개념을 사용하지 않는다.
- 기존 migration, 기록, 첨부, 감사 이력을 삭제하거나 재작성하지 않는다.
- 주소·집 ID·방 ID·파일 경로는 접근 권한이 아니다.
- 이전 계약자의 메시지·파일·알림은 다음 계약자에게 노출하지 않는다.
- 사진은 사용자가 직접 올리며 집 기록에 자동 복사하지 않는다.
- 집신 대표의 고객지원 권한은 사용자의 다른 방 열람 권한이 아니다.
- 모든 쓰기는 서버 검증과 원자 RPC를 거친다.
- Production migration·배포·원격 push는 사용자 최종 승인 전 실행하지 않는다.
- Statements, Branches, Functions, Lines 각각 80% 이상을 유지한다.

## Review Focus

- 활성 사무소 구성원은 담당 배정 없이 자기 사무소의 집만 보고 다른 사무소 집은 보지 못한다.
- 계약·수리·방 참여가 끝난 기존 세션은 다음 조회·전송·파일 열기부터 차단된다.
- 같은 메시지·방 생성 요청을 반복해도 한 건만 저장된다.
- 공식 고객지원 권한으로 일반 개인·단체·집·사무소·수리방을 열 수 없다.
- Realtime 연결이 끊기거나 알림 생성이 실패해도 메시지 원본은 중복·유실되지 않는다.

---

### Task 1: 담당 배정 없는 사무소 권한 통일

**Files:**
- Create: `supabase/migrations/202610130004_office_wide_home_access.sql`
- Create: `features/workspace/domain/home-access.ts`
- Modify: `types/database.ts`
- Modify: `app/(app)/homes/[homeId]/page.tsx`
- Modify: `app/(app)/invitations/[token]/page.tsx`
- Modify: `app/(app)/layout.tsx`
- Test: `tests/unit/workspace/home-access.test.ts`
- Test: `tests/integration/db/office-wide-home-access.test.ts`
- Test: `tests/e2e/office-home-access.spec.ts`

**Interfaces:**
- Produces: `canUseOfficeHome(role: WorkspaceRole): boolean`
- Produces DB functions: `can_access_office_home(p_home_id uuid)`, `can_write_office_home(p_home_id uuid)`
- Preserves: `office_home_assignments` as unused historical data; no new read/write path depends on it

- [x] 테스트에서 활성 사무소 구성원의 전체 사무소 집 접근, 다른 사무소 거부, 소속 종료 즉시 거부, 외부 관계자의 계약 범위만 허용을 고정한다.
- [x] 집중 테스트를 실행해 기존 담당 배정 의존 때문에 실패하는 것을 확인한다.
- [x] 후속 migration에서 집·기록·첨부 정책과 RPC의 사무소 접근 조건을 활성 `office_memberships` 기준으로 교체한다.
- [x] 화면에서 담당자 관리 진입과 담당 배정 문구를 제거하고 `홈/집/기록/마이`의 실제 동작 경로만 남긴다.
- [x] 집중·전체 테스트와 빌드 후 `fix: align home access without assignees`로 커밋한다.

### Task 2: 실제 Preview 가입·로그인·업무 진입

**Files:**
- Modify: `tests/e2e/signup-onboarding.spec.ts`
- Create: `tests/e2e/preview-auth-home.spec.ts`
- Create: `docs/quality/preview-auth-home-evidence.md`
- Modify: `docs/worklogs/2026-10-13-launch-readiness-audit.md`

**Interfaces:**
- Consumes: Supabase Preview URL·anon key·server-only service key already held by the deployment platform
- Produces evidence: 가입 → 이메일/전화 확인 → 역할 → 로그인 → `/home`

- [ ] 실제 계정 데이터와 테스트 데이터 정리 규칙을 문서화하고 민감정보를 Git에 저장하지 않는다.
- [ ] Preview 전용 테스트에서 비로그인 `/`→`/login`, 신규 가입, 로그인, 온보딩, `/home` 진입을 작성한다.
- [ ] 사용자 승인 범위 안에서 Preview 환경만 연결하고 Production 환경은 변경하지 않는다.
- [ ] Chromium 모바일 390px와 데스크톱 1440px에서 실제 왕복을 실행한다.
- [ ] 실패·스크린샷·콘솔·네트워크 증거를 기록하고 `test: verify preview auth and home`으로 커밋한다.

### Task 3: 계약 관계자와 수리기사 초대·종료

**Files:**
- Create: `supabase/migrations/202610130005_relationship_invitations.sql`
- Create: `app/(app)/homes/[homeId]/people/page.tsx`
- Create: `features/relationships/actions/create-invitation.ts`
- Create: `features/relationships/actions/accept-invitation.ts`
- Create: `features/relationships/actions/end-relationship.ts`
- Create: `features/relationships/components/PeoplePanel.tsx`
- Create: `features/relationships/schemas/invitation.ts`
- Modify: `app/(app)/invitations/[token]/page.tsx`
- Modify: `types/database.ts`
- Test: `tests/unit/relationships/invitation.test.ts`
- Test: `tests/integration/relationships/relationship-access.test.ts`

**Interfaces:**
- Produces RPCs: `create_relationship_invitation`, `accept_relationship_invitation`, `end_home_relationship`
- Produces roles: `landlord|tenant|repairer`
- Produces scopes: `current_contract|repair_event`

- [x] 만료·철회·재사용·동시 수락, 다른 집·계약 혼합, 이전 계약 차단, 수리 만료 테스트를 먼저 작성한다.
- [x] 테스트가 아직 없는 RPC와 화면 때문에 실패하는 것을 확인한다.
- [x] 초대 토큰 해시·일회성 소비·원자 관계 생성·종료 감사 기록을 구현한다.
- [x] 초대 전 공개 범위, 수락, 종료 상태와 쉬운 오류 복구 화면을 구현한다.
- [x] 전체 테스트 후 `feat: add home relationships and repair invitations`로 커밋한다.

### Task 4: 공통 채팅 저장·읽음·알림 기반

**Files:**
- Create: `supabase/migrations/202610130006_chat_core.sql`
- Create: `features/chat/domain/room.ts`
- Create: `features/chat/schemas/message.ts`
- Create: `features/chat/services/message.ts`
- Create: `features/chat/actions/send-message.ts`
- Modify: `types/database.ts`
- Test: `tests/unit/chat/message.test.ts`
- Test: `tests/integration/chat/chat-core.test.ts`
- Test: `tests/stress/chat-idempotency.test.ts`

**Interfaces:**
- Produces tables: `chat_rooms`, `chat_room_memberships`, `chat_messages`, `chat_read_states`, `notifications`
- Produces RPCs: `send_chat_message(p_room_id,p_body,p_idempotency_key)`, `mark_chat_read(p_room_id,p_last_read_message_id)`
- Produces functions: `can_access_chat_room`, `can_send_chat_message`

- [x] 비멤버·종료 멤버·공백·길이 초과·중복 20회·읽음 역행·알림 개인정보 비저장 테스트를 먼저 작성한다.
- [x] 실패 원인이 미구현 스키마와 RPC임을 확인한다.
- [x] 직접 테이블 쓰기를 막고 서버가 발신자와 방 관계를 결정하는 원자 RPC를 구현한다.
- [x] 최근 메시지 페이지네이션과 사용자별 마지막 읽음 위치를 구현한다.
- [x] 전체 테스트 후 `feat: add secure chat core`로 커밋한다.

### Task 5: 여섯 종류의 방과 초대

**Files:**
- Create: `supabase/migrations/202610130007_chat_room_types.sql`
- Create: `features/chat/actions/create-room.ts`
- Create: `features/chat/actions/invite-room-member.ts`
- Create: `features/chat/services/room-access.ts`
- Test: `tests/integration/chat/room-types.test.ts`
- Test: `tests/integration/chat/room-invitations.test.ts`

**Interfaces:**
- Produces room types: `direct|group|home_shared|office_internal|repair_event|support`
- Produces RPCs: `create_direct_room`, `create_group_room`, `create_relationship_room`, `invite_chat_member`, `leave_chat_room`

- [x] 모르는 사용자 검색 금지, 개인방 중복 생성, 단체 초대, 사무소 소속, 계약 분리, 수리 범위, 나가기 테스트를 먼저 작성한다.
- [x] 방 종류별 접근이 현재 관계를 매 요청마다 확인하도록 RLS와 RPC를 구현한다.
- [x] 동일 개인 조합·사무소·계약·수리 건의 중복 기본방 생성을 unique 제약으로 막는다.
- [x] 전체 테스트 후 `feat: add zipsin chat room types`로 커밋한다.

### Task 6: 채팅 UI와 직접 첨부·실시간 복구

**Files:**
- Create: `app/(app)/chats/page.tsx`
- Create: `app/(app)/chats/[roomId]/page.tsx`
- Create: `app/api/chat-attachments/[attachmentId]/url/route.ts`
- Create: `features/chat/components/ChatList.tsx`
- Create: `features/chat/components/ChatRoom.tsx`
- Create: `features/chat/components/MessageComposer.tsx`
- Create: `features/chat/components/ChatAttachmentUploader.tsx`
- Create: `features/chat/hooks/use-room-stream.ts`
- Create: `supabase/migrations/202610130008_chat_attachments.sql`
- Modify: `app/(app)/layout.tsx`
- Test: `tests/unit/chat/chat-ui.test.tsx`
- Test: `tests/integration/chat/chat-attachments.test.ts`
- Test: `tests/e2e/chat-realtime.spec.ts`

**Interfaces:**
- Produces private path: `chat/{room_id}/{message_id}/{attachment_id}`
- Produces: JPEG·PNG·HEIC·PDF, 파일당 20MB, 메시지당 최대 10개, signed URL 5분
- Consumes: Task 4·5 room/message interfaces

- [x] 빈·로딩·전송 중·성공·실패·재시도·오프라인·종료·부분 업로드 상태 테스트를 먼저 작성한다.
- [x] 경로 추측·관계 종료·부분 실패·고아 파일·5분 만료 테스트를 먼저 작성한다.
- [x] 채팅 목록, 방, 입력 보존, 직접 첨부와 `집 기록에 자동 저장되지 않아요` 문구를 구현한다.
- [x] Postgres 저장 뒤 Realtime 수신, 재연결 시 마지막 메시지 이후 재조회, 기능 플래그 폴백을 구현한다.
- [ ] 320px·390px·1440px와 키보드 시나리오 후 `feat: add chat UI attachments and realtime`으로 커밋한다.

### Task 7: 차단·신고·집신 공식 고객지원

**Files:**
- Create: `supabase/migrations/202610130009_chat_safety_support.sql`
- Create: `features/chat/actions/block-user.ts`
- Create: `features/chat/actions/report-message.ts`
- Create: `features/support/actions/reply-support.ts`
- Create: `app/(app)/support/page.tsx`
- Create: `app/(app)/support/inbox/page.tsx`
- Create: `features/support/components/SupportConversation.tsx`
- Test: `tests/integration/chat/chat-safety.test.ts`
- Test: `tests/integration/support/support-access.test.ts`
- Test: `tests/e2e/support-conversation.spec.ts`

**Interfaces:**
- Produces tables: `chat_blocks`, `chat_reports`, `support_identities`, `support_authorizations`
- Produces RPCs: `block_direct_user`, `report_chat_message`, `open_support_conversation`, `reply_as_zipsin_support`

- [x] 차단 우회·신고 권한·공식계정 사칭·비공식 지원 답변·대표의 일반방 접근 거부 테스트를 먼저 작성한다.
- [x] 사용자별 지원방 한 개와 위조 불가능한 `집신 고객지원` 발신 주체를 구현한다.
- [x] 초기 지원 권한은 집신 대표 한 명에게만 부여하고 별도 배정 흐름은 만들지 않는다.
- [x] 민감정보 경고, 답변 대기, 해결 상태, 알림 끄기 UI를 구현한다.
- [x] 전체 테스트 후 `feat: add chat safety and official support`로 커밋한다.

### Task 8: 정식 서비스 홈·내비게이션 완결

**Files:**
- Modify: `features/workspace/components/HomeStart.tsx`
- Modify: `app/(app)/layout.tsx`
- Modify: `app/(app)/home/page.tsx`
- Modify: `app/(app)/homes/[homeId]/page.tsx`
- Test: `tests/unit/workspace/home-start.test.tsx`
- Test: `tests/e2e/app-navigation.spec.ts`

**Interfaces:**
- Consumes: homes, records, relationships, chat, unread notifications
- Produces mobile navigation: `홈|집|추가|채팅|마이`

- [x] 신규·기존·초대 대기 역할의 홈과 실제 동작 메뉴 테스트를 작성한다.
- [x] 홈에서 집신 설명과 `집 등록→기록→대화`를 유지하면서 실제 최근 집·새 메시지·다음 행동만 표시한다.
- [x] 작동하지 않는 메뉴, 담당자 문구, 가상 수치, 체험 표현을 앱 영역에서 제거한다.
- [ ] 모바일·데스크톱 브라우저 검수 후 `feat: complete production app home and navigation`으로 커밋한다.

### Task 9: 추적·커버리지·권한·출시 검수

**Files:**
- Create: `docs/traceability/zipsin-launch-chat-support.md`
- Create: `docs/quality/zipsin-launch-chat-support-report.md`
- Create: `tests/e2e/launch-happy-path.spec.ts`
- Create: `tests/e2e/launch-permissions.spec.ts`
- Create: `tests/stress/chat-room-isolation.test.ts`
- Modify: `WORK_STATUS.md`

**Interfaces:**
- Produces: REQ/AC→FLOW/SCREEN/STATE→SOURCE→TEST→RESULT 양방향 증거

- [ ] 가입→사무소→집→기록·사진→관계자→여섯 방→고객지원→권한 종료 시나리오를 실제 Preview에서 수행한다.
- [ ] 다른 사무소·이전 계약·종료 수리기사·차단 사용자·비공식 지원 권한의 음성 시나리오를 수행한다.
- [ ] `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, Chromium·WebKit E2E와 접근성 검사를 실행한다.
- [ ] 네 커버리지 지표 각각 80% 이상, P0·P1 0건, 민감정보·미추적 파일 없음을 확인한다.
- [ ] 독립 검수 결과를 반영한 뒤 사용자에게 Production migration·push·배포의 영향을 설명하고 최종 승인을 요청한다.
