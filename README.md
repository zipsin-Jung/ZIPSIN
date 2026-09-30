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
반응형 랜딩페이지, 휴대폰 내부 화면 전환, 역할별 데모, 요금제 자동 선택, 사전가입 입력 검증과 체험 완료 화면, 부드러운 섹션 이동, 모바일 메뉴, 기본 검색 예시와 기록 추가 예시.

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

## 빌드와 타입 검사
```bash
npm run typecheck
npm run build
```
정적 결과물은 `out/`에 생성됩니다. `npm start` 대신 위의 정적 미리보기 명령을 사용하세요.

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

## 실제 모집 전 확인
현재 폼은 **체험용**으로 개인정보를 저장하거나 전송하지 않습니다. 실제 접수와 알림은 동작하지 않습니다. DB 연결, 개인정보 안내 확정은 미션6 단계입니다. 실제 결제, 로그인, 채팅 전송, 기사 매칭, AI, PDF 생성은 포함하지 않았습니다. 요금제는 출시 전 가설입니다.

## 검증 상태
`npm run build`와 TypeScript 검사 통과. 정적 HTML과 로컬 자산 경로 검사, 데스크톱 브라우저에서 주요 화면과 캐릭터 겹침 여부를 확인했습니다. 배포 후에는 시크릿 창과 모바일 화면에서 한 번 더 확인합니다.

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
- [결정 기록](docs/decisions/README.md)
- [대화 기록](docs/conversations/README.md)
- [작업 보고서](docs/worklogs/README.md)

## 작업 기록 원칙

모든 작업은 계획 보고 → 기존 상태 확인 → 실행 → 문서 반영 → 검증 → 결과 보고 → Git 저장 순서로 진행합니다. 긴 제품 대화와 중요한 결정은 날짜별 문서로 보존합니다.
