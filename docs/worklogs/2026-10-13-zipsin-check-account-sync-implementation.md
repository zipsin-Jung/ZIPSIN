# 2026-10-13 집신체크 단일계정·후보기록 이전 구현

## 수행 순서

1. 승인된 명세·계획과 Next.js 16 로컬 문서를 확인했습니다.
2. 실패 테스트부터 환경·세션·OAuth 안전복귀 기반을 구현했습니다.
3. 후보·manifest·RLS·비공개 Storage migration을 작성했습니다.
4. 이전 미리보기, 로그인·온보딩, 텍스트·사진 이전, 검증·결과 화면을 구현했습니다.
5. 내 후보집 목록·상세·서버 삭제와 현재 브라우저 삭제를 분리했습니다.
6. 타입, 단위·통합, 커버리지, build, audit, secret, Chromium E2E를 실행했습니다.

## 검증 결과

- Vitest: 27 files, 130 tests
- 대표 기능 범위 statements 87.48%, branches 83.38%, functions 85.90%, lines 95.48%
- Next.js 16.4.0 Production build 통과
- Playwright Chromium desktop·390px: 6개 통과
- npm production audit: 0
- 비밀값·환경값 검사: 통과

## 차단·남은 일

- Docker/Postgres 부재로 `supabase test db` 연결 실패
- 실제 Google/Kakao OAuth와 Preview callback 미설정
- 실제 서버 기반 다른 브라우저 복원·삭제 미검수
- 앱 내 브라우저에서 `/ck` 진입과 필수 5개 체크 화면을 직접 확인함
- 200% 확대·스크린리더 수동 증거 없음

이 범위는 코드·로컬 자동검사 단계이며 Production 배포 완료가 아닙니다.

## 독립 검수 반영

- 클라이언트가 보낸 expected 값 대신 서버가 후보·답변·사진 수를 재계산하도록 수정했습니다.
- 사진 하나가 실패해도 finalize를 수행하고 partial·실패 항목을 표시하며 재시도를 연결했습니다.
- Storage 정책이 사용자 prefix만이 아니라 실제 소유 후보 ID도 확인하도록 강화했습니다.
- 컴포넌트 커버리지와 아직 실행하지 못한 Preview 통합검사를 구분해 문서화했습니다.
