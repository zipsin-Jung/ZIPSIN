import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { SolapiSmsTransport } from '@/features/auth/phone/solapi-provider';
import { createOtpDigest, verifyOtpDigest } from '@/features/auth/phone/otp-digest';

describe('SOLAPI phone verification boundary', () => {
  it('인증번호를 challenge별 HMAC digest로만 비교한다', () => {
    const digest = createOtpDigest('123456', 'challenge-1', 'secret-key');
    expect(digest).toBe(createHmac('sha256', 'secret-key').update('challenge-1:123456').digest('hex'));
    expect(verifyOtpDigest('123456', 'challenge-1', digest, 'secret-key')).toBe(true);
    expect(verifyOtpDigest('654321', 'challenge-1', digest, 'secret-key')).toBe(false);
  });

  it('SOLAPI 요청에 발신번호와 인증번호를 보내고 비밀값은 본문에 넣지 않는다', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ groupId: 'group-1' }) });
    const transport = new SolapiSmsTransport({
      apiKey: 'api-key', apiSecret: 'api-secret', senderNumber: '0212345678',
      now: () => new Date('2026-10-14T00:00:00.000Z'), salt: () => 'fixed-salt', fetcher,
    });
    await expect(transport.sendOtp({ to: '+821012345678', code: '123456', expiresInMinutes: 5 })).resolves.toEqual({ providerMessageId: 'group-1' });
    const [, init] = fetcher.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ message: { to: '01012345678', from: '0212345678', text: '[집신] 인증번호는 123456입니다. 5분 안에 입력해 주세요.' } });
    expect(init.headers.Authorization).toContain('apiKey=api-key');
    expect(init.body).not.toContain('api-secret');
  });

  it('공급자 오류를 민감정보 없는 코드로 변환한다', async () => {
    const transport = new SolapiSmsTransport({
      apiKey: 'key', apiSecret: 'secret', senderNumber: '0212345678',
      fetcher: vi.fn().mockResolvedValue({ ok: false, json: async () => ({ errorCode: 'NotEnoughBalance' }) }),
    });
    await expect(transport.sendOtp({ to: '+821012345678', code: '123456', expiresInMinutes: 5 })).rejects.toThrow('sms_provider_unavailable');
  });
});
