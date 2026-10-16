/** 홈 상단에 보여 주는 집신 서비스 목록(2026-10-16 사용자 요청). 준비 중인 서비스는 링크를 걸지 않는다. */
export type ZipsinService =
  | { id: 'check'; name: string; status: 'live' }
  | { id: 'clean' | 'repair'; name: string; status: 'soon' };

export const ZIPSIN_SERVICES: readonly ZipsinService[] = [
  { id: 'check', name: '집신체크', status: 'live' },
  { id: 'repair', name: '집신수리', status: 'soon' },
  { id: 'clean', name: '집신클린', status: 'soon' },
];
