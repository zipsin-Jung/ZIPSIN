# DEC-012 대표 도메인과 검색 등록 기준

- 상태: 확정
- 결정일: 2026-10-02

## 결정

- 집신의 대표 공개 주소는 `https://zipsin.net`으로 사용한다.
- `https://www.zipsin.net`은 대표 주소로 308 영구 이동한다.
- 기존 `start.zipsin.net`은 당분간 유지하며 별도 변경은 하지 않는다.
- 루트와 `www` 웹 트래픽만 Vercel 프로젝트 `zipsin`으로 연결한다.
- Google Workspace용 MX, SPF, DKIM, 소유확인 TXT 레코드는 변경하지 않는다.
- 네이버 검색 등록은 HTML 메타태그 방식으로 소유권을 확인하고 `robots.txt`와 `sitemap.xml`을 제공한다.

## 이유

- 사용자가 기억하고 안내하기 쉬운 짧은 대표 주소가 필요하다.
- `www`와 루트 주소가 중복 페이지로 인식되는 것을 막아 검색 신호를 한 주소로 모은다.
- 웹 연결을 바꾸더라도 기존 업무 메일은 계속 동작해야 한다.

## 영향

- 루트 A 레코드는 Vercel이 안내한 값으로 변경한다.
- `www` CNAME은 Vercel이 안내한 값으로 변경한다.
- 페이지 canonical과 Open Graph URL은 `https://zipsin.net`을 기준으로 한다.
