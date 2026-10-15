import { describe, expect, it } from 'vitest';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';

describe('sanitizeNextPath', () => {
  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/%5cevil.example', '/ck/../admin', '/%2F%2Fevil.example', 'javascript:alert(1)', 'home'])(
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

  it('집신체크의 후보 복귀 경로를 유지한다', () => {
    expect(sanitizeNextPath('/ck/transfer?candidate=candidate-1')).toBe(
      '/ck/transfer?candidate=candidate-1',
    );
  });

  it('값이 없으면 홈을 사용한다', () => {
    expect(sanitizeNextPath(null)).toBe('/home');
  });

  it.each(['/api/candidates', '/auth/callback', '/login', '/unknown'])('인증 루프·API·미허용 내부 경로 %s를 막는다', (value) => {
    expect(sanitizeNextPath(value)).toBe('/home');
  });
});
