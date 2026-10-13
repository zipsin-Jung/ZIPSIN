# 다음 대화에서 이어서 작업하기

이 프로젝트 폴더 또는 ZIPSIN-project.zip을 새 대화에 첨부한 뒤 아래 문장만 보내세요.

> 집신 랜딩페이지 작업을 이어 주세요. WORK_STATUS.md, AGENTS.md, docs/CODEX_MIGRATION.md를 먼저 읽고 기존 코드를 확인한 뒤, 남은 작업만 진행해 주세요. 코드를 처음부터 다시 만들지 말고 토큰을 아껴 주세요.

## 현재 단계
랜딩페이지 구현 및 Next.js 빌드는 완료했습니다. 최종 브라우저 검수와 GitHub/Vercel 계정 연결·배포가 남았습니다.

## 2026-10-13 집신체크 계정 연동

`codex/zipsin-check-comparison-v2`에 단일계정·후보기록 이전 코드와 Preview 준비 문서가 있습니다. 130개 자동검사·빌드·Chromium E2E·앱 내 브라우저 필수 5개 화면 검수는 통과했지만 실제 Supabase 프로젝트, RLS pgTAP, OAuth 성공·취소, 다른 기기 복원은 미검수입니다. 다음 작업은 Preview Supabase 환경을 연결하고 `docs/deployment/zipsin-check-preview-runbook.md` 순서대로 통합검수하는 것입니다. Production·DNS는 사용자 G6 승인 전 변경하지 않습니다.

## 중요한 구분
작업 파일을 옮기면 이어 작업할 수 있습니다. 계정 간 사용량이나 대화 맥락이 자동으로 이전된다는 뜻은 아닙니다.
사용자의 Mac 바탕화면에 직접 파일을 저장한 적은 없습니다. 압축본을 다운로드하고 바탕화면에 압축을 풀면 실제 로컬 프로젝트가 됩니다.

## Codex 이전
- 2026-09-29에 공유 대화의 ZIP을 Codex 작업공간의 `ZIPSIN/`으로 옮겼습니다.
- 공유 대화의 최신 지시와 ZIP 불일치는 `docs/CODEX_MIGRATION.md`에 정리했습니다.
- 실제 파일과 새로 수행한 검증 결과를 대화 요약보다 우선합니다.
