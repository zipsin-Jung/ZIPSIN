# 2026-10-16 회원가입 재디자인 · 아이디·비밀번호 찾기 · 이메일 확인 제거

## 순서

기획(사용자 지시 3건) → 시안 ⑤~⑨ → 사용자 승인("좋아") → TDD 개발 → 테스트 → 브라우저 확인·수정 → 문서 → 커밋·Preview.

## 바뀐 화면

| 화면 | 주소 | 시안 |
|---|---|---|
| 회원가입(이름 추가, 3단계 진행 표시, 비밀번호 조건 실시간 체크, 인증번호 5분 타이머) | `/signup` | ⑤⑥ |
| 가입 완료 → 집신 시작하기 | `/signup/complete` (신규) | ⑦ |
| 아이디 찾기(이메일 → 가린 아이디 바로 표시) | `/account-recovery` | ⑧ ⑨-A |
| 비밀번호 재설정(이름 + 휴대폰 인증) | `/account-recovery?tab=password` | ⑧ |
| 새 비밀번호 만들기 | `/reset-password` | ⑨-B |
| 비밀번호 변경 완료 | `/reset-password/done` (신규) | ⑨-C |

## 추적표 (소스 ↔ 테스트)

| 소스 | 테스트 ID |
|---|---|
| `features/auth/services/login-with-username.ts` | TEST-LOGIN-EMAIL-001~004 |
| `features/auth/actions/login-with-username.ts` | TEST-LOGIN-EMAIL-005 |
| `features/auth/domain/mask.ts` | TEST-FIND-MASK-*, TEST-FIND-NAME |
| `features/auth/services/find-username-by-email.ts` | TEST-FIND-ID-001~004 |
| `app/api/auth/recovery/username/route.ts` | TEST-FIND-API-001~003 |
| `features/auth/services/phone-account-recovery.ts` | TEST-PWRESET-001~004 |
| `app/api/auth/recovery/phone/send/route.ts` | TEST-PWRESET-API-001~004 |
| `features/auth/components/AccountRecoveryForm.tsx` | TEST-FIND-UI-001~004, TEST-PWRESET-UI-001~006 |
| `features/auth/actions/register-verified-password-account.ts` | TEST-SIGNUP-NOEMAIL-001, TEST-SIGNUP-NAME-001 |
| `features/auth/components/PasswordSignupForm.tsx` | TEST-SIGNUP-UI-001~003 + 기존 테스트 |
| `app/(auth)/signup/page.tsx` | TEST-SP-FLOW-01, TEST-SP-NOEMAIL-01 |
| `features/auth/components/NewPasswordFields.tsx` | TEST-NEWPW-001~002 |
| `features/auth/actions/update-password.ts` | TEST-NEWPW-ACT-001~003 |

## 증거

- 타입 오류 0건.
- 단위·통합 795 통과·2 skip(실DB 필요 항목, 통과로 합산하지 않음).
- 커버리지: 줄 92.77%, 분기 83.01%, 함수 89.39%, 구문 89.38%.
- `next build` 성공.
- 로컬 브라우저 1440·390px 확인. 390px에서 휴대폰 번호 버튼이 화면 밖으로 밀리는 문제를 찾아 고쳤다(가로 스크롤 0).

## 아직 증거 없음 (통과 아님)

- Preview에서 실제 문자 왕복(가입·비밀번호 재설정).
- Preview DB에서 `admin.createUser` 가입 → 자동 로그인 → 완료 화면.
- 다계정 Postgres/RLS 검증(출시 차단 항목, 그대로 남음).

## 발견한 빈틈

- 이용약관·개인정보처리방침 페이지가 없다. 동의 체크박스는 있지만 "보기" 링크는 가짜로 만들지 않았다. **출시 전 실제 문서 필요(사용자 결정 필요).**

## 10:56 사용자 피드백 반영

- 시안 ⑨를 순서대로 보기(비밀번호 ①→④, 아이디 결과 A/B)로 다시 그림.
- 아이디 찾기 결과: "이 아이디로 로그인하기" + "비밀번호도 기억나지 않아요". 없을 때는 "다시 찾기"가 주 버튼이고 회원가입은 작은 링크로.
- 비밀번호 재설정에 **아이디** 칸 추가: 아이디·이름·휴대폰이 모두 맞아야 문자 발송.
- 새 비밀번호 화면에 "아이디 · 이름 · 가린 번호 확인됨" 표시.
- 서버의 profiles 읽기 권한 migration `202610160001`은 작성만 함. **실제 DB 적용은 사용자 승인 대기.**
- 테스트 798 통과·2 skip.
