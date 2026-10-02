# 2026-10-02 공개형 서비스 V1 1단계 인증 작업보고

## 수행 순서

1. 기존 문서·코드·배포 상태 확인
2. 서버 런타임과 테스트 기반 전환
3. Supabase 세션·환경값·데이터/RLS 설계
4. Google·Kakao·Naver 로그인 진입과 콜백 구현
5. 전화 인증 경계·동의·가입 완료 구현
6. 역할 선택·보호된 앱 셸 구현
7. 타입·커버리지·빌드·브라우저 검증과 문서화

## 변경 내용

- 기존 랜딩 `/`를 보존하고 Next.js App Router 서버 런타임으로 전환했습니다.
- `/login`에 Google·Kakao·Naver 제공자 상태와 오류 복구를 구현했습니다.
- OAuth 콜백의 누락 코드·제공자 오류·외부 `next` 경로를 안전하게 처리합니다.
- `/signup/verify`에 전화 인증, 이름·이메일 확인, 필수/선택 동의를 구현했습니다.
- 운영 환경에서는 모의 전화 인증이 작동하지 않도록 차단했습니다.
- 프로필·동의·전화 인증 상태·역할 테이블, RLS와 가입 완료 RPC migration을 추가했습니다.
- `/onboarding/role`과 보호된 `/home`을 만들었고 역할 선택이 집·사무소 권한을 부여하지 않도록 분리했습니다.

## 검증 결과

- `npm run typecheck`: 성공
- `npm run test:coverage`: 12개 파일, 45개 테스트 통과
- 커버리지: Statements 94.44%, Branches 88.05%, Functions 96.15%, Lines 95.12%
- `npm run build`: 성공
- `npm run test:e2e`: Chromium 4개 통과; 320·390·1440px 확인
- P0·P1: 로컬 자동 검증에서 발견되지 않음

빌드와 실제 브라우저 검수는 별도 결과입니다. 브라우저 검수는 키가 필요 없는 공개 랜딩·로그인 화면만 통과했습니다.

## 남은 일과 승인 게이트

- Supabase Preview DB migration/RLS 실행: 로컬 Docker/Postgres가 없어 미실행
- 실제 Google·Kakao·Naver 로그인 왕복: 제공자 키와 Preview URL이 없어 미실행
- 실제 문자 인증: 공급자 선정·계약·운영 키가 없어 미연결
- 실제 계정 세션 복구·역할 저장: 위 Preview 구성이 끝난 뒤 실행
- 사용자 최종 검토와 Production 반영 승인

실제 접수·실결제는 구현하지 않았습니다. 이 단계는 인증 기반만 다룹니다.

## 롤백

- Production은 기존 안정 버전을 유지합니다.
- 인증 진입에 문제가 생기면 로그인 링크를 비활성화하고 기존 랜딩 체험 흐름으로 복귀합니다.
- DB 롤백은 `docs/technical/public-v1-data-access.md`의 순서를 따릅니다.
