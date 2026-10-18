/**
 * 홈 상단에 보여 주는 집신 서비스 목록(2026-10-16 사용자 요청).
 * 2026-10-18 대표 결정: 세 서비스 모두 누르면 각자 사이트로 간다(체크 ck · 수리 rp · 청소 cl).
 * 수리·청소는 열리는 화면이 '준비 중'이다. 집신클린 → 집신청소(DEC-036).
 */
export type ZipsinService = { id: 'check' | 'repair' | 'clean'; name: string; preparing: boolean };

export const ZIPSIN_SERVICES: readonly ZipsinService[] = [
  { id: 'check', name: '집신체크', preparing: false },
  { id: 'repair', name: '집신수리', preparing: true },
  { id: 'clean', name: '집신청소', preparing: true },
];
