# 집신체크 계정 이전 검사 결과

- 검사일: 2026-10-14
- 코드: `codex/zipsin-shared-auth-integration`
- Node: 프로젝트 현재 환경

## 통과

- 타입검사: 통과
- Vitest: 104 files 통과·1 file skip, 520 tests 통과·1 test skip
- 명시된 제품 코드 커버리지: statements 92.21%, branches 84.69%, functions 92.68%, lines 96.31%
- Next.js 16.4.0 Production build: 통과
- Playwright Chromium: 38개 통과, 외부 Preview 계정 전용 9개 skip
- `/ck → 공용 로그인 → 공용 회원가입 → 원래 체크 경로 유지`: 실제 Chromium 통과
- 비밀값 검사와 로컬·Production 환경값 규칙 검사: 통과
- 잘못된 Production 기준 주소 `https://ck.zipsin.net` 거부: 통과

## 미실행·차단

- `supabase test db`: 로컬 Docker/Postgres 부재로 `127.0.0.1:54322 ECONNREFUSED`
- 실제 Google/Kakao OAuth: 공급자·callback 관리자 설정이 필요
- `zipsin.net`과 `ck.zipsin.net`의 실제 공유 세션: DNS·Vercel·Supabase Preview 설정 필요
- 다른 기기 서버 복원: Preview migration과 실제 계정 필요
- 200% 확대·스크린리더 수동검사: 별도 수동 증거 없음

따라서 현재 판정은 `배포 전 코드·로컬 브라우저 검증 통과, 외부 Preview 통합검수 대기`이며 Production 승인 상태가 아닙니다. 위 커버리지는 설정에 명시된 제품 로직 범위이며 API route·Supabase repository 전체 수치로 표현하지 않습니다.
