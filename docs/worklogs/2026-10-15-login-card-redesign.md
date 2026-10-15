# 2026-10-15 로그인 중앙 카드 재설계 구현

- 요청: 사용자 승인 시안(기본·오류·390px 모바일·간편 로그인 연결 시)대로 로그인 화면 구현
- 결정: 간편 로그인은 실제 연결된 제공자만 표시 (사용자 선택 A안)
- 상태: 로컬 검수 통과, Preview 확인과 사용자 승인 대기

## 수행 순서

1. 기존 로그인 화면·폼·서버 처리·소셜 버튼 감사
2. 실패 테스트 작성 (TEST-LOGIN-001~013, providers.test 갱신)
3. 최소 구현 → 테스트 통과
4. 타입 검사·전체 단위/통합·커버리지·Production build
5. 로컬 Chromium 1440·390·320px 화면 확인 → 시각 결함 3건 수정 → 재확인

## 요구사항 ↔ 소스 ↔ 테스트

| REQ | 내용 | 소스 | 테스트 |
|---|---|---|---|
| LOGIN-UX-001 | 중앙 카드, 제목·보조문장·보호안내·찾기·회원가입 | app/(auth)/login/page.tsx | TEST-LOGIN-001 |
| LOGIN-UX-001 | 미연결 소셜 버튼·"준비 중" 문구 숨김, 연결 시에만 구분선 | page.tsx, SocialLoginButtons.tsx | TEST-LOGIN-002·003, providers.test |
| LOGIN-UX-002 | 불일치·시도 초과·서비스 오류 문구 분리, 계정 존재 여부 비노출 | features/auth/domain/login-error.ts `getLoginError` | TEST-LOGIN-004~008 |
| LOGIN-UX-003 | 제출 중 버튼 잠금·처리 중 표시(중복 제출 방지) | UsernameLoginForm.tsx `SubmitButton` | TEST-LOGIN-009 |
| LOGIN-UX-003 | 오류 뒤 아이디 유지·비밀번호 비움·비밀번호 칸 포커스, 저장소 차단 시에도 동작 | UsernameLoginForm.tsx | TEST-LOGIN-010~012 |
| LOGIN-UX-004 | 연결된 제공자 클릭 시 OAuth 시작·중복 클릭 방지 | SocialLoginButtons.tsx | TEST-LOGIN-013 |

## 검증 결과

- 타입 검사: 오류 0건
- 단위·통합: 453개 통과, 2개 skip(기존 외부 환경 조건)
- 커버리지(기존 include 범위 합산): Statements 86.91% · Branches 82.8% · Functions 88.01% · Lines 90.05%
- 변경 파일: login-error.ts 100/100/100/100, SocialLoginButtons.tsx 100/100/100/100, UsernameLoginForm.tsx 100/95.65/100/100
- Production build: 성공
- 로컬 Chromium(1440·390·320px, 오류 상태 포함): 가로 넘침 0, 콘솔 오류 0
- 브라우저에서 찾아 고친 것: 비밀번호 칸 이중 포커스 테두리, 전역 링크 스타일에 덮인 링크 색·밑줄, 모바일 카카오 문의 버튼과 보호 안내 겹침

## 미검증·남은 일

- Vercel Preview 실제 화면 확인
- 실제 계정으로 로그인 왕복(Preview Supabase)
- 보호 안내 문구 근거: RLS 다계정 검증 전이므로 전체 출시 판정과 별개
- Pretendard 로컬 글꼴 번들은 범위 밖(현재 시스템 글꼴)
