import { describe, expect, it, vi } from 'vitest';
import {
  SolapiPhoneVerificationProvider,
  buildSolapiAuthorization,
  toKoreanLocalNumber,
} from '@/features/auth/phone/solapi-provider';
import { createPhoneVerificationProvider } from '@/features/auth/phone/provider';

const NOW = new Date('2026-10-15T06:00:00.000Z');
const config = {
  apiKey: 'test-key',
  apiSecret: 'test-secret',
  senderNumber: '0212345678',
  codeSecret: 'code-secret-for-tests-only',
};

function setup(overrides: Partial<{ now: () => Date; allowAttempt: () => Promise<boolean>; ok: boolean }> = {}) {
  const fetchMock = vi.fn(async () => new Response('{}', { status: overrides.ok === false ? 500 : 200 }));
  const provider = new SolapiPhoneVerificationProvider(config, {
    fetch: fetchMock as unknown as typeof fetch,
    now: overrides.now ?? (() => NOW),
    randomCode: () => '048213',
    randomSalt: () => 'salt-1234567890',
    allowAttempt: overrides.allowAttempt ?? (async () => true),
  });
  return { provider, fetchMock };
}

describe('SMS-001 솔라피 문자 인증 공급자', () => {
  it('TEST-SMS-001 +82 번호를 국내 번호로 바꾼다', () => {
    expect(toKoreanLocalNumber('+821012345678')).toBe('01012345678');
    expect(() => toKoreanLocalNumber('+11234567890')).toThrow();
  });

  it('TEST-SMS-002 HMAC-SHA256 인증 헤더를 만든다', () => {
    const header = buildSolapiAuthorization('k', 's', '2026-10-15T06:00:00.000Z', 'salt');
    expect(header).toMatch(/^HMAC-SHA256 apiKey=k, date=2026-10-15T06:00:00.000Z, salt=salt, signature=[0-9a-f]{64}$/);
  });

  it('TEST-SMS-003 인증번호 문자를 보내고 문자 내용·번호를 정확히 전달한다', async () => {
    const { provider, fetchMock } = setup();
    const challenge = await provider.sendCode('+821012345678', 'user-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.solapi.com/messages/v4/send');
    expect((init.headers as Record<string, string>).Authorization).toContain('apiKey=test-key');
    const body = JSON.parse(String(init.body));
    expect(body.message).toEqual({
      to: '01012345678',
      from: '0212345678',
      text: '[집신] 인증번호 048213 입니다. 5분 안에 입력해 주세요.',
    });
    expect(challenge.expiresAt).toBe('2026-10-15T06:05:00.000Z');
    expect(challenge.developmentCode).toBeUndefined();
    expect(challenge.id).not.toContain('048213');
  });

  it('TEST-SMS-004 발송 실패는 공급자 오류로 알린다', async () => {
    const { provider } = setup({ ok: false });
    await expect(provider.sendCode('+821012345678', 'user-1')).rejects.toThrow('공급자');
  });

  it('TEST-SMS-005 맞는 번호를 입력하면 인증한다', async () => {
    const { provider } = setup();
    const challenge = await provider.sendCode('+821012345678', 'user-1');
    await expect(provider.verifyCode(challenge.id, '048213', 'user-1')).resolves.toEqual({
      ok: true,
      phoneE164: '+821012345678',
      verifiedAt: NOW.toISOString(),
      expiresAt: '2026-10-15T06:05:00.000Z',
    });
  });

  it('TEST-SMS-006 틀린 번호·다른 사용자·변조된 값은 거부한다', async () => {
    const { provider } = setup();
    const challenge = await provider.sendCode('+821012345678', 'user-1');

    await expect(provider.verifyCode(challenge.id, '111111', 'user-1')).resolves.toEqual({ ok: false, reason: 'mismatch' });
    await expect(provider.verifyCode(challenge.id, '048213', 'user-2')).resolves.toEqual({ ok: false, reason: 'not_found' });
    const [payload, signature] = challenge.id.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), p: '+821099998888' })).toString('base64url');
    await expect(provider.verifyCode(`${forged}.${signature}`, '048213', 'user-1')).resolves.toEqual({ ok: false, reason: 'mismatch' });
    await expect(provider.verifyCode('garbage', '048213', 'user-1')).resolves.toEqual({ ok: false, reason: 'not_found' });
  });

  it('TEST-SMS-007 5분이 지나면 만료로 거부한다', async () => {
    let now = NOW;
    const { provider } = setup({ now: () => now });
    const challenge = await provider.sendCode('+821012345678', 'user-1');
    now = new Date(NOW.getTime() + 5 * 60 * 1000 + 1);
    await expect(provider.verifyCode(challenge.id, '048213', 'user-1')).resolves.toEqual({ ok: false, reason: 'expired' });
  });

  it('TEST-SMS-008 시도 횟수를 넘으면 맞는 번호도 거부한다', async () => {
    const { provider } = setup({ allowAttempt: async () => false });
    const challenge = await provider.sendCode('+821012345678', 'user-1');
    await expect(provider.verifyCode(challenge.id, '048213', 'user-1')).resolves.toEqual({ ok: false, reason: 'attempts_exceeded' });
  });
});

