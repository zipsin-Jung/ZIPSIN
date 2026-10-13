# 회원가입 휴대전화 인증·PC 업무 추적표

| 요구사항·수락기준 | 구현 | 자동검사 | 명령·결과 | 현재 상태 |
|---|---|---|---|---|
| ZSD-AUTH-001 AC-1~4 | `app/(auth)/signup/page.tsx`, `app/(auth)/signup/verify/page.tsx`, `features/auth/components/VerificationForm.tsx`, `app/api/phone/*` | TEST-ZSD-AUTH-001~003, `signup-onboarding.spec.ts` | `npm test`: 339 pass, `test:e2e`: 공개 화면 18 pass | UI·오류 처리 통과, 실제 SMS 공급자 미연결 |
| ZSD-WEB-001 AC-1~4 | `app/(app)/homes/page.tsx`, `features/homes/components/HomeDirectory.tsx` | TEST-ZSD-WEB-001~003, `home-pages.test.tsx` | `npm test`: 통과, 1280·1440 인증 E2E: 미실행 | 로그인 시험 계정 필요 |
| ZSD-SESSION-001 AC-1~2 | `app/(app)/my/page.tsx`, `features/auth/actions/logout.ts` | TEST-ZSD-SESSION-001~002, `office-flow-copy.test.tsx` | `npm test`: 통과, 로그아웃 후 보호경로 E2E: 미실행 | 로그인 시험 계정 필요 |

## 검증 경계

- 로컬 공개 화면은 실제 비밀값 대신 연결되지 않는 시험용 환경값으로 검수했습니다.
- 휴대전화 실번호 전송과 로그인 계정의 여러 집 데이터 왕복은 Preview 공급자·시험 계정을 준비한 뒤 별도로 통과해야 합니다.
- 위 두 항목 전에는 Production 승인 상태가 아닙니다.

## 품질 판정

- 독립 재검수: 코드 P0/P1 결함 0건
- 전체 출시 게이트: `FAIL`
- 이유: 실제 SMS 왕복과 인증 사용자 PC·로그아웃 E2E 증거가 아직 없습니다.
