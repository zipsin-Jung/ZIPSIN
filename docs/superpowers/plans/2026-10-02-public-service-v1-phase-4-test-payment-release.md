# 공개형 서비스 V1 4단계 테스트 결제·출시 준비 구현계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실청구 없이 요금제 선택부터 토스 테스트 결제 성공·취소·실패까지 연결하고 공개 출시 차단 조건을 자동화한다.

**Architecture:** 서버가 주문 ID와 기대 금액을 생성하고 테스트 결제 승인 결과를 서버에서 재검증한다. 테스트 구독은 실구독과 분리하고 idempotency key와 유일 제약으로 중복 처리를 막는다.

**Tech Stack:** Next.js App Router, Supabase Postgres, Toss Payments test SDK/API, Vitest, Playwright

**Spec:** `docs/12-public-self-service-v1-spec.md` (`PSV1-PAY-001`)

## Global Constraints

- 테스트 모드임을 모든 결제 화면에 표시한다.
- Production 실결제 비밀키와 실결제 활성값을 코드·Git에 두지 않는다.
- 클라이언트 성공 URL만으로 결제 완료 처리하지 않는다.
- 주문의 사용자·요금제·금액·통화·상태를 서버에서 검증한다.
- 사업자 등록·PG·카드사 승인과 사용자 별도 승인 전 실결제를 켜지 않는다.

## Review Focus

- 금액·주문 ID·사용자 변조 요청은 거부된다.
- 성공 callback·webhook 재전송에도 한 테스트 구독만 생성된다.
- 취소·실패·네트워크 단절은 유료 상태로 표시되지 않는다.
- 다른 사용자의 주문 결과를 직접 URL로 볼 수 없다.
- 테스트 키 누락이나 실제 키 오설정 때 결제 진입이 닫힌다.

---

### Task 1: 요금제·테스트 주문 schema

**Files:** Create `supabase/migrations/202610020006_test_payments.sql`, `features/billing/plans.ts`, `features/billing/domain/order.ts`, modify `types/database.ts`; test `tests/unit/billing/order.test.ts`, `tests/integration/db/payment-policies.test.ts`.

- [ ] 허용 요금·변조·중복 주문·타 사용자 RLS 테스트를 작성한다.
- [ ] `test_payment_orders`, `test_subscriptions`와 유일 제약·RLS를 구현한다.
- [ ] migration·롤백·정책 테스트 후 `feat: add test payment order model`로 커밋한다.

### Task 2: 결제 준비와 테스트 결제창

**Files:** Create `app/(app)/pricing/page.tsx`, `app/api/payments/prepare/route.ts`, `features/billing/toss/client.ts`, `features/billing/components/TestCheckoutButton.tsx`; test `tests/integration/billing/prepare.test.ts`.

- [ ] 미로그인·잘못된 plan·키 누락·중복 준비 테스트를 작성한다.
- [ ] 서버 주문 생성과 토스 테스트 결제창 호출을 구현한다.
- [ ] 실제 청구 없음 문구와 키보드 동작을 검증한다.
- [ ] `feat: add test checkout entry`로 커밋한다.

### Task 3: 성공·취소·실패와 서버 검증

**Files:** Create `app/(app)/checkout/success/page.tsx`, `fail/page.tsx`, `cancel/page.tsx`, `app/api/payments/confirm/route.ts`, `features/billing/toss/server.ts`; test `tests/integration/billing/confirm.test.ts`, `tests/e2e/test-payment.spec.ts`.

- [ ] 금액 변조·타 사용자·재전송·부분 실패·취소 E2E를 먼저 작성한다.
- [ ] 서버 승인·검증·원자적 상태 전환과 idempotency 처리를 구현한다.
- [ ] 성공·취소·실패 복귀 화면과 재시도를 구현한다.
- [ ] 테스트 카드로 실제 브라우저 시나리오 후 `feat: complete test payment flow`로 커밋한다.

### Task 4: 출시 차단·롤백·최종 검수

**Files:** Create `lib/release-gates.ts`, `docs/traceability/public-v1-payment.md`, `docs/release/public-v1-checklist.md`, `docs/worklogs/YYYY-MM-DD-public-v1-release.md`, modify `WORK_STATUS.md`.

- [ ] 모의 전화 인증, 미설정 OAuth, 약관·문의처, 실결제 설정을 검사하는 release gate 테스트를 작성한다.
- [ ] 가입·결제 기능 플래그와 직전 안정 배포 복귀 절차를 구현·기록한다.
- [ ] 전체 타입·단위·통합·E2E·접근성·커버리지·빌드를 실행한다.
- [ ] Preview 실제 브라우저에서 전체 세로 흐름을 독립 검수한다.
- [ ] P0·P1 0건, 네 커버리지 80% 이상일 때만 사용자 배포 승인을 요청하고 커밋한다.
