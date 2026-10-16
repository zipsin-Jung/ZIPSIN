import { describe, expect, it, vi } from 'vitest';
import { maskEmail, maskUsername, normalizePersonName } from '@/features/auth/domain/mask';
import { findUsernameByEmail } from '@/features/auth/services/find-username-by-email';

describe('masking (시안 ⑧ 아이디 일부 가림)', () => {
  it.each([
    ['zipsin_agent', 'zip***nt'],
    ['home12', 'ho***2'],
    ['abcd', 'a***d'],
    ['ab', 'a***'],
  ])('TEST-FIND-MASK-%#: %s → %s', (input, expected) => {
    expect(maskUsername(input)).toBe(expected);
  });

  it('TEST-FIND-MASK-EMAIL: 이메일은 앞 두 글자와 도메인만 보인다', () => {
    expect(maskEmail('nana@example.com')).toBe('na****@example.com');
    expect(maskEmail('a@example.com')).toBe('a****@example.com');
    expect(maskEmail('broken')).toBe('***');
  });

  it('TEST-FIND-NAME: 이름 비교는 공백과 대소문자를 무시한다', () => {
    expect(normalizePersonName(' 정 민선 ')).toBe(normalizePersonName('정민선'));
    expect(normalizePersonName('Kim Ana')).toBe('kimana');
  });
});

function repository(rows: Array<{ username: string; createdAt: string | null }> = [{ username: 'zipsin_agent', createdAt: '2026-10-16T01:00:00Z' }]) {
  return {
    allowAttempt: vi.fn().mockResolvedValue(true),
    findUsernamesByEmail: vi.fn().mockResolvedValue(rows),
  };
}

describe('findUsernameByEmail (이메일 → 아이디 바로 보기)', () => {
  it('TEST-FIND-ID-001: 가입된 이메일이면 가린 아이디를 돌려주고 전체 아이디는 돌려주지 않는다', async () => {
    const repo = repository();
    const result = await findUsernameByEmail(repo, { email: ' Owner@Example.com ', origin: '203.0.113.1' });
    expect(result).toEqual({ status: 'found', accounts: [{ maskedUsername: 'zip***nt', createdAt: '2026-10-16T01:00:00Z' }] });
    expect(JSON.stringify(result)).not.toContain('zipsin_agent');
    expect(repo.findUsernamesByEmail).toHaveBeenCalledWith('owner@example.com');
  });

  it('TEST-FIND-ID-002: 없는 이메일이면 not_found', async () => {
    await expect(findUsernameByEmail(repository([]), { email: 'none@example.com', origin: 'x' })).resolves.toEqual({ status: 'not_found' });
  });

  it('TEST-FIND-ID-003: 이메일 형식이 아니면 조회하지 않는다', async () => {
    const repo = repository();
    await expect(findUsernameByEmail(repo, { email: 'not-an-email', origin: 'x' })).resolves.toEqual({ status: 'invalid_email' });
    expect(repo.allowAttempt).not.toHaveBeenCalled();
  });

  it.each(['username_lookup_origin', 'username_lookup_email'])('TEST-FIND-ID-004: %s 제한에 걸리면 조회하지 않는다', async (scope) => {
    const repo = repository();
    repo.allowAttempt.mockImplementation(async (value: string) => value !== scope);
    await expect(findUsernameByEmail(repo, { email: 'owner@example.com', origin: 'x' })).resolves.toEqual({ status: 'rate_limited' });
    expect(repo.findUsernamesByEmail).not.toHaveBeenCalled();
  });
});
