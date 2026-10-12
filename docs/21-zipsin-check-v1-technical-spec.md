# 집신체크 V1 기술 설계

## 2026-10-13 공개형 UX 변경

- 대표 정적 경로를 `/ck`로 추가하고 `/check`는 호환 경로로 유지한다. 두 경로는 같은 `ZipsinCheckApp`을 사용한다.
- 시작 데이터에 선택적 `locationLabel`, `discoverySource`, `housingType`, `transactionType`을 추가한다. 스키마 버전 1의 선택 필드로 두어 기존 저장값과 호환한다.
- 체크 진행은 항목별 페이지 전환 대신 빠른 9개·꼼꼼 16개 전체 렌더링으로 바꾼다. 상세 설명과 출처·메모만 항목 안에서 펼친다.
- 비교는 핵심 9개만 후보 카드와 표에 집계한다. 꼼꼼 모드 추가 답은 다른 후보의 미확인 수를 왜곡하지 않는다.
- 손상되거나 다른 버전인 저장값은 첫 렌더에서 자동으로 덮어쓰지 않는다. 사용자가 새 체크를 시작한 뒤에만 새 상태 저장을 재개한다.
- 실제 인증·서버 저장은 포함하지 않는다. 향후 집신 단일 인증 세션을 `/ck`에서도 공유할 수 있도록 별도 계정을 만들지 않는다.

- 작성일: 2026-10-13
- 상태: G3 사용자 승인 · V1 구현·검증 완료
- 기준: `19-zipsin-check-v1-product-spec.md`, `DEC-014`, `DEC-016`

## 1. 구현 목표와 경계

기존 Next.js App Router와 정적 export를 유지하면서 `/check`에서 비회원이 체크, 요약, 최대 3채 비교를 실제로 완료하게 한다. V1은 로컬 브라우저 프로토타입이며 실제 가입·서버 저장·사진 업로드를 구현하지 않는다.

## 2. 구성

```text
app/check/page.tsx                     서버 페이지 껍데기와 메타데이터
components/zipsin-check/
  ZipsinCheckApp.tsx                   화면 전환과 로컬 저장 연결
  CheckStart.tsx                       깊이와 후보 별칭 선택
  CheckFlow.tsx                        공통·추가 항목, 설명, 상태 선택
  CheckSummary.tsx                     주의·미확인·질문 요약
  CheckCompare.tsx                     최대 3채 공통 핵심 비교
  ZipsinCheck.module.css               모바일 우선 화면 스타일
lib/zipsin-check/
  types.ts                             도메인 타입과 저장 스키마
  catalog.ts                           체크 항목 원본
  state.ts                             순수 상태 전환·요약·비교
  storage.ts                           버전형 localStorage 어댑터
```

페이지는 정적 생성하고 상호작용과 브라우저 저장은 클라이언트 컴포넌트에서 수행한다. 카탈로그와 계산 로직은 UI에서 분리해 단위 테스트할 수 있게 한다.

## 3. 데이터 모델

```ts
type CheckDepth = 'quick' | 'thorough'
type CheckStatus = 'confirmed' | 'caution' | 'unverified' | 'expert'
type EvidenceSource = 'observed' | 'explained' | 'document' | 'expert'

interface CheckItem {
  id: string
  group: string
  core: boolean
  title: string
  why: string
  how: string
  question: string
  nextAction: string
  reviewedAt?: string
}

interface Candidate {
  id: string
  alias: string
  depth: CheckDepth
  answers: Record<string, { status: CheckStatus; source: EvidenceSource; memo?: string }>
  archived: boolean
  createdAt: string
  updatedAt: string
}

interface StoredCheckState {
  schemaVersion: 1
  candidates: Candidate[]
  activeCandidateId?: string
}
```

정확 주소, 연락처, 출입 비밀번호와 사진은 모델에 두지 않는다. 메모에서 출입 비밀번호처럼 위험한 값을 감지하면 저장 전에 경고하고 저장을 막는다.

## 4. 체크 규칙

- 빠른 모드와 꼼꼼 모드는 동일한 `core: true` 항목을 공유한다.
- 모드 전환은 기존 답을 지우지 않는다. 빠른 모드에서는 추가 답을 숨기되 보존한다.
- 건너뛴 공통 항목은 요약 시 `확인 못함`으로 계산한다.
- `확인됨`은 안전 보증이 아니라 사용자의 확인 행위다.
- 요약은 총점이나 등급을 만들지 않고 `확인됨 / 주의 / 미확인 / 전문가 확인`을 각각 보여준다.
- 비교는 공통 핵심만 같은 축에 놓는다. 한 집에서만 본 추가 항목은 다른 집의 결점으로 계산하지 않는다.
- 활성 후보는 최대 3개이며 제외한 후보는 보존·복원할 수 있다.

## 5. 화면 상태

```text
start → check → summary → candidates → compare
             ↘ mode change ↗
```

