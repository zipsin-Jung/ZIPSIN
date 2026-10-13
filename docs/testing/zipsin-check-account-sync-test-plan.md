# 집신체크 단일계정·후보기록 이전 테스트 계획

## 자동검사

- 정적: TypeScript, Next.js Production build, 비밀값 검사, 환경값 이름 검사, npm audit
- 단위·통합: 환경, 안전한 복귀경로, 공급자 상태, 온보딩, manifest, 멱등 이전, 사진 실패·cleanup, 이전 실행기, 후보 삭제
- 브라우저: Chromium 데스크톱과 390px 모바일에서 비회원 기록·새로고침, 이전 미리보기·취소, Google·Kakao 간편가입 활성, 일반 가입의 이전 동의 미요구
- DB: pgTAP으로 2사용자 RLS·Storage 경로·유입/권한 분리. 실제 실행에는 Docker 또는 Preview Supabase가 필요하다.

## 품질 문턱

- statements, branches, functions, lines 각각 80% 이상
- P0·P1 0건
- 실제 OAuth 성공·취소·세션 복구와 DB RLS는 Preview Supabase에서 통과해야 한다.
- 빌드 성공과 브라우저 성공을 분리 보고한다.
