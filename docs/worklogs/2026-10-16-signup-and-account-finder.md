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

## 11:36~ Preview 점검 (사용자: "배포 직전까지 판단에 맡김")

- 비밀번호 재설정을 이메일 + 이름 + 휴대폰으로 변경(사용자 제안 채택). 테스트 312 auth 통과.
- Preview 공개 화면 10개 200, 로그인 필요 화면 11개는 로그인으로 이동(정상).
- **발견:** Preview DB에 일부 migration이 없다.
  - `verify_account_recovery_challenge` 없음(PGRST202) → `202610140002`·`202610140003` 미적용 추정.
  - `202610140003`에 문자 발송 제한 `reserve_auth_sms_send`가 있어 **가입 문자도 실패할 가능성** 높음.
  - `profiles`에 service_role 읽기 권한 없음(42501) → `202610160001` 필요.
  - `202610140004`(가입 전 휴대폰 인증)는 있음.
- 읽기 전용 점검 SQL: `docs/deployment/sql/2026-10-16-check-applied-migrations.sql`
- 다음: 사용자 Supabase 로그인 → 점검 SQL 실행 → Preview·Production 같은 DB인지 확인 → 빠진 migration 순서대로 적용.

## 14:00~ Supabase 확인과 남은 차단

- 사용자 로그인으로 확인: Supabase 프로젝트는 `ZIPSIN Preview`(활성, 서울)와 `ZIPSIN`(일시 중단) 두 개. Preview가 쓰는 DB는 `ZIPSIN Preview`.
- 읽기 전용 점검 결과 빠진 migration 7개: 202610130011, 202610130102, 202610140001, 202610140002, 202610140003, 202610150001, 202610160001.
- 일괄 적용 SQL(begin/commit, 전부 성공 또는 전부 취소): `docs/deployment/sql/2026-10-16-apply-missing-migrations-preview.sql`
- Claude가 Supabase 대시보드에서 직접 실행하려 했으나 안전 정책이 실서비스 DB 변경으로 판단해 차단. 우회하지 않음. **사용자가 직접 붙여넣어 실행해야 함.**
- 사용자용 눌러보기 체크리스트를 Artifact로 발행(0번 DB 적용 → 1~5번 흐름 → 남은 일).
- 전체 테스트 통과 유지.

## 18:07 앱 받기 QR · 홈 상단 서비스 메뉴 (사용자 승인·요청)

- 시안 ⑩ 승인("좋아"). PC에서 "앱으로 다운로드" → QR 창(지금 주소 기준 `/?install=1`). 크롬 PC면 "이 PC에 설치하기"도 함께.
- 휴대폰이 QR로 들어오면 홈 화면 추가 안내가 자동으로 열리고 주소의 `?install=1`은 지움. 갤럭시(설치 지원)는 "집신 앱 설치하기" 버튼 하나.
- 앱스토어 앱이 아니므로 "찍으면 자동 설치"는 불가(아이폰은 사용자가 "추가"를 직접 눌러야 함)를 안내에 명시.
- 홈 상단 메뉴: 집신체크(실서비스는 https://ck.zipsin.net/, Preview·로컬은 /ck) · 집신클린(준비 중) · 집신수리(준비 중). 준비 중은 링크 없이 표시만.
- 의존성: qrcode 1.5.4, @types/qrcode 1.5.5(정확한 버전 고정).
- 테스트 807 통과·2 skip, 커버리지 줄 92.88%·분기 83.34%, build 성공, 1440·390px 확인(PC 설치 창 가운데 정렬 수정).
- 출시 전 할 일 추가: zipsin.net 배포 때 ck.zipsin.net 도메인(Vercel·가비아 DNS)도 함께 연결해야 홈의 집신체크 링크가 열린다.

## 18:24 홈 상단 수정 (사용자 요청)

- 상단 버튼 "웹에서 시작하기" → "회원가입".
- 서비스 순서: 집신체크 · 집신수리 · 집신클린. 수리·클린은 누르면 화면 가운데 "준비 중이에요" 안내만(다른 화면으로 이동하지 않음). 1440·390px 확인.
