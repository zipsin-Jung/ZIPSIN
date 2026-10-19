/**
 * 집신청소 기준가 v0 (2026-10-18).
 * - "근거"가 있는 값은 2026년 공개 시세 자료에서 가져왔다.
 * - "임시"인 값은 근거가 없어 정해 둔 값이다. 업체 대표님 인터뷰(기준가 v1) 뒤 바꾼다.
 * 화면에는 임시 값이 쓰였다는 사실을 숨기지 않는다.
 */
export const PRICE_TABLE_VERSION = 'v0-2026-10-18';

export const MOVE_IN = {
  /** 근거: 입주청소 평당 1만 2천~1만 5천 원(2026). 가운데 값을 1등급 단가로 쓴다. */
  unitWonPerPyeong: 13_500,
  /** 근거: 신축은 분진 때문에 평당 1만 8천 원까지. 신축 첫 입주에 더하는 금액. */
  newBuildExtraPerPyeong: 3_000,
  /** 임시: 등급별 배수(1등급 양호, 2등급 보통, 3등급 심함). */
  gradeMultiplier: { 1: 1, 2: 1.15, 3: 1.3 } as const,
  /** 임시: 통베란다(비확장)는 일이 더 많다. 근거: 구조가 가격에 영향(비확장형 베란다). 비율은 임시. */
  fullBalconyMultiplier: 1.1,
  /** 임시: 최소 금액. 근거 참고: 원룸(10평 이하) 시세 18~25만 원. */
  minimumWon: 180_000,
  /** 임시: 한 사람이 1평에 쓰는 시간. 근거 참고: 24평 3명 약 4~5시간. */
  hoursPerPyeong: 0.55,
} as const;

export const TIDY = {
  /** 임시: 생활 정리 청소 시간제 가격. 근거 참고: 앱 서비스 2시간 3만 8천·4시간 6만 5천 원, 동네 4시간 7만 5천 원. */
  wonByHours: { 2: 40_000, 3: 55_000, 4: 70_000 } as const,
};

export type TableValue = { name: string; status: '근거' | '임시' };
export const TABLE_NOTES: TableValue[] = [
  { name: '입주 청소 평당 단가', status: '근거' },
  { name: '신축 추가 단가', status: '근거' },
  { name: '오염 등급별 배수', status: '임시' },
  { name: '통베란다 추가', status: '임시' },
  { name: '최소 금액', status: '임시' },
  { name: '인원·시간 계산', status: '임시' },
  { name: '생활 정리 청소 시간제 가격', status: '임시' },
];
