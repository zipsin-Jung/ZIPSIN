# REQ-CK-INSTALL-001 집신체크 앱 받기 추적표

결정: `DEC-029` · 브랜치: `claude/integration-2026-10-15`

| REQ/AC | 화면·상태 | 소스 | TEST-ID | 결과 |
|---|---|---|---|---|
| AC-1 휴대폰·PC 구분 | 상단 `앱 받기` | `features/install/install-target.ts:isPhoneLike`, `use-install-prompt.ts` | TEST-CK-INSTALL-001, -006 | 통과(터치 노트북·구형 브라우저 포함) |
| AC-2 PC: QR·3단계·설치·닫기·초점 복귀 | 데스크톱 팝업 | `CheckInstallDialog.tsx`, `CheckInstallButton.tsx` | TEST-CK-INSTALL-002, -003, E2E PC | 실제 QR SVG 표시·초점 복귀 확인 |
| AC-3 QR 진입 시 자동 안내·주소 정리 | 휴대폰 팝업 | `CheckInstallButton.tsx` | TEST-CK-INSTALL-004, E2E 320·390px | 자동 열림, `?install=1` 제거, 화면 상태 유지, 가로 넘침 0 |
| AC-4 아이폰·갤럭시 각자 안내 | 휴대폰 팝업 | `CheckInstallDialog.tsx` | TEST-CK-INSTALL-004 | 통과 |
| AC-5 설치됨 상태 | 버튼 비활성 | `use-install-prompt.ts` | TEST-CK-INSTALL-003, -004 | 통과 |
| AC-6 집신체크 전용 앱 정보 | `/ck/manifest.webmanifest` | `features/install/check-manifest.ts`, `app/ck/manifest.webmanifest/route.ts`, `app/ck/page.tsx` | TEST-CK-INSTALL-005, E2E manifest | `/ck`에 앱 정보 링크 1개 확인 |

화면 증거: 1280px PC 팝업, 390px 휴대폰 팝업·상단 버튼(운영 빌드 Chromium).
