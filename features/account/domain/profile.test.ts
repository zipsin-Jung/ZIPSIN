import {describe, expect, it} from 'vitest';
import {buildOnboardingRecords, parseUserType} from './profile';

describe('tenant onboarding records', () => {
  it('stores acquisition source separately from confirmed user type', () => {
    expect(buildOnboardingRecords({userId: 'user-1', userType: 'tenant'})).toEqual({
      profile: {id: 'user-1', userType: 'tenant', onboardingState: 'complete'},
      attribution: {userId: 'user-1', source: 'zipsin_check'},
    });
  });

  it('allows the suggested tenant type to be changed', () => {
    expect(parseUserType('house_hunter')).toBe('house_hunter');
    expect(parseUserType('tenant')).toBe('tenant');
  });

  it('rejects a resource role as an account user type', () => {
    expect(() => parseUserType('office_admin')).toThrow('지원하지 않는 사용자 유형입니다.');
  });

  it('does not create a home, contract, or membership payload', () => {
    const records = buildOnboardingRecords({userId: 'user-1', userType: 'house_hunter'});
    expect(records).not.toHaveProperty('membership');
    expect(records).not.toHaveProperty('home');
    expect(records).not.toHaveProperty('contract');
  });
});
