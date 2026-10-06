# 2026-10-06 Supabase Preview 연결 작업보고

## 요청

Supabase 프로젝트를 Vercel Preview에 연결하고, Production에 영향을 주지 않은 상태로 인증 V1의 실제 연결 기반을 준비합니다.

## 수행 순서

1. 저장소의 실제 환경변수 이름 확인
2. Supabase Preview 프로젝트와 migration 상태 확인
3. Vercel Preview 환경변수 등록
4. `codex/public-v1-auth` Preview 재배포
5. 배포·화면·DB 접근 경계 확인
6. 비밀정보 노출 검사와 문서 동기화

## 작업 내용

- Supabase 프로젝트는 서울 리전의 무료 Preview 프로젝트를 사용했습니다.
- `profiles`, `consent_acceptances`, `phone_verification_states`, `user_roles`와 관련 RLS/RPC migration이 적용된 상태를 확인했습니다.
- Vercel에는 다음 변수 이름만 등록했으며 값은 문서와 Git에 기록하지 않았습니다.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- 적용 범위는 Preview로 제한했고 Production 환경은 변경하지 않았습니다.
- 기존 `codex/public-v1-auth` 배포를 최신 프로젝트 설정으로 재배포했습니다.

## 검증 결과

- Vercel 새 Preview 배포: `Ready`
- Preview 랜딩 `/`: 정상 표시
- Preview 로그인 `/login`: 정상 표시
- Google·Kakao·Naver 버튼: 제공자 설정 전이므로 모두 `준비 중`·비활성 상태
- Supabase REST: 실제 `profiles` 테이블까지 요청 도달 확인
- 익명 `profiles` 조회: 테이블 권한 정책에 의해 차단됨을 확인
- 저장소 비밀정보 검색: 프로젝트 비밀키·실제 환경값 미검출

빌드 성공과 브라우저 기능 검수는 구분합니다. 이번 작업에서 실제 소셜 계정 로그인 왕복, 전화번호 인증, 가입 완료 RPC, 역할 저장은 아직 검수하지 않았습니다.

## 남은 일

1. Google OAuth Preview 설정과 왕복 검수
2. Kakao OAuth Preview 설정과 왕복 검수
3. Naver Custom OAuth2 Provider 구현·키 설정·왕복 검수
4. 문자 인증 공급자 결정과 Preview 연결
5. 실제 테스트 계정으로 가입 완료·역할 저장·세션 복구 검수
6. 품질 게이트 후 사용자 승인, 그 이후에만 Production 반영 검토

## 보안과 롤백

- 비밀키는 Vercel Secret 값으로만 저장하며 Git·문서·대화 기록에 남기지 않습니다.
- 문제가 있으면 Preview 환경변수를 제거하고 이전 Preview 배포를 사용합니다.
- Production 배포와 운영 도메인은 이번 작업에서 변경하지 않았습니다.

## 승인 상태

**부분 완료·다음 단계 승인 대기** — Supabase/Vercel Preview 기반 연결은 완료했지만 실제 간편가입과 전화 인증은 미완료입니다.
