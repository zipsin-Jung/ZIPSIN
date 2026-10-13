# 2026-10-13 집신체크 비교 중심 V2 구현

## 수행 순서

1. V1 원본을 보존하는 V2 저장·이전
2. 여러 집 보관·비교 선택·사진 일괄 삭제
3. 간단·상세 등록과 수정
4. 현장 필수 5개와 메모 안 사진
5. 2~3채 선택과 동일 행 비교표
6. 안전한 전화·매물 링크·영구 삭제
7. 자동검사·실제 브라우저·독립 검수·GitHub 저장

## 변경 내용

- `zipsin-check:v2`를 추가하고 v1 후보 ID·답변·사진 연결을 보존했다. v1 원본은 자동 삭제하지 않는다.
- 별명을 비워도 `오늘 본 집 N`으로 바로 시작하며, 상세 등록에서 위치·금액·관리비·출퇴근·담당자·링크를 선택 입력한다.
- 현장 항목을 `물·배수`, `곰팡이·누수`, `채광·소음`, `창문·문`, `옵션·파손` 5개로 줄였다.
- 큰 결과는 `괜찮음 / 다시 확인 / 미확인`, 상세 네모 체크는 실제 행동 수행 여부로 분리했다.
- 사진은 메모 하단 시트에서만 추가·교체·삭제한다.
- 저장된 집 중 2~3채를 선택하고 위치·금액·관리비·월고정비·출퇴근·현장 5개·담당자를 같은 행으로 비교한다.
- 전화는 유효한 번호만 `tel:`로, 매물 링크는 `http/https`만 연다.
- 영구 삭제는 사진 IndexedDB 트랜잭션이 성공한 후에 텍스트 기록을 지운다. 사진 삭제 실패 시 기록을 유지하고 재시도를 안내한다.

## 검증 결과

- `npm run test:coverage`: 15개 파일, 68개 테스트 통과
- 커버리지: statements 87.54%, branches 82.82%, functions 86.87%, lines 98.20%
- `npm run typecheck`: 통과
- `npm run build`: 통과, `/ck` 정적 생성 확인
- `git diff --check`: 통과
- 실제 브라우저 390px: 필수 5개, 메모 안 사진, 상세 체크, 2채 비교 확인
- 320px·390px·1440px: 문서 가로 넘침 없음. 비교표 영역만 의도된 가로 이동
- 실제 브라우저 콘솔 warning/error: 0건

## 요구사항 추적 예시

| 요구 | 소스 | 테스트·증거 |
|---|---|---|
| ZCC-001 | `CandidateForm`, `createCandidateV2` | `CandidateForm.test.tsx`, `ZipsinCheckApp.test.tsx` |
| ZCC-002 | `catalog`, `CheckFlow`, `MemoPhotoSheet` | catalog/flow/sheet 테스트, 390px 브라우저 |
| ZCC-003~004 | `toggleComparison`, `buildHomeComparison`, `ComparePicker`, `CheckCompare` | state/format/compare 테스트, 320px 비교표 |
| ZCC-005 | `contact.ts`, `CheckCompare` | `contact.test.ts`, 유효한 `tel:` 테스트 |
| ZCC-006~007 | `storage`, `removeCandidate`, `PhotoStore.removeCandidate`, `ZipsinCheckApp` | storage/state/photo/app 테스트 |
| ZCC-008 | `/#signup` CTA | 로컬 전용 문구 확인; 실제 계정 이전은 후속 |

## 남은 일

- `zipsin.net` 인증·DB·파일 저장소가 구현된 후 `ck.zipsin.net` 단일 로그인과 선택 기록 이전을 별도 승인으로 구현한다.
- 이번 작업은 운영 배포나 실제 계정 저장을 포함하지 않는다.