describe('SMS-003 기본 동작', () => {
  it('TEST-SMS-011 기본 설정은 6자리 무작위 번호를 만들고 현재 시각으로 확인한다', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    const provider = new SolapiPhoneVerificationProvider(config, { fetch: fetchMock as unknown as typeof fetch });
    const challenge = await provider.sendCode('+821012345678', 'user-1');
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const code = /인증번호 (\d{6}) 입니다/.exec(JSON.parse(String(init.body)).message.text)?.[1];

    expect(code).toMatch(/^\d{6}$/);
    await expect(provider.verifyCode(challenge.id, code!, 'user-1')).resolves.toMatchObject({ ok: true });
  });

  it('TEST-SMS-012 서명 부분이 없거나 내용이 깨진 값은 거부한다', async () => {
    const { provider } = setup();
    await expect(provider.verifyCode('onlypayload', '048213', 'user-1')).resolves.toEqual({ ok: false, reason: 'not_found' });
    await expect(provider.verifyCode('%%%.sig', '048213', 'user-1')).resolves.toEqual({ ok: false, reason: 'not_found' });
  });
});

describe('SMS-002 공급자 선택', () => {
  it('TEST-SMS-013 솔라피 설정값이 비어 있으면(null) 공급자 오류를 낸다', () => {
    expect(() => createPhoneVerificationProvider({ nodeEnv: 'production', provider: 'solapi' }, undefined, () => null)).toThrow('공급자');
  });

  it('TEST-SMS-014 개발 환경의 mock 은 허용하고 공급자 미설정은 거부한다', async () => {
    const { MockPhoneVerificationProvider } = await import('@/features/auth/phone/mock-provider');
    const mock = new MockPhoneVerificationProvider();
    expect(createPhoneVerificationProvider({ nodeEnv: 'development', provider: 'mock' }, mock)).toBe(mock);
    expect(() => createPhoneVerificationProvider({ nodeEnv: 'production', provider: undefined })).toThrow('공급자');
  });

  it('TEST-SMS-009 solapi 설정이면 운영에서도 솔라피를 쓴다', () => {
    const solapi = { sendCode: vi.fn(), verifyCode: vi.fn() };
    expect(createPhoneVerificationProvider({ nodeEnv: 'production', provider: 'solapi' }, undefined, () => solapi)).toBe(solapi);
  });

  it('TEST-SMS-010 solapi 설정인데 키가 없으면 공급자 오류를 낸다', () => {
    expect(() => createPhoneVerificationProvider({ nodeEnv: 'production', provider: 'solapi' })).toThrow('공급자');
  });
});
