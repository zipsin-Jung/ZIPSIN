# 집신체크 계정 이전 추적표

| 요구사항 | 주요 소스 | 대표 테스트·증거 |
|---|---|---|
| ZCA-001 | `components/zipsin-check/ZipsinCheckApp.tsx` | `anonymous-ck.spec.ts` |
| ZCA-002 | `features/auth/`, `app/(auth)/login`, `app/(auth)/auth/callback` | `login-page-entry.test.tsx`, `redirect.test.ts`, `callback.test.ts`, `anonymous-ck.spec.ts` |
| ZCA-003 | `features/account/`, `app/(auth)/signup`, `app/(app)/onboarding/role` | `profile.test.ts`, `password-signup-form.test.tsx`, `role.test.tsx` |
| ZCA-004 | `features/check-transfer/domain`, `components/check-transfer/TransferPreview.tsx` | `transfer-domain.test.ts`, `TransferPreview.test.tsx`, 이전 미리보기 E2E |
| ZCA-005 | `features/check-transfer/server/service.ts` | `service.test.ts` 멱등·타인 거부·count mismatch |
| ZCA-006 | `run-transfer.ts`, `app/my/candidates` | `run-transfer.test.ts`, `candidates/server/service.test.ts` 단위검사. 다른 기기 복원 E2E는 Preview 차단 |
| ZCA-007 | `photo-service.ts`, `uploader.ts`, 진행·결과 화면 | 사진 부분 실패·cleanup·멱등성 단위검사. 실제 Storage 재시도는 Preview 차단 |
| ZCA-008 | `candidate_drafts` migration, 후보 상세 안내 | profile no-membership, SQL 정책 테스트 원본 |
| ZCA-009 | `CandidateActions.tsx`, 후보 service/API | service 단위검사. 타인 HTTP 접근·실제 Storage 삭제는 Preview 차단 |

실제 OAuth 완료·RLS·Storage 통합 증거는 유효한 Preview Supabase·공급자 환경값으로 최종 확인해야 한다.

추가 공통 인증 경계:

| 요구사항 | 주요 소스 | 대표 테스트·증거 |
|---|---|---|
| 안전한 체크 복귀 | `features/auth/domain/redirect.ts`, 로그인·가입·callback·역할 흐름 | `redirect.test.ts`, `register-password-account-action.test.ts`, Chromium 공용 계정 이동 |
| 운영 공유 세션 | `lib/supabase/cookie-options.ts`, browser/server/proxy client | `shared-cookie.test.ts`, Production 환경값 검사 |
| 기존 프로필 보존 | `features/account/domain/profile.ts`, migration `202610130001` | `profile.test.ts`, migration 호환성 테스트 |
