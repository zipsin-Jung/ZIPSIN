# 카카오톡 문의 추적표

| REQ | AC | FLOW/SCREEN/STATE | source | TEST-ID | test | level | result |
|---|---|---|---|---|---|---|---|
| REQ-SUPPORT-KAKAO-001 | AC-001 | 전역 레이아웃/NORMAL | `app/layout.tsx` `KakaoInquiryButton` | TEST-SUPPORT-KAKAO-001 | 전역에서 한 번 렌더 | unit | PASS |
| REQ-SUPPORT-KAKAO-001 | AC-002~004 | 카카오 링크/FOCUS·EXTERNAL-OPEN | `features/support/components/KakaoInquiryButton.tsx` | TEST-SUPPORT-KAKAO-002 | 주소·새 창·보안·접근성 이름 | unit | PASS |
| REQ-SUPPORT-KAKAO-001 | AC-005~006 | 320·390·768·1440/모바일 메뉴 | `KakaoInquiryButton` 반응형 위치 | TEST-SUPPORT-KAKAO-003, `app-navigation.spec.ts` | 56px 터치 영역·뷰포트·비가림·키보드 | unit/E2E | PASS |
| REQ-SUPPORT-KAKAO-001 | AC-007~008 | 고객지원 안내/NORMAL | `app/(app)/support/page.tsx`, `components/PublicHome.tsx` | TEST-SUPPORT-KAKAO-004 | 기록 비저장·민감정보 경고·채널 홈 | unit | PASS |

## 검증 범위

- 정상: 공개·로그인·앱 화면의 버튼과 외부 링크
- 실패: 외부 카카오 서비스 장애는 새 창에서 카카오가 처리하며 집신 입력 데이터는 변경되지 않음
- 권한: 문의 링크는 공개 정보만 포함하며 집·계약 접근 권한을 만들지 않음
- 개인정보: URL과 분석 이벤트에 사용자·집·주소·메시지를 넣지 않음

## 최종 검증 결과

- 단위 테스트: 344 통과, 1 제외
- 카카오 관련 브라우저 테스트: 5 통과
- 320·390·768·1440px 접근성·반응형 검사: 4 통과, axe 위반 0건
- 코드 커버리지: 문장 92.47%, 분기 85.78%, 함수 94.82%, 줄 94.28%
- 타입 검사: 오류 0건
- production build: 성공
- 전체 E2E: 20 통과·9 제외, 병렬 로컬 I/O 중단 2건은 순차 재실행 3/3 통과
