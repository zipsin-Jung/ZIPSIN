# 공개형 서비스 V1 1단계 인증 추적표

- 기준일: 2026-10-02
- 범위: `PSV1-AUTH-001`, `PSV1-AUTH-002`, `PSV1-ROLE-001`
- 상태: 로컬 구현·자동 검증 완료, 외부 서비스 Preview 연동 대기

## 요구사항과 구현 증거

| 요구사항 | 화면·상태 | 대표 소스 | 대표 테스트 | 확인 결과 |
|---|---|---|---|---|
| `PSV1-AUTH-001` 세 간편가입 진입 | `/login`, `/auth/callback`; 준비 중·취소·오류·성공 복귀 | `features/auth/components/SocialLoginButtons.tsx`, `features/auth/actions/start-oauth.ts`, `app/(auth)/auth/callback/route.ts` | `tests/unit/auth/providers.test.ts`, `tests/integration/auth/callback.test.ts`, `tests/e2e/signup-onboarding.spec.ts` | 제공자 구분, 키보드 버튼, 안전한 복귀 경로와 오류 복구 자동 테스트 통과. 실제 제공자 왕복은 Preview 키 설정 후 필요 |
| `PSV1-AUTH-002` 전화 인증·동의 | `/signup/verify`, `/api/phone/send`, `/api/phone/verify`; 만료·불일치·제한·성공 | `features/auth/phone/provider.ts`, `features/auth/phone/mock-provider.ts`, `features/auth/actions/complete-signup.ts`, `supabase/migrations/202610020001_auth_profile.sql` | `tests/unit/auth/verification.test.ts`, `tests/integration/auth/complete-signup.test.ts` | 인증 성공·필수 동의 전 가입 차단, 동의 버전 저장, 운영 모의 인증 차단 테스트 통과. 실제 문자 공급자 연동은 대기 |
| `PSV1-ROLE-001` 역할 선택 | `/onboarding/role`, `/home`; 미선택·저장·오류·완료 | `features/auth/components/RolePicker.tsx`, `features/auth/actions/save-role.ts`, `features/auth/guards/require-onboarding.ts`, `app/(app)/layout.tsx` | `tests/unit/auth/role.test.tsx`, `tests/integration/auth/guards.test.ts` | 네 역할 설명, 미인증 접근 차단, 역할이 자원 권한을 만들지 않는 구조 확인 |
| 기존 랜딩 보존 | `/`에서 `/login` 진입 | `app/page.tsx`, `components/*` | `tests/unit/smoke.test.tsx`, `tests/e2e/landing.spec.ts` | 기존 핵심 안내와 가입 이동 브라우저 테스트 통과 |

## 대표 소스와 테스트의 연결

| 대표 기능 | 소스 | 바로 대응하는 테스트 |
|---|---|---|
| 안전한 로그인 복귀 | `features/auth/domain/redirect.ts` | `tests/unit/auth/redirect.test.ts` |
| OAuth 제공자 선택 | `features/auth/domain/providers.ts`, `features/auth/actions/start-oauth.ts` | `tests/unit/auth/providers.test.ts` |
| OAuth 콜백 | `app/(auth)/auth/callback/route.ts` | `tests/integration/auth/callback.test.ts` |
| 전화 인증 규칙 | `features/auth/schemas/verification.ts`, `features/auth/phone/mock-provider.ts` | `tests/unit/auth/verification.test.ts` |
| 가입 완료 조건 | `features/auth/actions/complete-signup.ts`, `features/auth/domain/profile.ts` | `tests/integration/auth/complete-signup.test.ts`, `tests/unit/auth/profile.test.ts` |
| 역할 선택·보호 | `features/auth/domain/roles.ts`, `features/auth/guards/require-onboarding.ts` | `tests/unit/auth/role.test.tsx`, `tests/integration/auth/guards.test.ts` |

## 2026-10-02 검증 결과

| 구분 | 명령 | 결과 |
|---|---|---|
| 타입 | `npm run typecheck` | 성공 |
| 단위·통합·커버리지 | `npm run test:coverage` | 14개 파일, 49개 테스트 통과 |
| 커버리지 | 같은 명령 | Statements 92.12%, Branches 85.26%, Functions 96.96%, Lines 92.30% |
| 프로덕션 빌드 | `npm run build` | 성공, 정적 `/`와 서버 인증 경로 생성 확인 |
| 브라우저 | `npm run test:e2e` | Chromium 4개 시나리오 통과; 320·390·1440px 로그인과 랜딩 이동·새로고침 확인 |

커버리지는 이번 단계의 인증 도메인·검증·서비스와 대표 UI/action을 측정한다. Supabase의 얇은 쿠키 어댑터와 Next.js 경계는 타입·빌드·통합·브라우저 테스트로 검증한다.

## 아직 열리지 않은 출시 게이트

- Supabase Preview 프로젝트에 migration과 RLS를 실제 적용하고 권한 시나리오를 재검증해야 한다.
- Google·Kakao·Naver의 실제 Client ID·비밀값·콜백 URL을 Preview에 설정해야 한다.
- 실제 문자 인증 공급자를 선정하고 어댑터를 연결해야 한다. 현재 모의 공급자는 Production에서 실행되지 않는다.
- 실제 계정으로 로그인 취소, 세션 복구, 전화 인증, 역할 저장을 Preview 브라우저에서 왕복 검수해야 한다.

## 독립 검수와 수정

- 독립 코드리뷰에서 인증 사용자가 민감한 프로필·동의 값을 직접 쓸 수 있는 P1 우회가 발견됐습니다.
- 직접 INSERT/UPDATE 정책과 권한을 제거하고, 가입·역할 저장을 사전조건을 확인하는 전용 RPC로 제한했습니다.
- 인증 결과에 만료·소비 시각을 추가하고 가입 완료 트랜잭션에서 일회성으로 소비하도록 수정했습니다.
- 가입 성공 뒤 역할 선택 이동, 랜딩의 `/login` 진입, 이력 덮어쓰기 방지와 보안 회귀 테스트를 추가했습니다.
- 수정 코드의 자동 검증은 통과했지만 실제 Postgres RLS 음성 테스트는 Preview DB가 준비되어야 실행할 수 있습니다. 품질 상태는 **조건부 통과·사용자 승인 대기**입니다.

따라서 현재 상태는 **코드와 로컬 자동 검증 완료**이며, **실제 회원가입 서비스 개시 완료가 아니다**.

## 롤백

1. Vercel Production에는 이 브랜치를 연결하지 않고 직전 안정 배포를 유지한다.
2. 문제가 발견되면 로그인 진입 링크를 기존 체험 폼으로 되돌리고 인증 경로 배포를 중단한다.
3. Supabase 적용 후 되돌릴 때는 `docs/technical/public-v1-data-access.md`의 롤백 순서를 사용한다.
4. 비밀값은 Git이 아니라 Vercel·Supabase 설정에서 제거하거나 회전한다.
