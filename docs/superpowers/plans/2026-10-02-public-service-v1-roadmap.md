# 집신 공개형 서비스 V1 구현 로드맵

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가입부터 첫 집·기록·사진·캘린더·테스트 결제까지 실제로 연결되는 공개형 서비스 V1을 단계별로 완성한다.

**Architecture:** 기존 랜딩페이지를 유지하면서 Next.js App Router 서버 런타임과 Supabase Auth/Postgres/Storage를 추가한다. 각 단계는 독립적으로 테스트·배포 취소가 가능하며, 토스페이먼츠는 마지막 단계에서 테스트 환경만 연결한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Supabase, Vitest, Testing Library, Playwright, Toss Payments test environment

**Spec:** `docs/12-public-self-service-v1-spec.md`

## Global Constraints

- 실제 카드 승인·청구·정산을 활성화하지 않는다.
- 주소만으로 기존 집 기록 접근 권한을 부여하지 않는다.
- 역할 선택과 리소스 접근 권한을 분리한다.
- 이전 계약자의 개인정보는 다음 계약에 자동 노출하지 않는다.
- Lines, Statements, Functions, Branches 각각 80% 이상을 유지한다.
- 빌드 성공과 브라우저 검수 성공을 별도로 보고한다.
- 기존 `/` 랜딩페이지와 `start.zipsin.net` 동작을 보존한다.

## 단계와 승인 지점

| 단계 | 상세 계획 | 완료 결과 | 다음 단계 조건 |
|---|---|---|---|
| 1 | `2026-10-02-public-service-v1-phase-1-auth.md` | 서버 기반, 테스트 도구, 계정·휴대전화 인증·동의·역할 선택 | 자동검사·Preview 로그인 검수 |
| 2 | `2026-10-02-public-service-v1-phase-2-home-records-photos.md` | 첫 집, 참여 권한, 기록, 비공개 사진 | 권한·계약 분리 필수 테스트 통과 |
| 3 | `2026-10-02-public-service-v1-phase-3-calendar-account.md` | 월간 일정, 계정·동의·탈퇴 요청 | 브라우저·접근성 검수 통과 |
| 4 | `2026-10-02-public-service-v1-phase-4-test-payment-release.md` | 테스트 결제와 공개 준비 게이트 | 결제 중복·금액 검증·롤백 검수 |

## Review Focus

- OAuth 취소·재시도 때 불완전한 프로필이 활성 계정처럼 보이지 않는가.
- 초대받지 않은 사용자가 주소나 직접 URL로 집·사진·일정을 보지 못하는가.
- 참여 종료 또는 이전 계약 상태에서 쓰기와 개인정보 조회가 거부되는가.
- 업로드·저장·결제 콜백의 중복과 부분 실패가 안전하게 복구되는가.
- 모바일·키보드·느린 네트워크에서도 기본 행동과 오류 복구가 가능한가.

## 전체 완료 조건

- 네 단계의 요구사항↔소스↔테스트 추적표가 작성된다.
- 타입·단위·통합·E2E·접근성·커버리지·빌드 결과를 각각 기록한다.
- 독립 검수에서 P0·P1 결함이 0건이다.
- 사용자 승인 전에는 공개 가입 또는 실결제를 켜지 않는다.
