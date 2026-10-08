# ZIPSIN · 집신

계약부터 입주, 수리, 관리, 퇴거까지 흩어진 기록을 **집 한 채** 기준으로 연결하는 주거 기록 관리 서비스입니다.

## 핵심 문제와 해결
사진첩, 카카오톡, PC 폴더, 종이 영수증에 나뉜 기록을 집 카드에 연결합니다. 사람이 바뀌어도 집의 기록이 이어지는 경험을 소개하는 랜딩페이지입니다.

## 기술 스택
- Next.js 16.4.0 App Router
- React 19 · TypeScript
- Tailwind CSS 4
- shadcn/ui (Radix 기반 Button, Input, Tabs, Select, Checkbox)

## 핵심 기능

- 반응형 랜딩페이지와 휴대폰 클릭 데모
- `/records` 가상 수리 기록의 등록·목록·상세·수정·삭제
- Supabase Database·Storage, 사진 1장 업로드·교체·삭제
- URL 검색·상태 필터·페이지네이션
- 입력 검증, 중복 제출 방지, 로딩·오류·빈 상태 및 404 안내

CRUD는 인증을 제외한 교육용 공개 데모이므로 **가상 정보만 입력**해야 합니다.

## 실행

Node.js 22 이상에서 의존성과 환경 변수를 준비합니다.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다. Supabase SQL Editor에서 `supabase/migrations/20261008000000_create_repair_records.sql`을 한 번 실행해야 합니다.

## 환경 변수와 데이터 구조

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

실제 값은 `.env.local`과 Vercel에만 저장합니다. Service role key는 절대 `NEXT_PUBLIC_`으로 시작하거나 GitHub에 올리면 안 됩니다.

`repair_records`: `id`, `title`, `home_alias`, `category`, `status`, `description`, `repair_date`, `image_path`, `created_at`, `updated_at`

Storage는 비공개 `repair-images` 버킷을 사용하며 JPG·PNG·WebP를 5MB까지 허용합니다.

## 빌드와 타입 검사
```bash
npm run typecheck
npm run build
```
CRUD는 서버 런타임이 필요하므로 정적 export를 사용하지 않습니다. 빌드 후 `npm start`로 실행합니다.

## 파일 안내
- `components/`: 섹션별 화면과 인터랙션
- `components/PhoneDemo.tsx`: 휴대폰 데모
- `components/SignupSection.tsx`: 입력 검증·완료 상태, 향후 DB 연결 위치
- `lib/data.ts`: 역할별 문구와 요금제
- `app/globals.css`: 색상·간격·반응형 스타일
- `docs/BRIEF.txt`: 사용자 제공 전체 요구사항
- `CLAUDE.md`, `AGENTS.md`: AI 작업 방향
- `WORK_STATUS.md`: 완료 항목·한계·다음 작업
- `CONTINUE.md`: 새 대화에 넣을 이어 작업하기 안내

## 보안 한계

`/records`는 미션 요구에 따라 로그인·사용자별 권한·RLS 정책을 구현하지 않았습니다. 브라우저가 DB를 직접 접근하지는 못하지만, 웹 화면을 통해 누구나 가상 기록을 수정·삭제할 수 있습니다. 실제 운영은 미션 7에서 인증·소유권·RLS를 적용한 후에만 가능합니다.

## 검증 상태
2026-10-08 기준 자동 테스트 30개, 커버리지 문장 88.39%·분기 81.03%·함수 89.79%·라인 95.41%, TypeScript 검사, Next.js 프로덕션 빌드가 통과했습니다. Vercel 미리보기에서 Supabase 등록·조회·수정·삭제·새로고침 유지·404를 실제 확인했습니다. 파일 형식·크기·업로드 실패 처리는 자동 테스트로 확인했으며, 브라우저 파일 선택을 포함한 Storage 업로드 최종 수동 점검은 체크리스트에 구분해 기록했습니다.

## GitHub / Vercel
GitHub 저장소와 Vercel 자동 배포를 연결했습니다. `main` 브랜치에 반영된 변경사항은 Vercel에서 다시 배포됩니다.

- GitHub: https://github.com/zipsin-Jung/ZIPSIN
- Vercel: https://zipsin.vercel.app
- 미션 5 미리보기: https://zipsin-git-codex-mission5-crud-zipsin-jung.vercel.app/records
- 랜딩페이지: https://start.zipsin.net

Figma 링크가 제공되지 않아 Figma MCP 연동은 수행하지 않았습니다. 첨부 PNG 3장을 기준으로 구현했습니다.

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
