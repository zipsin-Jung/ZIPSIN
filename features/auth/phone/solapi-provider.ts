import { createHmac, randomUUID } from 'node:crypto';

type Fetcher = (input: string, init: RequestInit) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

type SolapiConfig = {
  apiKey: string;
  apiSecret: string;
  senderNumber: string;
  now?: () => Date;
  salt?: () => string;
  fetcher?: Fetcher;
};

export class SolapiSmsTransport {
  constructor(private readonly config: SolapiConfig) {}

  async sendOtp(input: { to: string; code: string; expiresInMinutes: number }): Promise<{ providerMessageId: string }> {
    const date = (this.config.now ?? (() => new Date()))().toISOString();
    const salt = (this.config.salt ?? randomUUID)();
    const signature = createHmac('sha256', this.config.apiSecret).update(date + salt).digest('hex');
    const fetcher = this.config.fetcher ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    let response: Awaited<ReturnType<Fetcher>>;
    try {
      response = await fetcher('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `HMAC-SHA256 apiKey=${this.config.apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({
        message: {
          to: input.to.replace(/^\+82/, '0').replace(/\D/g, ''),
          from: this.config.senderNumber.replace(/\D/g, ''),
          text: `[집신] 인증번호는 ${input.code}입니다. ${input.expiresInMinutes}분 안에 입력해 주세요.`,
        },
      }),
      signal: controller.signal,
      });
    } catch {
      throw new Error('sms_provider_unavailable');
    } finally {
      clearTimeout(timeout);
    }
    let body: { groupId?: string; messageId?: string };
    try {
      body = await response.json() as { groupId?: string; messageId?: string };
    } catch {
      throw new Error('sms_provider_invalid_response');
    }
    if (!response.ok) throw new Error('sms_provider_unavailable');
    const providerMessageId = body.groupId ?? body.messageId;
    if (!providerMessageId) throw new Error('sms_provider_invalid_response');
    return { providerMessageId };
  }
}
