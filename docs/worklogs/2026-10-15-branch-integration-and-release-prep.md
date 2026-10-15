# 2026-10-15 두 개발 브랜치 통합과 배포 직전 준비

- 요청: "집신 배포 직전까지 만들어서 달라", 두 갈래 통합(사용자 선택), 앞으로 한 대화에서만 개발(사용자 선택)
- 통합 브랜치: `claude/integration-2026-10-15`
- 원본 보존: `codex/contract-to-expiry-home`, `codex/zipsin-shared-auth-integration` (삭제·되돌림 없음)
- 상태: 자동검사 통과, Preview 실제 가입·문자 왕복과 Production 적용은 미실행(승인 대기)

## 수행 순서

1. 배포 목록에서 다른 Claude 대화가 `codex/zipsin-shared-auth-integration`에 같은 시간대 커밋 중인 것을 발견, 배포 준비 중단·사용자 보고
2. 두 브랜치 범위 비교: 공통 기준 `2a13cd4` 이후 우리 52커밋/163파일, 상대 104커밋/369파일, 겹치는 파일 22개
3. 통합 원칙
   - 휴대전화 인증·문자 보안·가입·계정 복구: 상대 브랜치(DB 보강 6개 포함, 더 완성)
   - 로그인 화면: 2026-10-15 사용자 승인 시안(중앙 카드, 아이디+비밀번호, 로그인 유지 선택 없음)
   - 사용 목적·계약 만기 집 홈·온보딩: 우리 브랜치
   - 문서: 양쪽 기록 모두 보존
4. 통합 중 발견·수정한 결함
   - 상대 브랜치 가입은 만 14세 동의를 기록하지 않음(DEC-025, 사용자 요청으로 제거) ↔ 우리 사용 목적 저장 함수는 그 동의를 요구 → 새 가입자가 목적 저장에서 막힘. 정방향 migration `202610150001_usage_onboarding_without_age_consent.sql`과 가드·도메인 수정으로 해소(과거 migration 미수정)
   - migration 버전 번호 중복 2건(`202610130001`, `202610130002`) → 상대 브랜치 파일을 `202610130101`, `202610130102`로 재번호
   - `playwright.config.ts` 중복 env 키 → 하나로 정리
   - 결정 기록 번호 충돌(DEC-026 두 개) → 이 대화 기록을 DEC-027로 변경
   - 문자 서명 비밀값: 전용 값이 없으면 서버 키에서 용도별 파생(Production·이 브랜치 Preview에 전용 값 없음)
   - 로그인 유지: 체크 UI 없음, 값이 없으면 기존처럼 유지 세션
5. 검사: 타입 0오류, 단위·통합 741 통과·2 skip, 커버리지 Statements 87.76 · Branches 80.7 · Functions 88.75 · Lines 90.96(기존 include 범위), Production build 성공, 로컬 Chromium `/login`·`/signup`·`/` 1440·390px 가로 넘침 0·콘솔 오류 0

## 남은 사항 (사용자 결정 또는 실환경 필요)

- 상대 브랜치 서버 로직은 이메일·전화번호로도 로그인을 받는다(화면에는 아이디만 노출). 2026-10-15 아침 지시와 다르므로 유지·제거를 결정해야 한다.
- 상대 브랜치에 있던 Preview DB에 `202610130001_zipsin_check_account_sync`가 원래 번호로 이미 적용됐다면, 그 DB의 migration 기록을 새 번호로 맞추는 조정이 필요하다.
- Production DB migration 적용, Production 환경변수(`NEXT_PUBLIC_SUPABASE_ANON_KEY` Production 값 없음), Supabase 인증 주소 설정, `main` 병합은 사용자 승인 전 미실행.
- 실제 문자 발송·가입 끝까지 왕복과 다계정 RLS 검증은 미실행.
