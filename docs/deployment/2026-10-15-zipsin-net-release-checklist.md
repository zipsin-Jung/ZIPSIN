# zipsin.net 전환 직전 점검표 (2026-10-15)

- 배포할 코드: 브랜치 `claude/integration-2026-10-15` (커밋 `3d84338` 이후)
- 시험 주소(Preview): `https://zipsin-git-claude-integration-2026-10-15-zipsin-jung.vercel.app` (Vercel 로그인 필요할 수 있음)
- 지금 zipsin.net: `main` 브랜치의 예전 사전가입 랜딩
- 상태: **배포 직전. Production은 아무것도 바꾸지 않음**

## 이미 끝난 것

| 항목 | 증거 |
|---|---|
| 두 개발 갈래 통합 | 통합 브랜치, 원본 2개 보존 |
| 새 로그인 화면 | 승인 시안 반영, 1440·390px 확인 |
| 단일 화면 회원가입 + 휴대전화 인증 | 상대 브랜치 구현 채택 |
| 솔라피 문자 설정 | Vercel Production·Preview에 키·발신번호 저장 확인 |
| 자동검사 | 타입 0오류, 테스트 741 통과·2 skip, 커버리지 4지표 80% 이상, build 성공 |

## zipsin.net으로 바꾸기 전 남은 일 (순서대로)

| 순서 | 할 일 | 누가 | 이유 |
|---|---|---|---|
| 1 | Preview에서 회원가입을 끝까지 해 보고 인증 문자가 오는지 확인 | 사용자(휴대전화 필요) | 실제 문자 왕복은 아직 한 번도 확인 안 됨 |
| 2 | Supabase 로그인 → 운영 DB 확인(Preview DB와 같은지, 적용된 DB 변경 목록, 백업) | 사용자 로그인 + Claude 확인 | 운영 DB에 새 기능용 테이블이 없으면 zipsin.net에서 오류 |
| 3 | 운영 DB에 빠진 DB 변경 적용 | 사용자 승인 후 Claude | 되돌리기 어려운 작업이라 승인 필수 |
| 4 | Vercel Production 환경값을 아래 표대로 모두 넣기 → `npm run check:account-env`로 확인 | 사용자 붙여넣기 + Claude 확인 | 하나라도 빠지면 화면·로그인·가입 문자가 막힘 (2026-10-17 보완) |
| 5 | Supabase 인증 주소를 `https://zipsin.net`으로 설정 | 사용자(그림 안내) | 가입 확인 메일·비밀번호 재설정 링크가 운영 주소로 와야 함 |
| 6 | ck.zipsin.net 연결: Vercel 도메인 추가 → 가비아 `ck` CNAME → Supabase 주소 허용 목록에 `https://ck.zipsin.net/auth/callback` 추가 | 사용자(단계별 안내) | 운영 홈의 집신체크 링크가 ck.zipsin.net으로 가므로 먼저 연결돼 있어야 함 |
| 7 | `main`에 합치기 → zipsin.net 자동 전환 | 사용자 최종 승인 | 이 순간 실제 공개 |

## Vercel Production 환경값 (2026-10-17)

값 자체는 이 문서에 적지 않습니다. 이름과 넣을 내용만 적습니다.

| 이름 | 넣을 값 | 빠지면 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 운영 Supabase 주소 | 화면이 열리지 않음 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 운영 Supabase 공개 키 | 화면이 열리지 않음 |
| `SUPABASE_SERVICE_ROLE_KEY` | 운영 Supabase 서버 키(공개 금지) | 로그인·가입 서버 작업 실패 |
| `NEXT_PUBLIC_SITE_URL` | `https://zipsin.net` | 메일 링크가 잘못된 주소로 감 |
| `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` | `.zipsin.net` | 집신과 집신체크 로그인이 따로 놂 |
| `NEXT_PUBLIC_CHECK_SITE_URL` | `https://ck.zipsin.net` (6번 끝난 뒤) | 집신체크가 zipsin.net/ck로 열림 |
| `PASSWORD_LOGIN_ENABLED` | `true` | **로그인 전체 불가** |
| `PHONE_VERIFICATION_PROVIDER` | `solapi` | **가입 문자 발송 불가** |
| `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER_NUMBER` | 솔라피 값(Secret은 재생성 후) | 가입 문자 발송 불가 |
| `PHONE_OTP_HMAC_SECRET` | 32자 이상 임의 문자열 | 문자 인증 실패 |
| `AUTH_RATE_LIMIT_HMAC_SECRET` | 32자 이상 임의 문자열(선택) | 서버 키에서 따로 만들어 씀 |
| `NEXT_PUBLIC_AUTH_GOOGLE/KAKAO/NAVER_ENABLED` | `false` (연결 전까지) | — |

## 되돌리는 방법

Vercel → Deployments에서 지금 운영 중인 예전 배포를 골라 **Promote to Production** 하면 몇 초 안에 예전 화면으로 돌아갑니다. DB 변경은 되돌리지 않고 앞으로 고치는 방식(forward-fix)을 씁니다.

## 알고 공개해야 하는 위험

- 여러 계정으로 "남의 집 기록이 안 보이는지" 실제 DB 검사가 아직 없음. 사용자는 위험을 알고 당일 공개를 선택함(DEC-027).
- 서버는 이메일·전화번호로도 로그인을 받음(화면에는 아이디만). 유지·제거 결정 필요.
- 솔라피 Secret이 대화에 한 번 노출됨. 문자 시험이 끝나면 Secret 재생성 후 Vercel 값 교체 권장.
