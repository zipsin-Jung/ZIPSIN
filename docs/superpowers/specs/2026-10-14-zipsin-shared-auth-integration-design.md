# 집신·집신체크 통합 인증 설계

- 작성일: 2026-10-14
- 상태: 사용자 방향 승인, 서면 검토 대기
- 선행 요구사항: ZCA-002, DEC-022
- 대상 주소: `zipsin.net`, `ck.zipsin.net`

## 1. 목적

집신체크에서 가입한 사용자가 별도 회원이 아니라 곧바로 집신 회원이 되게 한다. 집신과 집신체크는 같은 인증 시스템, 같은 사용자 ID와 같은 회원가입 흐름을 사용하며, 어느 쪽에서 로그인해도 다른 쪽에서 다시 로그인하지 않는다.

## 2. 확정 구조

1. `zipsin.net`과 `ck.zipsin.net`은 같은 Next.js App Router 서버 앱과 같은 Supabase 프로젝트를 사용한다.
2. 로그인·회원가입·아이디 로그인·Google·Kakao 간편로그인은 집신 본체의 기존 인증 컴포넌트와 서버 로직을 한 벌만 사용한다.
3. 인증 시작과 OAuth callback은 `zipsin.net`에 중앙화한다.
4. 집신체크에서 인증을 시작하면 서버가 만든 불투명한 1회용 intent에 복귀 대상과 후보 ID를 연결한다. 브라우저가 보낸 임의 외부 URL은 복귀 주소로 사용하지 않는다.
5. 인증 성공 후 `ck.zipsin.net`으로 돌아와 기존 localStorage·IndexedDB 기록을 다시 읽는다. 로그인 페이지가 체크 기록을 직접 읽거나 옮기지 않는다.
6. 세션 쿠키는 Production에서 `.zipsin.net` 범위로 공유하되 `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`를 적용한다. Preview에서는 운영 도메인 쿠키를 흉내 내지 않고 같은 배포의 검증용 호스트 정책을 별도로 둔다.
7. 신규 집신체크 유입자는 `signup_source=zipsin_check`를 남기고 임차인 시작 목적을 확인한다. 기존 회원의 역할은 덮어쓰지 않으며 이 값만으로 특정 집·계약·사무소 권한을 만들지 않는다.

## 3. 사용자 흐름

### 신규 사용자

`ck.zipsin.net/ck → 간편 로그인·회원가입 → zipsin.net/login → Google·Kakao 또는 회원가입 → zipsin.net/auth/callback → 온보딩 확인 → ck.zipsin.net 원래 화면 복귀`

### 기존 사용자

`ck.zipsin.net/ck → 로그인 → zipsin.net/login → 기존 집신 계정 인증 → ck.zipsin.net 원래 화면 복귀`

### 집신에서 시작한 사용자

`zipsin.net 로그인 → 집신체크 이동 → ck.zipsin.net에서 동일 세션 확인 → 별도 로그인 없이 사용`

### 취소·실패

OAuth 취소, 공급자 오류, 세션 만료가 발생해도 `/ck` 로컬 후보·체크·메모·사진은 삭제하지 않는다. 사용자는 같은 후보에서 다시 로그인할 수 있다.

## 4. 수락 기준

- `AUTH-SSO-01`: 두 주소에서 같은 Supabase 사용자 ID를 확인한다.
- `AUTH-SSO-02`: 한쪽에서 로그인한 뒤 다른 쪽에서 추가 로그인 없이 인증 상태를 확인한다.
- `AUTH-SSO-03`: 집신체크의 로그인·회원가입 UI와 동작은 집신 본체 공용 컴포넌트를 사용하며 별도 계정 UI를 유지하지 않는다.
- `AUTH-SSO-04`: 신규 가입은 집신 회원으로 생성되고 `signup_source=zipsin_check`가 기록된다.
- `AUTH-SSO-05`: 집신체크에서 시작한 인증은 성공·취소·실패 뒤 허용된 `/ck` 화면으로 돌아간다.
- `AUTH-SSO-06`: 외부 URL, 프로토콜 상대 URL, 이중 인코딩 URL과 허용되지 않은 호스트 복귀를 거부한다.
- `AUTH-SSO-07`: 인증 성공 전후 localStorage·IndexedDB 원본이 유지된다.
- `AUTH-SSO-08`: 로그아웃하면 두 주소 모두 인증 상태가 해제된다.
- `AUTH-SSO-09`: 기존 회원의 역할을 덮어쓰지 않고 신규 임차인 시작값만 저장한다.
- `AUTH-SSO-10`: 임차인 시작값만으로 특정 집·계약·사무소 관계를 생성하지 않는다.

## 5. 공급자와 운영 설정

- Google·Kakao는 Supabase 대시보드에서 실제 공급자 키를 등록하고 활성화한 뒤에만 사용 가능으로 표시한다.
- Naver는 Custom OAuth 매핑과 실제 성공 검증 전까지 숨긴다.
- Supabase Site URL과 Redirect URL allowlist에는 운영·Preview 주소를 분리해 정확하게 등록한다.
- Production callback은 `https://zipsin.net/auth/callback`으로 고정한다.
- `NEXT_PUBLIC_SITE_URL`이 localhost 또는 `127.0.0.1`인 Production 빌드는 배포 검증에서 실패시킨다.
- 비밀키는 Vercel 환경변수와 공급자 관리자 화면에만 두며 Git·문서·브라우저 번들에 저장하지 않는다.

## 6. 통합 방법

집신 본체 인증이 있는 브랜치를 통합 기준으로 삼고 집신체크 기능을 그 앱에 병합한다. 집신체크 브랜치에 또 다른 인증 시스템을 복제하지 않는다. 공용 인증 컴포넌트와 서버 액션은 `features/auth` 한곳에서 관리하고, `/ck`는 인증 결과를 소비하는 공개 서브서비스로 유지한다.

## 7. 검증 기준

- 단위·통합: 안전한 복귀, 공급자 상태, callback 중복, 세션 만료, 신규·기존 프로필, 역할 비상승
- 보안: 비로그인 401, 타 사용자 후보 접근 거부, 임의 redirect 거부, 서버 전용 키 번들 0건
- E2E: `/ck → 가입/로그인 → /ck 복귀`, 집신↔집신체크 왕복, 새로고침, 두 도메인 로그아웃, OAuth 취소·오류
- 반응형·접근성: 320px, 390px, 768px, 1440px, 키보드, 포커스, 200% 확대
- 품질 게이트: 제품 코드 statements·branches·functions·lines 각각 80% 이상, P0·P1 0건

실제 공급자 로그인과 두 운영 도메인의 공유 세션을 Preview에서 확인하기 전에는 연동 완료 또는 배포 가능으로 보고하지 않는다.
