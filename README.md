# ZIPSIN · 집신

계약부터 입주, 수리, 관리, 퇴거까지 흩어진 기록을 **집 한 채** 기준으로 연결하는 주거 기록 관리 서비스입니다.

## 지금 상태 (2026-10-18)
- **zipsin.net**: 운영 중. 공개 홈만 열려 있고 `집신 시작하기`·`로그인 · 회원가입`은 준비 중입니다(법률 자문 회신 뒤 가입을 엽니다).
- **ck.zipsin.net**: 집신체크(임차인용 하위 서비스) 운영 중. 집신이 대표 브랜드이고 하위 서비스는 메뉴로만 연결합니다(DEC-030).
- **개발 중**: `claude/app-rebuild-2026-10-18` 브랜치에서 로그인한 뒤 화면(사무소·집·기록·수리·임대인 승인)을 다시 만들고 있습니다.
- 자세한 현황은 `WORK_STATUS.md`, 이어서 일하는 방법은 `docs/HANDOFF.md`를 봅니다.

이전 README(2026-10-02, 랜딩페이지 시절)는 `docs/archive/README-2026-10-02.md`에 보존했습니다.

## 기술 스택
- Next.js 16 App Router(`proxy.ts`) · React 19 · TypeScript
- Tailwind CSS 4 · shadcn/ui
- Supabase(인증·DB·저장소, RLS)
- Vitest · Playwright

## 실행과 검사
```bash
npm ci
npm run dev          # http://localhost:3000
npx vitest run       # 단위 테스트
npm run build        # 운영 빌드
```
로컬 DB 권한 검사는 `docs/HANDOFF.md` 4장을 봅니다. 환경값은 `.env.example`을 참고하고, 비밀값은 Git에 넣지 않습니다.

## 폴더 안내
- `app/(public)`·`components/`: 공개 홈
- `app/ck`, `features/zipsin-check`: 집신체크
- `app/(auth)`: 로그인·회원가입·계정 찾기
- `app/(app)`, `features/`: 로그인 후 앱(홈·집·기록·채팅·마이)
- `supabase/migrations/`: DB 구조와 권한(RLS)
- `supabase/tests/local/`: 로컬 Postgres 권한 검사
- `docs/`: 기획·결정·회의·작업기록(`docs/README.md`)

## GitHub / Vercel
- GitHub: https://github.com/zipsin-Jung/ZIPSIN
- `main`에 올라간 변경은 Vercel이 zipsin.net으로 배포합니다. 다른 브랜치는 Preview 주소로만 배포됩니다.

## 제품기획 문서

- [작업 운영 규칙](docs/00-working-rules.md)
- [제품 개요](docs/01-product-brief.md)
- [기능 정의](docs/02-feature-definition.md)
- [사용자와 권한](docs/03-roles-and-access.md)
- [핵심 업무 흐름](docs/04-core-workflows.md)
- [MVP 범위와 다음 단계](docs/05-mvp-plan.md)
- [에이전트 지침 설계](docs/06-agent-instructions.md)
- [에이전트 시스템과 스킬](docs/07-agent-system-and-skills.md)
- [에이전트 회의 기록](docs/meetings/README.md)
- [결정 기록](docs/decisions/README.md)
- [대화 기록](docs/conversations/README.md)
- [작업 보고서](docs/worklogs/README.md)

## 작업 기록 원칙

모든 작업은 계획 보고 → 기존 상태 확인 → 실행 → 문서 반영 → 검증 → 결과 보고 → Git 저장 순서로 진행합니다. 긴 제품 대화와 중요한 결정은 날짜별 문서로 보존합니다.
