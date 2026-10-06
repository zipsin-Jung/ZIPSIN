# 2026-10-06 Supabase Preview 연결 대화 기록

## 배경

사용자는 누구나 가입하고 이후 유료 진행까지 가능한 집신 공개형 서비스를 만들고자 했습니다. 사업자 등록과 실제 결제는 뒤 단계로 분리하고, 먼저 테스트 환경에서 회원가입 기반을 연결하기로 했습니다.

## 이번 대화에서 확정한 내용

- Supabase 프로젝트 URL, 공개 키, 서버 전용 비밀키를 Vercel Preview에 저장하는 것을 사용자가 승인했습니다.
- Production 환경과 결제는 변경하지 않습니다.
- 인증 V1 migration이 적용된 Supabase Preview를 `codex/public-v1-auth` Preview 배포에 연결합니다.
- 실제 소셜 로그인 제공자와 문자 인증이 준비되기 전에는 가입이 완성됐다고 표현하지 않습니다.
- 비밀키 값은 Git, 문서, 대화 요약에 기록하지 않습니다.

## 실행 결과

- Vercel Preview 전용 환경값 등록
- `codex/public-v1-auth` 새 Preview 재배포 및 `Ready` 확인
- 공개 랜딩과 로그인 화면 확인
- Supabase DB 요청 도달 및 익명 접근 차단 확인

## 이어갈 질문

- Google, Kakao, Naver 중 어떤 공급자부터 실제 OAuth를 연결할지
- 전화번호 인증 공급자와 예상 비용을 어떤 기준으로 선택할지
- 테스트 계정과 개인정보 보관 기간을 어떻게 운영할지
