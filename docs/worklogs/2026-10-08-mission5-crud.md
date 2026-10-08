# 2026-10-08 미션 5 CRUD 작업 기록

## 수행 순서

1. 기존 문서·코드·Git 상태 확인
2. 네 역할 킥오프와 `M5-REC-001~006` 확정
3. 검증 테스트를 먼저 작성하고 실패 확인
4. Supabase 스키마·Storage·Server Action·CRUD 화면 구현
5. 자동검사·빌드·문서 반영

## 변경 내용

- `/records`, `/records/new`, `/records/[id]`, `/records/[id]/edit` 추가
- Supabase 서버 클라이언트와 `repair_records`, 비공개 `repair-images` 구조 추가
- 등록·조회·수정·삭제, 이미지 업로드·교체·삭제, 검색·필터·페이지네이션 구현
- 정적 export에서 Next.js 서버 배포로 전환
- 가상 정보만 사용하는 교육용 한계를 UI·README·명세에 고정

## 검증 결과와 남은 일

- 자동 테스트: 30개 통과
- 커버리지: 문장 88.39%, 분기 81.03%, 함수 89.79%, 라인 95.41%
- `npm run typecheck`: 통과
- `npm run build`: 통과, `/records` 경로는 서버 동적 라우트로 생성
- `npm audit --omit=dev`: Next.js를 16.4.0으로 올린 후 취약점 0건
- Supabase `ZIPSIN Preview`에 테이블·비공개 Storage 버킷을 적용하고 Vercel Preview/Production 환경 변수를 등록
- Vercel 로그에서 `service_role` 테이블 권한 누락을 발견해 실제 DB와 마이그레이션에 CRUD 권한 추가
- 미리보기 배포에서 빈 폼 오류, 등록, 상세, 새로고침 유지, 수정, 삭제 확인, 없는 상세 404를 실제 통과
- 브라우저에서 1440·390·320px 가로 넘침 없음, 빈 폼 오류 5개와 첫 오류 초점, 환경 변수 없음 안내를 확인
- 파일 없음 화면과 파일 검증·업로드 실패·정리 자동 테스트는 통과했으나, 자동화 환경의 파일 선택 제약으로 실제 Storage 업로드 수동 점검 1건은 남음
- `zipsin.net` DNS·도메인·배포 설정은 변경하지 않음
