# Signup and Desktop Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 휴대전화 인증이 보이는 가입 흐름과 여러 집을 다루기 쉬운 PC 웹앱을 완성한다.

**Architecture:** 현재 인증 세션 뒤 전화 인증 구조와 Supabase RLS를 유지한다. 화면 가시화, 권한 범위 안의 클라이언트 검색·정렬, 서버 로그아웃만 추가한다.

**Tech Stack:** Next.js App Router 16.4, React 19, TypeScript, Supabase, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-10-13-signup-desktop-workspace-design.md`

## Global Constraints

- Production mock 인증 금지, Production 배포 금지.
- 주소 검색은 이미 허용된 집 목록 안에서만 수행.
- 모바일 기존 흐름과 개인 계정 원칙 유지.

## Review Focus

- 공급자 503/요청 제한/잘못된 번호가 서로 다른 복구 문구를 보인다.
- 검색 결과 없음이 전체 집 없음과 구분된다.
- 로그아웃 뒤 세션과 보호 경로가 닫힌다.
- 320px 모바일과 1440px PC 모두 가로 넘침이 없다.

---

### Task 1: 가입 단계와 인증 오류

- [ ] TEST-ZSD-AUTH-001~003을 먼저 실패시킨다.
- [ ] 가입 단계표·문구와 오류 매핑을 최소 구현한다.
- [ ] 집중 테스트와 인증 회귀 테스트를 통과시킨다.

### Task 2: PC 집 목록

- [ ] TEST-ZSD-WEB-001~003을 먼저 실패시킨다.
- [ ] 권한 있는 집 배열의 검색·정렬·빈 결과와 빠른 행동을 구현한다.
- [ ] 모바일·데스크톱 집중 테스트를 통과시킨다.

### Task 3: 로그아웃

- [ ] TEST-ZSD-SESSION-001~002를 먼저 실패시킨다.
- [ ] 서버 로그아웃과 마이 화면 버튼을 구현한다.
- [ ] 보호 경로 회귀를 확인한다.

### Task 4: 전체 검수와 기록

- [ ] 타입·단위·통합·커버리지·빌드를 실행한다.
- [ ] 320·390·768·1280·1440px 브라우저를 검수한다.
- [ ] 실제 SMS 미연결을 차단 조건으로 남기고 독립 검수한다.
- [ ] 문서·바탕화면·GitHub·Preview를 동기화한다.
