# 집신체크 계정 이전 검사 결과

- 검사일: 2026-10-13
- 코드: `codex/zipsin-check-comparison-v2`
- Node: 프로젝트 현재 환경

## 통과

- 타입검사: 통과
- Vitest: 27 files, 130 tests 통과
- 대표 기능 컴포넌트 커버리지: statements 87.48%, branches 83.38%, functions 85.90%, lines 95.48%
- Next.js 16.4.0 Production build: 통과
- Playwright Chromium: 데스크톱·390px 총 6개 시나리오 통과
- npm production audit: 취약점 0건
- 비밀값·환경값 이름 검사: 통과

## 미실행·차단

- `supabase test db`: 로컬 Docker/Postgres 부재로 `127.0.0.1:54322 ECONNREFUSED`
- 실제 Google/Kakao OAuth: 공급자 키·Preview callback 미설정
- 다른 기기 서버 복원: Preview DB 미설정
- 앱 내 브라우저 수동 검수: `127.0.0.1:3100/ck` 접속, 진입화면, 필수 5개 체크 화면 확인
- 200% 확대·스크린리더 수동검사: 별도 수동 증거 없음

따라서 현재 판정은 `로컬 구현·대표 기능 검증 통과, Preview 통합검수 차단`이며 Production 승인 상태가 아닙니다. 위 커버리지는 설정에 명시된 대표 기능 파일 범위이며 API route·Supabase repository 전체 수치로 표현하지 않습니다.
