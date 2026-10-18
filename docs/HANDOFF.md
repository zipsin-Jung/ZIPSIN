# 집신 인수인계 (하나로 통합)

> 2026-10-18 작성. 예전 인수인계 문서(13·23·24번, `CLAUDE_HANDOFF.md`, `CONTINUE.md` 옛 판)는 `docs/archive/handoffs/`에 보존했습니다. 이 문서와 실제 Git이 다르면 Git이 우선입니다.

## 1. 집신이 무엇인가

- 집 한 채를 기준으로 사진·문서·대화·일정·수리를 이어 두는 웹앱. "사람이 바뀌어도 집의 기록은 남는다."
- 첫 결제 고객: 소규모 공인중개사무소. 중개사 화면은 집신 안의 사무소 화면이다.
- 브랜드: **집신이 대표**. 집신체크(임차인용, ck.zipsin.net)·집신수리·집신청소은 하위 서비스이고 메뉴로만 연결한다(DEC-030).

## 2. 어디까지 왔나

- 운영: zipsin.net 공개 홈(가입·로그인 준비 중), ck.zipsin.net 집신체크.
- 개발: `claude/app-rebuild-2026-10-18`에서 로그인 후 화면 재구성. 단계별 상태는 `WORK_STATUS.md`.
- 기준 문서
  - 제품 재기획 회의: `docs/meetings/2026-10-16-product-replan.md`
  - 개발 계획: `docs/plans/2026-10-17-app-rebuild-dev-plan.md`
  - 임대인 승인·기록 칸: `docs/decisions/DEC-029-landlord-approval-and-record-access.md`
  - DB 설계(동영상·수리·임대인 승인): `docs/design/2026-10-18-db-video-repair-approval.md`
  - 화면 시안(승인본): Claude Design 캔버스 "집신 앱 화면 시안 (로그인 후)"
  - 작업 규칙 6개: `docs/worklogs/2026-10-18-retrospective-and-rules.md`

## 3. 일하는 방식

1. 작업 전에 순서를 보고한다. 화면은 시안 승인 뒤에 코드로 만든다.
2. 설정값·배포를 바꾸기 전에 "Preview에서 바뀌는 것 / zipsin.net에서 바뀌는 것" 표를 보여 준다.
3. 다른 대화의 커밋은 이어서 쓰기 전에 보고한다. 개발은 한 대화에서만 한다.
4. 완료 보고는 증거를 나눈다: 단위 테스트 / 빌드 / 로컬 Postgres 검사 / 직접 본 화면 / Preview 확인. 안 한 것은 "확인 안 함".
5. Production 배포·DB·외부 계정은 대표 승인 뒤에만. SQL은 대표가 복사 버튼 페이지로 적용한다.
6. 비밀값·실제 전화번호·계약서는 대화·Git·문서에 넣지 않는다. 기존 기록은 지우지 않고 `docs/archive/`로 옮긴다.

## 4. 검사 방법

- 단위: `npx vitest run`
- 빌드: `npm run build`
- 로컬 DB·권한: Postgres 16을 포트 54329로 띄운 뒤 `bash supabase/tests/local/run.sh supabase/tests/local/10_multi_account_rls.sql supabase/tests/local/20_repair_stages.sql`
- 화면: Playwright(`/opt/pw-browsers/chromium`) 390·1440px

## 5. 대표 결정 대기

`WORK_STATUS.md`의 "대표 결정이 필요한 것"을 본다.
