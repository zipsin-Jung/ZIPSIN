import { describe, expect, it, vi } from 'vitest';
import {
  sendAnonymousSignupPhoneCode,
  verifyAnonymousSignupPhoneCode,
} from '@/features/auth/services/anonymous-signup-phone';

describe('anonymous signup phone service', () => {
  it('saves the challenge before sending and returns only masked data', async () => {
    const calls: string[] = [];
    const repository = {
      allowSend: vi.fn().mockResolvedValue(true),
      issue: vi.fn(async () => { calls.push('issue'); }),
      send: vi.fn(async () => { calls.push('send'); return { providerMessageId: 'msg-1' }; }),
      markDelivery: vi.fn().mockResolvedValue(undefined),
    };
    await expect(sendAnonymousSignupPhoneCode(repository, {
      phone: '010-1234-5678', intentDigest: 'intent', challengeId: 'challenge',
      code: '123456', codeDigest: 'digest', expiresAt: '2026-10-14T01:05:00.000Z',
    })).resolves.toEqual({
      ok: true,
      challengeId: 'challenge',
      expiresAt: '2026-10-14T01:05:00.000Z',
      maskedPhone: '010-****-5678',
    });
    expect(calls).toEqual(['issue', 'send']);
  });

  it('does not issue or send when atomic rate limiting rejects', async () => {
    const repository = {
      allowSend: vi.fn().mockResolvedValue(false), issue: vi.fn(), send: vi.fn(), markDelivery: vi.fn(),
    };
    await expect(sendAnonymousSignupPhoneCode(repository, {
      phone: '01012345678', intentDigest: 'intent', challengeId: 'challenge',
      code: '123456', codeDigest: 'digest', expiresAt: '2026-10-14T01:05:00.000Z',
    })).resolves.toEqual({ ok: false, error: 'rate_limited' });
    expect(repository.issue).not.toHaveBeenCalled();
    expect(repository.send).not.toHaveBeenCalled();
  });

  it('marks provider failure without bypassing verification', async () => {
    const repository = {
      allowSend: vi.fn().mockResolvedValue(true), issue: vi.fn(),
      send: vi.fn().mockRejectedValue(new Error('provider down')),
      markDelivery: vi.fn().mockResolvedValue(undefined),
    };
    await expect(sendAnonymousSignupPhoneCode(repository, {
      phone: '01012345678', intentDigest: 'intent', challengeId: 'challenge',
      code: '123456', codeDigest: 'digest', expiresAt: '2026-10-14T01:05:00.000Z',
    })).resolves.toEqual({ ok: false, error: 'provider_unavailable' });
    expect(repository.markDelivery).toHaveBeenCalledWith('challenge', 'failed', null);
  });

  it.each(['expired', 'attempts_exceeded', 'invalid_code', 'not_found'] as const)(
    'returns stable %s verification errors without account data',
    async (status) => {
      const repository = { verify: vi.fn().mockResolvedValue(status) };
      await expect(verifyAnonymousSignupPhoneCode(repository, {
        challengeId: 'challenge', codeDigest: 'digest', intentDigest: 'intent',
      })).resolves.toEqual({ ok: false, error: status });
    },
  );

  it('returns only success after the server verifies the same intent', async () => {
    const repository = { verify: vi.fn().mockResolvedValue('verified') };
    await expect(verifyAnonymousSignupPhoneCode(repository, {
      challengeId: 'challenge', codeDigest: 'digest', intentDigest: 'intent',
    })).resolves.toEqual({ ok: true });
  });
});
