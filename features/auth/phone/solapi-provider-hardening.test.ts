import { describe, expect, it, vi } from 'vitest';
import { SolapiSmsTransport } from './solapi-provider';

describe('SolapiSmsTransport hardening', () => {
  it('rejects a successful response without a provider id', async () => {
    const transport = new SolapiSmsTransport({ apiKey: 'key', apiSecret: 'secret', senderNumber: '01012345678', fetcher: vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) });
    await expect(transport.sendOtp({ to: '+821012345678', code: '123456', expiresInMinutes: 5 })).rejects.toThrow('sms_provider_invalid_response');
  });
});
