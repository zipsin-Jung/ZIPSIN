# Google Workspace DNS 설정 작업 기록

- 날짜: 2026-10-02
- 대상: `zipsin.net`
- 범위: 도메인 확인, Gmail 수신, SPF 발신 인증, DKIM 준비

## 수행 순서

1. Google Workspace와 가비아 DNS의 현재 상태 확인
2. 기존 웹사이트 연결 레코드를 보존한 채 Google 도메인 확인 TXT 등록
3. Google Gmail용 MX 등록
4. SPF TXT 등록
5. 공개 DNS 조회로 반영 확인
6. Google DKIM 키 생성 상태 확인

## 변경 내용

- Google Workspace 도메인 소유권 확인 완료
- MX: 루트 도메인에 `smtp.google.com`, 우선순위 1 등록
- SPF: 루트 도메인에 `v=spf1 include:_spf.google.com ~all` 등록
- 기존 `www`, 루트 A, `admin`, `start` 연결 레코드는 변경하지 않음
- 인증 토큰과 계정 로그인 정보는 문서와 Git에 기록하지 않음

## 검증 결과

- 공개 DNS에서 MX `1 smtp.google.com.` 조회 확인
- 공개 DNS에서 SPF TXT 조회 확인
- Google Workspace에서 Gmail 활성화 안내 확인
- 가비아 DNS 레코드 수가 7개로 갱신된 화면 확인

## 남은 일

1. Google의 도메인 준비가 완료되면 DKIM 키를 발급받아 가비아 TXT에 등록
2. Google에서 DKIM 서명 활성화 확인
3. 외부 메일과 실제 송수신 시험
4. SPF·DKIM 안정화 후 DMARC `p=none` 관찰 모드 적용 검토

## 주의

- Google 화면은 마지막 확인 시 `도메인 DNS 설정을 확인하는 동안 이 페이지를 열어 두세요` 상태였다.
- DKIM 키가 표시되기 전에는 임의의 키 값을 만들거나 등록하지 않는다.
