import type { QuoteInput } from './pricing';

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

/** 업체 화면 체험용 작업 요청. 주소·연락처는 모두 가짜 예시다. */
export type DemoJob = {
  id: string;
  area: string;
  dayOffset: number;
  start: number;
  arrival: number | null;
  input: QuoteInput;
  detailAddress: string;
  contact: string;
};

export const DEMO_JOBS: DemoJob[] = [
  { id: 'j1', area: '마포구 공덕동', dayOffset: 1, start: 9, arrival: 17, detailAddress: '예시아파트 101동 1203호', contact: '010-0000-0000',
    input: { service: 'move_in', areaPyeong: 24, rooms: 3, baths: 2, balcony: 'expanded', builtAge: 'mid', occupancy: 'just_left', pets: 'no', smoking: 'no' } },
  { id: 'j2', area: '서대문구 북아현동', dayOffset: 3, start: 8, arrival: null, detailAddress: '예시빌라 302호', contact: '010-0000-0000',
    input: { service: 'move_in', areaPyeong: 15, rooms: 2, baths: 1, balcony: 'full', builtAge: 'old', occupancy: 'vacant_long', pets: 'unknown', smoking: 'no' } },
  { id: 'j3', area: '마포구 망원동', dayOffset: 5, start: 13, arrival: null, detailAddress: '예시오피스텔 805호', contact: '010-0000-0000',
    input: { service: 'tidy', areaPyeong: 10, rooms: 1, baths: 1, balcony: 'unknown', builtAge: 'unknown', occupancy: 'unknown', pets: 'no', smoking: 'no', tidyHours: 3 } },
];
