# 2026-10-14 집신·집신체크 공용 계정 통합 작업 기록

## 수행 순서

기존 상태 확인 → 인증 구조 병합 → 안전한 복귀·공유 쿠키 구현 → 기존 프로필 호환 수정 → 실패 테스트·구현 → 전체 자동검사 → 실제 Chromium 검사 → 문서·Git 정리 순으로 진행했다.

## 변경

- 집신 본체와 집신체크를 한 Next.js 앱으로 합치고 로그인·회원가입·callback 소유자를 하나로 통일했다.
- `/ck` 기록을 로그인 전 로컬에 보존하고 공용 로그인·회원가입 후 원래 `/ck` 또는 후보 이전 화면으로 돌아오게 했다.
- 운영에서 `.zipsin.net` 공유 세션 쿠키를 사용하고 Preview·localhost에는 도메인을 강제하지 않는다.
- 외부·인코딩 우회·역슬래시·상위 경로를 `next`로 사용할 수 없게 했다.
- 체크 migration이 기존 집신 `profiles.user_id`와 역할을 덮지 않도록 호환 구조로 수정했다.
- 직접 프로필 쓰기 대신 인증 사용자 전용 `complete_check_onboarding` 보안 RPC로 프로필과 유입 출처를 원자 저장한다.
- 배포 환경 검사를 추가하고 운영 localhost·HTTP·잘못된 쿠키 도메인을 차단했다.
- 운영 인증 기준 주소를 정확히 `https://zipsin.net`으로 제한하고 OAuth 실패 뒤에도 안전한 복귀 경로를 유지한다.

## 검증

- Vitest: 520 통과, 1 skip
- 커버리지: statements 92.21%, branches 84.69%, functions 92.68%, lines 96.31%
- TypeScript: 통과
- Next.js 16.4.0 Production build: 통과
- Chromium: 38 통과, 외부 Preview 계정 전용 9 skip
- 비밀값·환경값 검사: 통과
- GitHub 안전 브랜치 푸시: 완료
- Vercel 브랜치 주소 생성: 확인, 접근 보호로 제품 화면 검수는 대기

## 남은 일

- Supabase·Google·Kakao·Vercel 관리자 설정
- Preview에서 실제 소셜 로그인, 두 호스트 공유 세션, 다른 기기 복원, RLS·Storage 왕복 검수
- 사용자 승인 뒤에만 Production·DNS 반영

## 회원가입 긴급 보완

- 비밀번호를 소문자·숫자·특수문자 포함 8자 이상으로 서버와 브라우저에서 동일하게 검사한다.
- 눈 아이콘을 올리거나 눌러 비밀번호를 확인할 수 있다.
- 이용약관·개인정보 필수 동의를 한 번에 선택할 수 있다.
- 첫 계정 생성 화면의 중복 연령 체크를 제거했다.
- 서버 전용 가입 설정 누락 예외를 잡아 검은 오류 화면 대신 `/signup?error=service_unavailable`로 복귀시킨다.
- 전체 525개 자동 테스트, 커버리지 문장 92.16%·분기 84.92%·함수 92.05%·줄 96.11%, 타입검사, Production build, 회원가입 Chromium 10개 시나리오를 통과했다.

## 실제 운영 연결 검수

- GitHub 원격 브랜치 `codex/zipsin-shared-auth-integration`의 최신 커밋이 `a3f51ae`인 것을 확인했다.
- GitHub의 Vercel 배포 상태는 Preview 성공이지만, Preview 주소는 Vercel Authentication의 302 로그인 보호가 적용되어 일반 사용자가 회원가입 화면에 접근할 수 없다.
- `https://zipsin.net/signup`과 `https://zipsin.vercel.app/signup`은 모두 HTTP 404를 반환했다. 운영 `main`은 회원가입 통합 브랜치를 아직 포함하지 않는다.
- 따라서 현재 일반 사용자가 운영 주소에서 실제 회원가입을 완료하고 Supabase `Authentication > Users`에 등록되는 시나리오는 검수할 수 없으며, 광고 유입을 열 수 있는 상태가 아니다.
- 이 작업 환경에는 Vercel·Supabase 관리자 CLI 세션과 운영 환경값이 없어 Preview DB의 최신 migration 적용 여부와 실제 Users 생성 여부를 확인하거나 변경하지 않았다.
- 다음 필수 순서는 Preview 보호 해제 또는 검수자 접근 허용 → Vercel Preview 환경값 확인 → Supabase migration 확인 → 테스트 계정 가입 → Auth Users와 관련 테이블 기록 확인 → 사용자 승인이다.
