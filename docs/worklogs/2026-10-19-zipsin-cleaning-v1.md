# 2026-10-19 집신청소 v1 (체험판 → 실제 저장)

## 사용자 결정
- "체험용이 아니라 배포할 것" → 실제 저장으로 전환. 앱 결제 없음, 손님이 업체 직접 선택, 이름 집신청소.
- 같은 날 앞서: 수수료는 나중, '예약과 달라요' 삭제(추가요금 분쟁), 시작 불가 사유는 여러 개 + 기타, 방문 견적·특수 청소, 업체에 하고 싶은 말·메모, 마이페이지(예전 청소 직접 남기기·사진).

## 다른 대화창 커밋 확인
- main `bb5401c`, `4dc8358`(집신청소 이름·공용 준비 중 화면·메뉴→cl.zipsin.net)을 합침. 준비 중 화면은 그대로 사용.

## 바꾼 것
- DB: `202610190101_zipsin_cleaning_v1.sql`, 설계 `docs/technical/zipsin-cleaning-v1-data-model.md`.
- 서버: `features/zipsin-clean/server/*`(가격은 서버 재계산, service_role RPC로만 예약 생성).
- 화면: `/cl` 예약, `/cl/my` 마이페이지, `/cl/partner` 업체(초대 코드), `/cl/admin` 운영자.
- 사진: 1600px JPEG로 다시 그려 올림(위치정보 제거), 비공개 버킷·5분 서명 주소.
- 열기 스위치: 로그인 열림 + (Preview 또는 `NEXT_PUBLIC_CLEAN_OPEN=true`). cl.zipsin.net은 스위치가 켜져야만 `/cl`.
- 로그인 뒤 돌아갈 주소 목록에 `/cl` 추가(`features/auth/domain/redirect.ts`).
- 체험판 파일 삭제(CleanApp·PartnerApp·CleanMyPage·demo.ts).

## 검증 (증거 구분)
- 단위·화면 테스트: 930 통과(2 skip은 기존). 커버리지 lines 93.95 / branches 85.62.
- 빌드: 통과. 비밀값 검사: 통과.
- DB 권한: **로컬 Postgres 스텁**에서 55개 통과(`supabase/tests/zipsin_cleaning_rls.sql`). 실제 Supabase(인증·저장소 서버)에서는 **확인 안 함**.
- 화면: 예시 데이터로 390·1280px 렌더 확인(넘침·오류 없음). 실제 로그인·DB 연결 상태 브라우저 확인은 **확인 안 함**(로컬에서 Supabase 이미지 다운로드가 막힘).
- Preview DB 적용·다계정 확인·운영 출시: **안 함(승인 대기)**.

## 남은 일
- `docs/deployment/zipsin-cleaning-launch.md` 순서대로 승인·적용.
- 알림(문자) 없음, 같은 시간 겹치는 예약 막기 없음, 방문 요청 상태 바꾸기 화면 없음, 가격표 v1.