- 첫 방문: 두 깊이, 예상 시간, 후보 별칭 건너뛰기
- 복구: 저장된 후보가 있으면 이어보기와 새 후보 시작 제공
- 체크: 진행률, 한 항목, 상태·출처, 접힌 설명, 선택 메모
- 요약: 주의가 항상 독립 노출되고 미확인마다 다음 행동 표시
- 비교: 2~3개 후보의 공통 핵심 상태를 나란히 표시
- 저장 실패: 메모리 상태는 유지하고 이 기기에 저장되지 않았음을 알림
- 손상된 저장값: 앱이 멈추지 않고 새 상태로 열며 원본 키를 자동 삭제하지 않음

## 6. 저장·개인정보·보안

- 저장 키: `zipsin-check:v1`
- 브라우저 밖으로 전송하지 않는다.
- 저장 시 JSON 파싱과 스키마 버전을 검증한다.
- 저장 용량 초과·접근 차단 시 현재 화면을 유지하고 오류를 안내한다.
- 공용 기기에서 기록이 보일 수 있다는 안내를 시작·복구 화면에 표시한다.
- 후보 제외는 soft archive로 처리한다. 실제 삭제 기능은 데이터 정책 승인 전 제공하지 않는다.
- 가입 CTA는 `/#signup`으로 이동하되, 현재는 체험 안내이며 계정 저장이 되지 않는다고 명시한다.

## 7. 접근성·반응형

- 모든 주요 터치 영역 최소 44×44px
- 상태는 색상만으로 구분하지 않고 아이콘·문구를 함께 사용
- 설명 버튼에 `aria-expanded`와 연결 대상 지정
- 화면 전환 시 새 제목에 포커스 이동
- 키보드만으로 상태 선택, 설명 펼침, 이전·다음 이동 가능
- 320px, 390px, 데스크톱에서 가로 스크롤 없이 동작 확인
- 사용자가 동작 줄이기를 설정하면 전환 애니메이션 최소화

## 8. 오류와 복구

| 상황 | 처리 |
|---|---|
| localStorage 사용 불가 | 현재 세션은 계속하고 저장 불가 안내 |
| JSON 손상·스키마 불일치 | 빈 화면으로 안전 복구, 기존 원본은 자동 삭제하지 않음 |
| 후보 3개 초과 | 비교에서 제외한 후보 복구 또는 기존 후보 확인 안내 |
| 미응답 항목 | 완료를 막지 않고 미확인과 다음 행동으로 표시 |
| 위험정보 메모 | 저장 차단, 안전한 메모 예시 제공 |
| JS 실행 전 | 정적 소개와 앱 로딩 안내 표시 |

## 9. 테스트와 품질 문턱

- 단위: 카탈로그 공통성, 상태 전환, 모드 전환, 요약, 비교, archive/restore, 민감정보 검사
- 컴포넌트: 시작, 설명 접근성, 체크 진행, 요약, 비교, 저장 오류
- 시나리오: 빠른 완주, 꼼꼼→빠른 전환, 서로 다른 깊이 비교, 새로고침 복구
- 회귀: 기존 랜딩과 `/demo` 타입검사·테스트·정적 빌드
- 브라우저: 실제 `/ck`를 320px·390px·데스크톱에서 확인
- 커버리지: 새 집신체크 제품 코드의 lines/statements/functions/branches 각각 80% 이상

빌드 성공과 브라우저 검수 성공은 별도로 보고한다. 로컬 전용이므로 서버 부하 스트레스 검사는 해당 없음으로 기록하되, 후보 3개와 모든 항목을 채운 최대 V1 상태에서 UI 반응을 확인한다.

## 10. 요구사항 추적

구현 후 `19-zipsin-check-v1-product-spec.md`의 추적표에 실제 소스 파일·심볼, 테스트 파일·테스트명과 실행 증거를 추가한다. 대표 매핑은 다음과 같다.

| 요구사항 | 구현 책임 | 테스트 책임 |
|---|---|---|
| ZC-001~003 | catalog, state, CheckStart, CheckFlow | catalog/state/component tests |
| ZC-004~005 | CheckFlow, sensitive-data guard | accessibility/component/unit tests |
| ZC-006 | summary builder, CheckSummary | state/component tests |
| ZC-007 | comparison builder, CheckCompare | state/component tests |
| ZC-008 | storage, ZipsinCheckApp, CTA | storage/integration tests |

## 11. 배포와 되돌리기

첫 구현은 대표 `/ck`와 호환 `/check` 경로로 기존 기능과 격리한다. 검수 전 프로덕션 배포는 하지 않는다. 문제가 있으면 두 경로와 전용 모듈만 되돌리고 기존 랜딩·데모를 유지할 수 있다.

## 12. 승인 지점

이 기술 설계와 `DEC-016`을 승인하면 G3를 고정하고 테스트 우선 구현을 시작한다. 실제 계정·서버·사진·개인정보 정책은 별도 결정 없이 범위에 추가하지 않는다.
