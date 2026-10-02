# Google Workspace DNS 설정 작업 기록

- 날짜: 2026-10-02
- 대상: `zipsin.net`
- 범위: 도메인 확인, Gmail 수신, SPF 발신 인증, DKIM 활성화

## 수행 순서

1. Google Workspace와 가비아 DNS의 현재 상태 확인
2. 기존 웹사이트 연결 레코드를 보존한 채 Google 도메인 확인 TXT 등록
3. Google Gmail용 MX 등록
4. SPF TXT 등록
5. 공개 DNS 조회로 반영 확인
6. Google 관리자 콘솔에서 DKIM 키 확인
7. 가비아에 DKIM TXT 등록 및 공개 DNS 조회
8. Google 관리자 콘솔에서 DKIM 인증 시작

## 변경 내용

- Google Workspace 도메인 소유권 확인 완료
- MX: 루트 도메인에 `smtp.google.com`, 우선순위 1 등록
- SPF: 루트 도메인에 `v=spf1 include:_spf.google.com ~all` 등록
- DKIM: `google._domainkey` TXT 공개키 등록 및 인증 시작
- 기존 `www`, 루트 A, `admin`, `start` 연결 레코드는 변경하지 않음
- 인증 토큰과 계정 로그인 정보는 문서와 Git에 기록하지 않음

## 검증 결과

- 공개 DNS에서 MX `1 smtp.google.com.` 조회 확인
- 공개 DNS에서 SPF TXT 조회 확인
- Google Workspace에서 Gmail 활성화 안내 확인
- 공개 DNS에서 `google._domainkey.zipsin.net` DKIM TXT 조회 확인
- Google 관리자 콘솔에서 `DKIM을 사용하여 이메일 인증 중입니다` 상태 확인
- 가비아 DNS 레코드 수가 8개로 갱신된 화면 확인

## 남은 일

1. 외부 메일과 실제 송수신 시험
2. 수신된 메일 원본에서 SPF·DKIM 통과 여부 확인
3. SPF·DKIM 안정화 후 DMARC `p=none` 관찰 모드 적용 검토

## 주의

- DKIM TXT는 가비아의 길이 제한에 맞춰 두 개의 따옴표 구간으로 나눠 저장했으며 DNS에서는 하나의 키로 결합된다.
- 실제 시험 메일 발송은 제3자에게 메시지를 보내는 행위이므로 사용자의 발송 직전 승인을 받고 진행한다.
