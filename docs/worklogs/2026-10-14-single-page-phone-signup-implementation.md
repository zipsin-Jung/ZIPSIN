# 2026-10-14 단일 화면 휴대폰 인증 회원가입 구현

## 수행 순서

1. 승인 명세와 기존 인증 경계 확인
2. 실패 테스트 작성
3. 익명 휴대폰 challenge와 가입 의도 구현
4. 인증 증거 단일 소비·계정 생성 보상 구현
5. 한 화면 회원가입 UI와 기존 경로 회귀 보강
6. 자동검사·실제 Chromium 브라우저·독립 품질 검수
7. 문서·Git·Preview 상태 정리

## 변경 내용

- 신규 비밀번호 회원가입을 `/signup` 한 화면으로 합쳤다.
- 이메일 바로 아래에서 휴대폰 번호를 입력하고 인증번호를 받아 확인한다.
- 아이디 중복 확인, 비밀번호 규칙·보기, 필수 동의 전체 선택을 유지했다.
- OTP 인증 전에는 Supabase Auth 사용자, 프로필, 아이디, 동의, 유입 데이터를 만들지 않는다.
- 인증 증거는 HttpOnly 가입 의도와 묶어 서버에서 한 번만 소비한다.
- 계정 생성 뒤 제품 데이터 저장이 실패하면 계정을 삭제하고, 삭제 실패는 비공개 정리 대기열에 남긴다.
- OAuth와 기존 미완료 계정용 `/signup/verify`, 로그인·복구 흐름은 유지했다.
- `만 14세 이상` 별도 체크와 가입 가드 의존성을 제거했다. 휴대폰 인증을 법적 본인확인 또는 성인인증으로 표현하지 않는다.

## 검증 결과

- 전체 Vitest: 116개 파일 통과, 1개 파일 제외; 602개 테스트 통과, 1개 제외
- 커버리지: Statements 90.06%, Branches 81.08%, Functions 90.76%, Lines 93.23%
- TypeScript 타입 검사: 통과
- Next.js production build: 통과
- 비밀정보 검사: 추적 파일 754개 통과
- Chromium Playwright: 가입 시나리오 18개 확인; 실제 Route Handler 쿠키 왕복, 200% 글자 확대와 키보드 이동 포함. 전체 병렬 실행에서 서버 지연으로 시간초과한 2개는 1-worker 재실행 통과
- 화면 폭: 320·390·768·1280·1440px 확인
- WebKit: 현재 Playwright 설정에 없어 미검증

## 독립 검수 보완

- 가입 의도 쿠키 범위를 `/`로 수정해 문자 발송 API, 인증 API와 최종 Server Action이 같은 HttpOnly 증거를 사용하게 했다.
- Auth 보상 삭제 실패 시 인증 증거를 즉시 격리해 재사용을 막았다.
- 실패·만료 challenge의 전화번호와 공급자 ID를 24시간 안에 지우는 Supabase Cron 작업을 추가했다.
- 비밀번호 불일치, 제출 처리 중 이중 클릭, OTP 오류 alert와 첫 오류 초점 복구를 보강했다.
- 아이디·이메일·휴대폰 충돌을 해당 입력으로 안내하고 redirect로 폼 전체가 초기화되지 않게 했다.
- 신규 action, 가입 의도와 두 Route Handler를 커버리지 측정 범위에 포함했다.

빌드 성공과 브라우저 검수는 별개 결과로 기록한다.

## 배포 전 남은 일

- Vercel Preview의 SOLAPI 환경값 연결
- 실제 번호로 정상 수신, 오답, 만료, 재전송, 공급자 오류 확인
- OTP 전 계정 0건과 성공 후 관련 데이터 각 1건 확인
- 가입 뒤 `/ck` 복귀와 집신·집신체크 공통 로그인 확인
- 사용자 최종 승인 전 Production 배포 금지

## 2026-10-14 외부 환경 후속 검수

- Supabase Preview 프로젝트에 `202610140004_anonymous_signup_phone.sql`을 적용했다.
- 가입 challenge 테이블, 최종 가입 함수, 15분 정리 Cron이 활성 상태임을 재조회했다.
- Cron은 2026-10-14 13:30 KST에 실제로 `succeeded`했고 정리 함수 직접 실행도 성공했다.
- Vercel Preview 브랜치에 `PHONE_OTP_HMAC_SECRET`를 새 비밀값으로 추가했다. 비밀값 원문은 문서·Git에 저장하지 않았다.
- Preview DB에서 선행 `reserve_auth_sms_send` 함수가 누락된 것을 재현하고, 승인된 `202610140003_auth_recovery_security.sql` 중 문자 발송 제한 테이블·함수를 적용했다.
- Preview 가입 화면에서 가상 번호로 인증 요청을 보내 challenge가 `delivery_status=failed`, 미인증·미소비 상태로 저장되는 것을 확인했다. 따라서 브라우저→Vercel Route Handler→Supabase 연결과 실패 격리는 정상이며, SOLAPI 공급자만 비활성 상태다.
- 확인에 사용한 `010-0000-0000`~`0003` 가상 번호 challenge는 정확한 번호 범위만 삭제해 정리했다.
- Playwright에 WebKit 프로젝트를 추가하고 회원가입 18개 시나리오를 WebKit에서 모두 통과했다.
- 첫 실행에서 기존 landing smoke 1개가 병렬 부하로 5초 시간초과했지만 단독 재현은 420ms로 통과했고, worker 50% 전체 재실행은 602개 통과했다.
- 실제 문자 발송은 SOLAPI API Key, API Secret, 발신번호가 Vercel에 없어 아직 검증할 수 없다. `PHONE_VERIFICATION_PROVIDER=disabled`를 유지해 잘못된 발송은 차단했다.

## 독립 품질 판정

- 최종 재검수: 코드 P0 0건, P1 0건, 코드 품질 PASS
- 출시 판정: PENDING
- 보류 이유: SOLAPI 실문자 가입 정합성과 성공 후 관련 데이터 각 1건 확인 증거가 아직 없다. Preview DB migration·Cron·WebKit은 후속 검수로 확인했다.

## 롤백

새 DB와 API는 기존 인증 흐름을 삭제하지 않고 추가했다. 문제가 생기면 이 기능 커밋을 되돌려 신규 비밀번호 가입 진입만 기존 경로로 복구하고 OAuth, 기존 미완료 계정과 저장 데이터는 보존한다.

DB 객체를 되돌리기 전 `select cron.unschedule('redact-anonymous-signup-phone-challenges');`를 실행한다. 공용 `pg_cron` 확장은 다른 작업이 사용할 수 있으므로 삭제하지 않는다.
