# 2026-10-02 대표 도메인·네이버 검색 등록 대화 기록

## 사용자 요청

- 네이버에서 집신을 검색했을 때 노출되도록 무료 등록을 진행한다.
- `zipsin.net`을 집신의 대표 주소로 사용한다.
- 로그인 이후의 도메인 연결 작업을 Codex가 직접 진행한다.

## 확인한 상태

- 기존 루트와 `www`는 오래된 Netlify 사이트를 가리키고 있었다.
- 현재 집신 Next.js 사이트는 GitHub `zipsin-Jung/ZIPSIN`과 Vercel 프로젝트 `zipsin`에 연결되어 있다.
- `start.zipsin.net`은 이미 Vercel에 연결되어 있었다.
- Google Workspace 메일용 MX·TXT 레코드가 같은 도메인에 존재한다.

## 합의와 처리 기준

- 루트와 `www` 웹 레코드만 Vercel로 교체한다.
- 메일용 MX·SPF·DKIM·Google 소유확인 기록은 보존한다.
- 대표 주소는 루트 `zipsin.net`이며 `www`는 루트로 영구 이동한다.
- 네이버 소유확인 태그, canonical, robots, sitemap을 Next.js App Router 방식으로 추가한다.
- DNS 전파와 Vercel 배포가 완료된 뒤 네이버 소유확인을 최종 제출한다.
