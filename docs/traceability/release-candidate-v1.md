# 집신 출시 후보 v1 추적표

- 검증 기준 코드 리비전: `f612c47`. 문서 커밋·푸시 후 최종 SHA와 immutable Preview 주소를 덧붙인다.
- Preview 기준 브랜치: `codex/contract-to-expiry-home`

| REQ / AC | 흐름·화면·상태 | 소스 | TEST-ID / 테스트 | 수준 | 결과 |
|---|---|---|---|---|---|
| RC-PUB-001 | FLOW-RC-01 공개 홈 → 로그인·가입 | `PublicHome`, `app/page` | `TEST-RC-PUB-001`, `TEST-RC-PUB-003`, `app-navigation.spec.ts` | 단위+브라우저 | 통과 |
| RC-PUB-002 | 생활 사례 선택과 제품 UI 전환 | `PublicHome`, `ScenarioExplorer` | `TEST-RC-PUB-IMG-002/003`, `TEST-RC-PUB-005`, `TEST-RC-RESP-320/390/768/1440` | 단위+브라우저 | 통과 |
| RC-PUB-IMG-001 | 네 생활 장면 이미지와 선택 전환 | `publicHomeScenarios`, `ScenarioExplorer`, `public/images/public-home/*` | `TEST-RC-PUB-IMG-001/002/003`, `TEST-RC-RESP-320/390/768/1440` | 단위+브라우저 | 통과 |
| RC-PUB-EVIDENCE-001 | 생활 문제 뒤 실제 React 제품 UI 증거와 비대화형 예시 | `ProductEvidence`, `PublicHome` | `TEST-RC-PUB-EV-001/002`, `landing.spec.ts` | 단위+브라우저 | 통과 |
| RC-AUTH-001 | FLOW-RC-01 가입·확인·역할·로그인·복구 | `SignupForm`, `PhoneVerificationForm`, `RoleForm`, `LoginForm` | `signup-onboarding.spec.ts`, `preview-auth-home.spec.ts` | 단위+Preview 브라우저 | **실패: 실제 문자·이메일 공급자 미연결** |
| RC-HOME-001 | FLOW-RC-01 집 등록 → 빈 타임라인 | `createHomeAction`, `HomeForm`, `NewHomePage` | `TEST-HOME-009~015/017/019/020`, `TEST-RC-REC-001` | 단위+통합+Preview | 통과, 20회 동시 저장은 별도 skip |
| RC-REC-001 | FLOW-RC-01 첫 기록 → 타임라인 | `createRecordAction`, `RecordForm` | `TEST-REC-002~004`, `TEST-RC-REC-002`, `moves to the home timeline after a successful save` | 단위+Preview | 통과 |
| RC-FILE-001 | FLOW-RC-01 비공개 사진·PDF 첨부 | `AttachmentUploader`, attachment signed URL route | `TEST-FILE-001~003`, `TEST-RC-FILE-001`, `launch-permissions.spec.ts` | 단위+통합+Preview 브라우저 | **실패: 실제 업로드·종료 후 URL 검증 미실행** |
| RC-CHAT-001 | FLOW-RC-02 집·계약·사무소 채팅 | `sendChatMessage`, `can_access_chat_room`, chat attachment URL route | `chat-core.test.ts`, `chat-attachments.test.ts`, `chat-realtime.spec.ts` | 통합+Preview 브라우저 | **실패: 종료 후 채팅 E2E skip** |
| RC-INV-001 | FLOW-RC-03 계약 관계 초대·수락 | relationship invitation RPC, `InvitationAcceptForm` | `TEST-RC-INV-001`, `relationship-access.test.ts` | 통합+Preview | **실패: 계약 생성 UI 없이 수동 시드** |
| RC-ACL-001 | FLOW-RC-04 관계 종료 즉시 차단 | `can_access_chat_room`, `end_home_relationship`, RLS policies | `TEST-RC-ACL-001/002/003/004`, `launch-permissions.spec.ts` | 통합+Preview 브라우저 | **실패: record 0건 외 파일·채팅·직접 URL 증거 부족** |
| RC-NAV-001 | 홈·집·채팅·마이 실제 경로와 반응형 | `AppShell`, app routes | `app-navigation.spec.ts`, `TEST-RC-RESP-320/390/768/1440` | 브라우저 | 통과, 로그아웃 UI는 P2 미구현 |
| RC-QA-001 | 요구→소스→테스트→실행 증거 | `vitest.config.mts`, Playwright config | `npm test -- --run`, `npm run test:coverage`, typecheck, build, E2E | 자동검사+독립 검수 | **실패: 필수 Preview E2E 증거 부족** |
| RC-DEP-001 | GitHub 브랜치 → immutable Preview → 승인 | `codex/contract-to-expiry-home`, Vercel Preview | final SHA smoke | 배포 검수 | **진행 중: 최종 SHA push·재배포 후 고정 필요** |
| ZH-LIFE-001 | 가입 목적과 실제 역할·관계 권한 분리 | `PurposePicker`, onboarding guard, `complete_usage_onboarding` | `TEST-ZH-LIFE-001-A~E` | 단위+통합 | 통과 |
| ZH-LIFE-003 | 계약 날짜·본인 만기 계획·상대 상태·감사 이벤트 | contract RPC, `get_contract_party_plan_statuses`, `ContractSummary`, `ContractForm` | `TEST-ZH-LIFE-003-A~N`, `TEST-ZH-UI-001~010` | 단위+통합+조건부 Preview | 로컬 통과, 실제 Postgres RLS 왕복 대기 |
| ZH-LIFE-004 | 실제 기록 기반 D-day·다음 행동 최대 3개 | lifecycle domain, `NextActions`, home summary | `TEST-ZH-LIFE-004-A~D`, `TEST-ZH-E2E-001` | 단위+조건부 Preview | 로컬 통과, 인증 Preview E2E 대기 |
| ZH-HOME-001 | 한 집·여러 집 실제 데이터 우선 홈·상세 주소 보호 | `HomeStart`, home dashboard, `AppNavigation` | `TEST-ZH-HOME-001~007`, `TEST-ZH-DATA-007` | 단위+브라우저 | 로컬 통과 |
| ZH-HOME-MEDIA-001 | 실제 사진 준비 전 중립 사진 없음 상태 | `HomeStart` | `TEST-ZH-HOME-MEDIA-001/002` | 단위 | 통과, 실제 signed thumbnail은 후속 범위 |
| ZH-HOME-SUMMARY-001 | 한 집 홈에서 D-day·다음 행동·사진·문서·대화 확인 | `HomeStart` | `TEST-ZH-HOME-001/002`, `TEST-ZH-HOME-MEDIA-001/002` | 단위 | 통과 |
| ZH-VIS-A11Y-001 | 320·390·768·1440 반응형, 키보드 탭, axe, 콘솔 오류 | `PublicHome.module.css`, `ScenarioExplorer` | `release-responsive-accessibility.spec.ts` | 브라우저 | 4개 너비 통과 |

## 커버리지 범위

`vitest.config.mts` 에 명시한 출시 핵심 제품 코드만 측정한다. 레포지토리 전체 커버리지로 표현하지 않는다.

- Statements: 88.15% (685/777)
- Branches: 83.76% (552/659)
- Functions: 92.26% (155/168)
- Lines: 90.96% (564/620)

