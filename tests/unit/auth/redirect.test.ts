import { describe, expect, it } from 'vitest';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';

describe('sanitizeNextPath', () => {
  it.each(['https://evil.example', '//evil.example', 'javascript:alert(1)', 'home'])(
    '외부 또는 상대 경로 %s를 홈으로 바꾼다',
    (value) => {
      expect(sanitizeNextPath(value)).toBe('/home');
    },
  );

  it('서비스 내부 절대 경로와 쿼리는 유지한다', () => {
    expect(sanitizeNextPath('/onboarding/role?from=login')).toBe(
      '/onboarding/role?from=login',
    );
  });

  it('값이 없으면 홈을 사용한다', () => {
    expect(sanitizeNextPath(null)).toBe('/home');
  });
});
