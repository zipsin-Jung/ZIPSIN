# DEC-009 회사 이메일 서비스로 Google Workspace 사용

- 날짜: 2026-10-02
- 상태: 사용자 승인
- 결정자: 사용자

## 결정

`zipsin.net` 회사 이메일의 송수신 서비스로 Google Workspace를 사용한다.

## 우선 생성할 주소

- `privacy@zipsin.net`: 개인정보 문의와 권리 행사
- `support@zipsin.net`: 고객 지원
- `hello@zipsin.net`: 일반 문의
- `noreply@zipsin.net`: 시스템 발송 전용 주소

`noreply`는 일반 문의 수신창구로 사용하지 않는다. 회원가입 인증메일은 서비스용 발송 시스템과 분리하고, 발송 도메인의 SPF·DKIM·DMARC 정합성을 확인한다.

## 설정 순서

1. 사용자 명의로 Google Workspace 가입과 관리자 계정 생성
2. Google에서 제공하는 TXT 레코드로 `zipsin.net` 소유권 확인
3. 가비아 DNS에 Google Workspace MX 레코드 추가
4. Gmail 활성화 및 실제 외부 주소와 송수신 시험
5. SPF 설정
6. DKIM 키 생성·DNS 등록·서명 활성화
7. SPF와 DKIM 안정화 후 DMARC를 관찰 모드부터 단계적으로 적용
8. 개인정보처리방침과 서비스 화면에 실제 수신 가능한 문의 주소 반영

## 현재 확인 상태

- 결정 시점에 `zipsin.net`의 MX, SPF, DKIM, DMARC 레코드는 확인되지 않았다.
- DNS 값은 Google 관리자 화면에서 발급된 값을 기준으로 등록한다.
- Google 공식 안내의 신규 MX 값은 `smtp.google.com`, 우선순위 1이다.

## 안전 원칙

- Google 관리자 비밀번호, 복구코드, 결제정보와 DNS 로그인 정보를 채팅·문서·Git에 저장하지 않는다.
- 관리자 계정에는 다단계 인증을 사용한다.
- SPF에는 실제 발송 서비스를 모두 포함하되 SPF TXT 레코드를 중복 생성하지 않는다.
- DMARC는 SPF·DKIM 설정 후 관찰 결과를 확인하며 강화한다.

## 비용·권한

Google Workspace 구독과 결제는 사용자 명의로 진행한다. 외부 구매·결제와 관리자 계정 생성은 사용자가 직접 승인하고 수행한다.
