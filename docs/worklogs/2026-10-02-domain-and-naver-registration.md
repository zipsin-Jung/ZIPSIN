# 2026-10-02 대표 도메인·네이버 검색 등록 작업

## 수행 순서

1. 기존 프로젝트 문서와 Git 상태 확인
2. Vercel이 요구하는 DNS 값 확인
3. 가비아에서 루트 A와 `www` CNAME만 변경
4. Vercel 연결 상태와 `www` 영구 이동 확인
5. 네이버 소유확인 메타태그, canonical, robots, sitemap 추가
6. 타입 검사 포함 Next.js 프로덕션 빌드
7. 배포·실제 주소·네이버 소유확인 검증
8. 문서·Git·바탕화면 문서함 동기화

## 변경 내용

- 가비아 루트 A를 Vercel 주소로 변경했다.
- 가비아 `www` CNAME을 Vercel DNS 주소로 변경했다.
- MX, SPF, DKIM, Google 소유확인 TXT와 `admin`, `start` 서브도메인은 유지했다.
- Vercel에서 `zipsin.net`의 Valid Configuration을 확인했다.
- Vercel에서 `www.zipsin.net`을 `zipsin.net`으로 308 영구 이동하도록 설정했다.
- `app/layout.tsx`에 대표 주소, canonical, Open Graph URL과 네이버 소유확인 메타태그를 추가했다.
- `app/robots.ts`, `app/sitemap.ts`를 정적 생성 경로로 추가했다.

## 검증 결과

- Next.js 프로덕션 빌드: 성공
- 빌드 중 TypeScript 검사: 성공
- 정적 경로 생성: `/`, `/robots.txt`, `/sitemap.xml` 성공
- DNS 관리 화면: 루트 A와 `www` CNAME 변경값 확인
- 메일 관련 DNS 레코드 유지 확인

## 남은 일

- GitHub 반영 후 Vercel 프로덕션 배포 확인
- 실제 `https://zipsin.net`에서 메타태그, robots, sitemap 확인
- 네이버 서치어드바이저 소유확인 완료
