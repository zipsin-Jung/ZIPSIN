# 공개 홈 설치·모션 설계 작업 기록

- 날짜: 2026-10-14
- 상태: 설계 작성 완료, 사용자 문서 검토 대기

## 수행 순서

현재 문서·코드 확인 → Next.js 16.4 로컬 PWA 문서 확인 → 여섯 역할 최초 회의 → 선택지·위험 비교 → 요구사항·수용 기준 작성 → 결정·회의·대화 기록 → 사용자 문서 검토

## 확인 결과

- 첫 세로 이미지는 넓은 프레임의 `contain` 축소 때문에 작게 보인다.
- 2~4장은 장면 고유 모션이 없어 시각적 전달력이 약하다.
- 현재 설치 manifest와 설치 상태 UI가 없다.
- 실제 설치는 manifest와 HTTPS를 사용하고, iOS는 수동 안내가 필요하다.

## 결정 초안

- 온라인 전용 PWA 설치를 사용한다.
- 서비스 워커·오프라인 캐시는 제외한다.
- 네 장은 활성화할 때 한 번만 실행되는 서로 다른 모션을 사용한다.
- 실제 Preview 설치 증거 전에는 설치 완료라고 보고하지 않는다.

## 산출물

- 설계: `docs/superpowers/specs/2026-10-14-public-home-install-motion-design.md`
- 결정: `docs/decisions/DEC-025-public-web-app-installation.md`
- 회의: `docs/meetings/2026-10-14-public-home-install-motion-kickoff.md`
- 대화: `docs/conversations/2026-10-14-public-home-install-motion.md`

## 다음 작업

사용자가 설계 문서를 검토·승인하면 구현계획을 작성한다. 아직 제품 코드는 변경하지 않았다.
