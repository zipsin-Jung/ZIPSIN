export type AccountUserType = 'house_hunter' | 'tenant';

export function parseUserType(value: string): AccountUserType {
  if (value === 'house_hunter' || value === 'tenant') return value;
  throw new Error('지원하지 않는 사용자 유형입니다.');
}

export function buildOnboardingRecords(input: {userId: string; userType: AccountUserType}) {
  return {
    profile: {userId: input.userId, userType: input.userType, onboardingState: 'complete' as const},
    attribution: {userId: input.userId, source: 'zipsin_check' as const},
  };
}
