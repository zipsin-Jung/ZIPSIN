# 집신·집신체크 통합 계정 Preview 준비 절차

## 확정 구조

- `zipsin.net`과 `ck.zipsin.net`은 같은 Next.js 앱, 같은 Supabase 프로젝트, 같은 사용자 ID를 사용한다.
- 로그인·회원가입·OAuth callback은 `https://zipsin.net`에서 한 번만 운영한다.
- 집신체크에서 시작한 사용자는 `/login?next=/ck`로 이동하고 인증·역할 선택 뒤 `/ck`로 돌아온다.
- 운영 세션 쿠키는 `Domain=.zipsin.net`, `Secure`, `SameSite=Lax`, `Path=/` 기준으로 두 호스트가 함께 사용한다.
- Preview·localhost에는 운영 도메인 쿠키를 강제하지 않는다.
- 별도 집신체크 회원 DB나 중복 로그인 화면은 만들지 않는다.

## Vercel 환경값

값 자체는 Git에 저장하지 않고 Vercel의 암호화된 환경 설정에만 입력한다.

| 이름 | Production 기준 | Preview 기준 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://zipsin.net` | 해당 Preview 공개 HTTPS 주소 |
| `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` | `.zipsin.net` | 비움 |
| `NEXT_PUBLIC_SUPABASE_URL` | 기존 집신 Supabase URL | 같은 검수용 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 기존 공개 anon key | 같은 검수용 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 비밀 저장소 전용 | 서버 비밀 저장소 전용 |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | 공급자 설정 완료 뒤 `true` | 공급자 설정 완료 뒤 `true` |
| `NEXT_PUBLIC_AUTH_KAKAO_ENABLED` | 공급자 설정 완료 뒤 `true` | 공급자 설정 완료 뒤 `true` |

Production 검사는 `npm run check:account-env`로 실행한다. 운영에서 localhost, HTTP 기준 주소, `.zipsin.net`이 아닌 쿠키 도메인, `AUTH_TEST_MODE=true`는 실패해야 한다.

## Supabase·OAuth 관리자 설정

1. 기존 집신 Supabase 프로젝트에 `202610130001`, `202610130002` migration을 순서대로 적용한다.
2. `profiles`는 기존 `user_id` 기본키와 역할 정보를 유지하며 체크용 열만 추가됐는지 확인한다.
3. Authentication URL 설정의 Site URL은 `https://zipsin.net`으로 둔다.
4. 허용 Redirect URL에 `https://zipsin.net/auth/callback`과 검수할 Preview callback만 등록한다.
5. Google·Kakao 관리자 화면에도 Supabase가 안내한 provider callback URL을 등록하고 공급자를 활성화한다.
6. `candidate-photos`가 비공개인지, 다른 사용자 경로가 RLS로 거부되는지 확인한다.
7. Naver는 공급자 연결이 끝나기 전까지 기능 flag를 켜지 않는다.

## 실제 Preview 검수

1. 비로그인 상태에서 `/ck`의 로컬 집 기록을 만든다.
2. `간편 로그인·회원가입` 또는 `집신에 저장`을 누르면 집신 공용 `/login?next=...`으로 이동하는지 확인한다.
3. 새 회원가입, 기존 아이디 로그인, Google 로그인, Kakao 로그인을 각각 수행한다.
4. 성공 뒤 원래 `/ck` 또는 `/ck/transfer?...`로 돌아오는지 확인한다.
5. 체크 후보를 계정에 옮긴 뒤 새 브라우저에서 같은 계정으로 다시 열리는지 확인한다.
6. `zipsin.net`에서 로그인한 상태로 `ck.zipsin.net`을 열었을 때 재로그인을 요구하지 않는지 확인한다.
7. 로그인 취소, 세션 만료, 사진 부분 실패, 서버·로컬 삭제와 타 사용자 접근 거부를 확인한다.
8. 타입·coverage·build·Playwright·환경값·비밀값 검사를 모두 실행한다.

## 승인 경계

- 코드와 Preview 검수까지는 안전한 작업 브랜치에서 진행한다.
- 사용자 최종 승인 전 Production 배포, DNS 연결, 실사용자 데이터 migration은 하지 않는다.
- 공급자 관리자 설정이 끝나지 않은 상태를 실제 간편 로그인 완료로 보고하지 않는다.
