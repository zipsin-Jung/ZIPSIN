# 집신 정식 웹앱·채팅·고객지원 품질 보고서

- 검수 버전: `codex/public-v1-auth` Preview 배포본
- 환경: macOS 로컬, Next.js 16.3.6, Vercel Preview, 실제 Preview 최신 migration 미적용
- 판정: **FAIL — Production 배포 승인 불가**

## 통과한 로컬 항목

- 단위·통합·정적 스트레스 검사: 62개 파일, 303개 통과
- 타입 검사와 Production build
- 선택된 인증·채팅 제품 코드의 문장·분기·함수·줄 커버리지 각각 80% 이상
- 비로그인 로그인 화면 320·390·1440px 가로 넘침 없음, 콘솔 오류 없음
- Chromium 자동검사 320·390·1440px 3건 통과. WebKit은 로컬 실행 파일 미설치로 시작하지 못해 미검증

커버리지: 문장 91.00%, 분기 83.75%, 함수 91.17%, 줄 91.73%.
- 담당자 문구, 가상 수치, 사전가입·데모 문구를 실제 앱 홈에서 제거
- GitHub 최신 브랜치 푸시와 Vercel Preview 배포 성공
- 허용된 실제 브라우저에서 `/`→`/login` 즉시 이동과 `/signup` 실제 회원가입 화면 확인

## 열린 출시 차단 항목

| ID | 심각도 | 실제 상태 | 필요한 증거 |
|---|---|---|---|
| RELEASE-P1-01 | P1 | Preview DB에 최신 관계·채팅·지원 migration 미적용 | 백업·적용·행 수·RLS 확인 |
| RELEASE-P1-02 | P1 | 가입→로그인→집→기록→채팅→지원 실제 왕복 미수행 | 준비된 다계정 Chromium·WebKit 결과 |
| RELEASE-P1-03 | P1 | 타 사무소·이전 계약·종료 수리기사·차단 사용자 실제 교차 검증 미수행 | Preview 음성 시나리오 증거 |
| RELEASE-P1-04 | P1 | 승인된 대표 계정의 공식 고객지원 권한 연결 미수행 | 개인정보 없는 운영 설정과 감사 기록 |
| RELEASE-P2-01 | P2 | 로컬 WebKit 실행 파일 미설치 | WebKit 설치 환경 또는 Preview Safari 검수 |

## 커버리지 해석

- 측정 범위: `vitest.config.mts`에 명시된 인증 도메인·스키마·서비스·대표 action/UI와 채팅 도메인·스키마·서비스.
- 제외 범위: Next.js 얇은 라우트 경계, Supabase SDK 어댑터, SQL 자체 실행 경로와 외부 OAuth·문자 공급자.
- SQL은 정적 불변조건 검사이며 실제 Postgres RLS·동시성 검증을 대신하지 않는다.

## 결론

최신 화면은 Preview에서 확인할 수 있지만, Preview DB migration과 실제 다계정 권한 검증 없이는 정식 출시 완료라고 할 수 없다. P0·P1 0건일 때만 Production 승인을 다시 요청한다.
