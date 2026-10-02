# ZIPSIN · 집신

계약부터 입주, 수리, 관리, 퇴거까지 흩어진 기록을 **집 한 채** 기준으로 연결하는 주거 기록 관리 서비스입니다.

## 핵심 문제와 해결
사진첩, 카카오톡, PC 폴더, 종이 영수증에 나뉜 기록을 집 카드에 연결합니다. 사람이 바뀌어도 집의 기록이 이어지는 경험을 소개하는 랜딩페이지입니다.

## 기술 스택
- Next.js 16.3.6 App Router
- React 19 · TypeScript
- Tailwind CSS 4
- shadcn/ui (Radix 기반 Button, Input, Tabs, Select, Checkbox)

## 구현
반응형 랜딩페이지와 기존 체험 기능을 유지하면서 공개형 서비스 V1 1단계 인증 기반을 추가했습니다. 현재 코드에는 Supabase 서버 세션, Google·Kakao·Naver 로그인 진입, 전화 인증 공급자 경계, 동의, 역할 선택과 보호된 빈 홈이 포함됩니다.

## 바로 실행
Node.js 22 이상을 설치한 Mac에서는 `실행.command`를 더블클릭하면 포함된 완성 빌드를 브라우저에서 볼 수 있습니다. macOS가 실행을 막으면 아래 명령을 이용하세요.

```bash
node scripts/preview.mjs
```

표시된 주소로 접속하세요. 종료하려면 터미널에서 Control+C를 누릅니다. 기본 포트는 3000이며 다른 작업이 사용 중이면 3001부터 빈 포트를 사용합니다.

## 코드를 수정하며 실행
```bash
npm ci
npm run dev
```
브라우저에서 http://localhost:3000 에 접속합니다.

## 빌드와 검사
```bash
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e
```

인증 경로는 서버 런타임이 필요합니다. `.env.example`을 참고해 로컬 환경값을 준비한 뒤 `npm run dev` 또는 빌드 후 `npm start`를 사용하세요.

## 파일 안내
- `components/`: 섹션별 화면과 인터랙션
- `components/PhoneDemo.tsx`: 휴대폰 데모
- `components/SignupSection.tsx`: 입력 검증·완료 상태, 향후 DB 연결 위치
- `lib/data.ts`: 역할별 문구와 요금제
- `app/globals.css`: 색상·간격·반응형 스타일
- `app/(auth)/`: 로그인·콜백·전화 인증 화면
- `app/(app)/`: 역할 선택과 보호된 앱 화면
- `features/auth/`: 인증 도메인·action·화면·공급자 경계
- `supabase/migrations/`: 프로필·동의·전화 인증·역할과 RLS
- `docs/traceability/public-v1-auth.md`: 요구사항·소스·테스트·검증 연결
- `docs/BRIEF.txt`: 사용자 제공 전체 요구사항
- `CLAUDE.md`, `AGENTS.md`: AI 작업 방향
- `WORK_STATUS.md`: 완료 항목·한계·다음 작업
- `CONTINUE.md`: 새 대화에 넣을 이어 작업하기 안내

## 실제 모집 전 확인
기존 랜딩 폼은 여전히 **체험용**입니다. 인증 코드는 구현했지만 실제 Supabase Preview, 세 OAuth 제공자와 문자 공급자 키가 아직 연결되지 않아 실제 회원가입 서비스 개시 상태가 아닙니다. 실제 결제, 채팅 전송, 기사 매칭, AI, PDF 생성은 포함하지 않았습니다. 요금제는 출시 전 가설입니다.

## 검증 상태
2026-10-02 기준 TypeScript, 45개 단위·통합 테스트, 네 커버리지 지표 80% 이상, 프로덕션 빌드와 Chromium 4개 브라우저 시나리오를 통과했습니다. 실제 제공자 로그인·세션 복구·문자 인증은 Preview 환경 연결 후 별도 확인해야 합니다.

## GitHub / Vercel
GitHub 저장소와 Vercel 자동 배포를 연결했습니다. `main` 브랜치에 반영된 변경사항은 Vercel에서 다시 배포됩니다.

- GitHub: https://github.com/zipsin-Jung/ZIPSIN
- Vercel: https://zipsin.vercel.app
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
