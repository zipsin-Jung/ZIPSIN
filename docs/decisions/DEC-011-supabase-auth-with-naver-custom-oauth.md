# DEC-011 Supabase 인증과 네이버 Custom OAuth

- 날짜: 2026-10-02
- 상태: 코드 구현 완료 · Preview 제공자 연동 검증 대기
- 관련 요구사항: `PSV1-AUTH-001`, `PSV1-AUTH-002`

## 결정안

인증·데이터·파일은 Supabase를 일관되게 사용한다. Google과 Kakao는 Supabase 기본 소셜 제공자를 사용하고, Naver는 Supabase Custom OAuth2 Provider로 연결한다.

## 근거

- Supabase 공식 문서는 Google과 Kakao를 기본 제공자로 지원한다.
- Supabase 공식 문서는 목록에 없는 표준 OAuth2 제공자를 Custom OAuth/OIDC Provider로 추가할 수 있다고 안내한다.
- Naver 로그인은 OAuth 2.0 기반 인증 API를 제공하므로 별도의 자체 세션 체계를 만들지 않고 동일한 Supabase 세션으로 통합하는 방향이 적합하다.

## 안전 조건

- 세 제공자의 사용자 ID와 이메일을 기준으로 계정을 임의 병합하지 않는다.
- Preview와 Production의 OAuth 콜백 주소와 비밀키를 분리한다.
- Custom OAuth가 실제 Naver 응답 필드를 올바르게 매핑하는지 Preview에서 검증하기 전 공개 버튼을 활성화하지 않는다.
- 실패하면 Naver 버튼만 준비 중 상태로 되돌릴 수 있으며 Google·Kakao와 기존 계정에는 영향을 주지 않는다.

## 참고

- https://supabase.com/docs/guides/auth/social-login
- https://supabase.com/docs/guides/auth/custom-oauth-providers
- https://developers.naver.com/docs/login/api/api.md
