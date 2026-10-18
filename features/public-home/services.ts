/**
 * 홈 상단에 보여 주는 집신 서비스 목록(2026-10-16 사용자 요청). 준비 중인 서비스는 링크를 걸지 않는다.
 * 2026-10-18 대표 지시: 집신수리는 누르면 준비 중 화면(시안 B)으로 간다('preparing').
 */
export type ZipsinService =
  | { id: 'check'; name: string; status: 'live' }
  | { id: 'repair'; name: string; status: 'preparing' }
  | { id: 'clean'; name: string; status: 'soon' };

export const ZIPSIN_SERVICES: readonly ZipsinService[] = [
  { id: 'check', name: '집신체크', status: 'live' },
  { id: 'repair', name: '집신수리', status: 'preparing' },
  { id: 'clean', name: '집신클린', status: 'soon' },
];
