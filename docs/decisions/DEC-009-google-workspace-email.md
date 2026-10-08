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

- 2026-10-02 Google Workspace Starter 가입과 관리자 계정 생성 완료
- `zipsin.net` 도메인 소유권 확인 완료
- MX `smtp.google.com`, 우선순위 1 등록 및 공개 DNS 조회 확인 완료
- Gmail 활성화 완료
- SPF `v=spf1 include:_spf.google.com ~all` 등록 및 공개 DNS 조회 확인 완료
- DKIM 공개키를 `google._domainkey.zipsin.net`에 등록하고 공개 DNS 조회 확인 완료
- Google 관리자 콘솔에서 `DKIM을 사용하여 이메일 인증 중입니다` 상태 확인 완료
- DMARC는 SPF와 DKIM 안정화 후 관찰 모드로 적용 예정
- 회사 계정에서 외부 개인 Gmail로 시험 메일 발송 완료
- Google 관리자 이메일 로그에서 `1/1 전송됨`, Google 내부 서버 전달 완료 확인
- 수신 계정 검색 색인이 지연되어 수신 메일 원본의 SPF·DKIM `PASS` 표시는 후속 확인 필요

## 안전 원칙

- Google 관리자 비밀번호, 복구코드, 결제정보와 DNS 로그인 정보를 채팅·문서·Git에 저장하지 않는다.
- 관리자 계정에는 다단계 인증을 사용한다.
- SPF에는 실제 발송 서비스를 모두 포함하되 SPF TXT 레코드를 중복 생성하지 않는다.
- DMARC는 SPF·DKIM 설정 후 관찰 결과를 확인하며 강화한다.

## 비용·권한

Google Workspace 구독과 결제는 사용자 명의로 진행한다. 외부 구매·결제와 관리자 계정 생성은 사용자가 직접 승인하고 수행한다.
