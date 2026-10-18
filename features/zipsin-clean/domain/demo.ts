/**
 * 집신클린 체험용(배포 전 눌러 보기) 설정과 예시 데이터.
 * - 실서비스(VERCEL_ENV=production)에서는 체험 화면을 열지 않고 준비 중 화면만 보인다.
 * - 아래 업체와 숫자는 모두 예시다. 실제 업체·실적이 아니다.
 */
export function isCleanDemoOpen(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv !== 'production';
}

export type DemoPartner = {
  id: string;
  name: string;
  area: string;
  checks: string[];
  onTimeRate: number;
  rehireRate: number;
  completed: number;
  team: string;
};

export const DEMO_PARTNERS: DemoPartner[] = [
  { id: 'p1', name: '초록손 청소 (예시)', area: '마포·서대문', checks: ['대표 대면', '현장 동행', '배상보험'], onTimeRate: 98, rehireRate: 41, completed: 128, team: '정직원 팀' },
  { id: 'p2', name: '반듯 홈케어 (예시)', area: '마포·은평', checks: ['대표 대면', '현장 동행'], onTimeRate: 95, rehireRate: 33, completed: 76, team: '대표 직접 참여' },
  { id: 'p3', name: '맑은집 (예시)', area: '마포·용산', checks: ['대표 대면', '현장 동행', '배상보험'], onTimeRate: 97, rehireRate: 29, completed: 54, team: '정직원 팀' },
];

/** 날짜마다 쉬는 업체가 있는 것처럼 보이게 한다(체험용). 첫 번째 날짜에도 최소 1곳은 열린다. */
export function availablePartners(dayIndex: number): DemoPartner[] {
  return DEMO_PARTNERS.filter((_, index) => (dayIndex + index) % 3 !== 2);
}
