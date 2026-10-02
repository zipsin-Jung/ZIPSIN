# Google Workspace 이메일 결정 작업 기록

- 날짜: 2026-10-02
- 사용자 승인: `zipsin.net` 회사 이메일에 Google Workspace 사용

## 확인과 결정

- 현재 도메인에서 MX·SPF·DKIM·DMARC 레코드가 확인되지 않았습니다.
- Google Workspace를 회사 메일 송수신 서비스로 사용하기로 확정했습니다.
- 우선 주소는 `privacy`, `support`, `hello`, `noreply`로 정리했습니다.

## 다음 작업

사용자가 Google Workspace 가입과 관리자 계정을 만든 뒤, Google이 제공하는 도메인 확인 TXT 값을 가비아 DNS에 등록합니다. 이후 MX, SPF, DKIM, DMARC 순서로 설정하고 외부 송수신을 검사합니다.

## 미실행 항목

- Google Workspace 구매·가입
- 가비아 DNS 변경
- 메일 계정 생성
- 실제 송수신 검사

위 항목은 외부 계정 로그인과 결제가 필요하므로 아직 수행하지 않았습니다.
