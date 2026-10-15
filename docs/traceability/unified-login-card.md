# REQ-AUTH-LOGIN-001 통합 로그인 카드 추적표

기준 브랜치: `codex/zipsin-shared-auth-integration`
기준 상태: 미커밋 변경 검수 중, 사용자 승인 대기

| REQ/AC | FLOW/SCREEN/STATE | 소스 경로·심볼 | TEST-ID·테스트명 | 실행 결과·증거 |
|---|---|---|---|---|
| AC-001 아이디·이메일·휴대폰 통합 입력 | `/login` 기본, 잘못된 입력 | `features/auth/components/UsernameLoginForm.tsx:UsernameLoginForm`, `features/auth/services/login-with-username.ts:loginWithUsername` | TEST-AUTH-LOGIN-001 `shows one identifier field...`, TEST-AUTH-LOGIN-002 `signs in with an email identifier`, `signs in with a verified phone identifier` | 집중 16건 통과, 전체 단일 worker 606건 통과·1건 skip |
| AC-002 인증된 휴대폰만 계정 해석 | `/login` 정상·미인증 번호 실패 | `features/auth/actions/login-with-username.ts:loginWithUsernameAction` `profiles.phone_verified_at` 조회 | TEST-AUTH-LOGIN-002 `signs in with a verified phone identifier`, `returns one generic error when identifier resolution fails` | 통합 테스트 통과 |
| AC-003 계정 탐지 방지 | 없는 계정·미인증 번호·잘못된 비밀번호에 동일 오류 | `features/auth/services/login-with-username.ts:loginWithUsername`, `app/(auth)/login/page.tsx:errorMessages` | TEST-AUTH-LOGIN-003 `uses one generic error for invalid credentials`, `returns one generic error...` | 단위·통합 통과 |
| AC-004 로그인 유지 분기 | `/login` 체크·미체크 | `features/auth/actions/login-with-username.ts:loginWithUsernameAction`, `lib/supabase/server.ts:createServerSupabaseClient` | TEST-AUTH-LOGIN-004 `uses a session cookie when login maintenance is unchecked`, TEST-AUTH-LOGIN-001 기본 체크 확인 | 단위 통과; 실제 브라우저 종료 후 세션 소멸은 Preview 최종 검수 필요 |
| AC-005 설정된 소셜 공급자만 원형 표시 | `/login` 공급자 있음·없음·이동 중 | `app/(auth)/login/page.tsx:LoginPage`, `features/auth/components/SocialLoginButtons.tsx:SocialLoginButtons` | `tests/unit/auth/providers.test.tsx` `설정된 제공자만 표시...` | 전체 단일 worker 통과; 실제 OAuth 왕복은 공급자 설정 후 미검증 |
| AC-006 회원가입·체험 동선 | `/login?next=/ck` | `app/(auth)/login/page.tsx:LoginPage` | TEST-AUTH-LOGIN-001, `tests/e2e/login-responsive.spec.ts` 회원가입·체험 href | Chromium·WebKit 각 4개 뷰포트 통과 |
| AC-007 반응형·키보드 | 320·390·768·1440px, 키보드 포커스 | `app/(auth)/login/page.tsx:LoginPage`, `features/auth/components/UsernameLoginForm.tsx`, `SocialLoginButtons.tsx` | `tests/e2e/login-responsive.spec.ts` `login card stays usable...` | Chromium·WebKit 합계 8건 통과; Preview 키보드 수동 검수는 남음 |

## 실행 명령

```bash
npm test -- --run tests/integration/auth/login-with-username.test.ts tests/unit/auth/username-login-action.test.ts tests/unit/auth/new-auth-forms.test.tsx
npm run typecheck
PLAYWRIGHT_PORT=3101 npm run test:e2e -- tests/e2e/login-responsive.spec.ts --project=chromium --workers=1
npm test -- --maxWorkers=1 --testTimeout=15000
npm run test:coverage -- --maxWorkers=1 --testTimeout=15000
npm run build
```

## 잔여 게이트

- 전체 커버리지: statements 89.74%, branches 80.19%, functions 90.76%, lines 92.95%로 기준 통과
- Next.js production build 통과
- Preview 실제 로그인·쿠키·OAuth 왕복
- 독립 재검수와 사용자 최종 승인
