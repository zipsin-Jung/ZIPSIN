# REQ-CK-HOST-001 ck.zipsin.net 독립 주소 추적표

기준 브랜치: `codex/zipsin-shared-auth-integration` · 결정: `DEC-026`

| REQ/AC | FLOW/SCREEN/STATE | 소스 경로·심볼 | TEST-ID·테스트 | 결과·증거 |
|---|---|---|---|---|
| AC-1 집신체크 주소 판별 | 요청 host | `lib/site/check-host.ts:isCheckHost` | TEST-CK-HOST-001 `tests/unit/site/check-host.test.ts` | 대소문자·포트·유사 도메인 거부 통과 |
| AC-2 `ck.zipsin.net/` → 같은 주소 `/ck`, 추적값 유지 | 첫 진입 | `proxy.ts:proxy` | TEST-CK-HOST-002 단위, TEST-CK-HOST-005 E2E | 운영 빌드 Chromium에서 오류 0건, 390px 화면 확인 |
| AC-3 `zipsin.net/` 첫 화면 불변 | 첫 진입 | `proxy.ts:proxy` | TEST-CK-HOST-002, TEST-CK-HOST-007 | 통과, 랜딩 E2E 2건 통과 |
| AC-4 집신체크에서 시작한 간편 로그인은 `ck.zipsin.net/auth/callback`으로 복귀 | 간편 로그인 시작·복귀 | `lib/site/check-host.ts:resolveAuthSiteOrigin`, `features/auth/actions/start-oauth.ts:startOAuth` | TEST-CK-HOST-003 단위 2곳 | 통과. 실제 Google·Kakao 왕복은 공급자 설정 후 |
| AC-5 로그인 화면을 거쳐도 기록 유지 | `/ck` → `/login?next=%2Fck` → 뒤로 | 기존 `ZipsinCheckApp` 상대 경로 링크 | TEST-CK-HOST-006 E2E | 같은 주소 유지·기록 유지 통과 |
| AC-6 운영 주소 값 검사 | 배포 환경값 | `scripts/check-account-sync-env-logic.mjs` | TEST-CK-HOST-004 | `https://ck.zipsin.net` 외 거부 |

E2E 실행: `NEXT_PUBLIC_CHECK_SITE_URL=http://ck.localhost:<port>`로 `ck.localhost`를 집신체크 주소로 흉내 낸다. 값이 없으면 `check-host.spec.ts`는 건너뛴다.
