# 2026-10-13 사무소 전체 집 접근 전환

- 상태: 로컬 구현·검증 완료, 외부 DB 미적용

## 수행 순서

승인 명세·기존 migration·화면 확인 → 실패 테스 작성·실행 → 후속 migration·화면 구현 → 집중 테스 → 타입 검사·전체 테스·빌드·Chromium 권한 시나리오 검증

## 변경

- `can_access_office_home`, `can_write_office_home`를 추가해 활성 사무소 소속을 집 접근 근거로 통일했다.
- 현재 계약 외부 관계자는 정확히 같은 계약 범위만 접근하게 유지했다.
- 신규 집·기록·할 일이 `office_home_assignments`에 의존하지 않게 했다.
- 예전 담당자 관리 화면은 집 상세로 되돌리고 배정 RPC 실행 권한을 회수했다.
- 사무소 초대 안내를 사무소 전체 집·업무 기록 사용 기준으로 바꾸었다.
- `홈/집/기록/마이` 경로를 실제 페이지로 연결했다.

## 검증

- `npm run typecheck`: 통과
- `npm test`: 45개 파일, 241개 테스트 통과
- `npm run test:coverage`: Statements 90.80%, Branches 84.81%, Functions 90.32%, Lines 91.25%
- `npm run build`: 통과
- Chromium: 비로그인 사용자가 집 ID를 알아도 로그인으로 차단되는 1개 시나리오 통과

## 미검증·남은 일

- 실제 Preview Postgres에 migration을 적용하지 않았다.
- 실제 두 사무소·종료된 구성원·임대인·임차인 계정의 RLS 왕복 검증은 Preview migration 승인 후 필요하다.
- Production migration·push·배포는 실행하지 않았다.
