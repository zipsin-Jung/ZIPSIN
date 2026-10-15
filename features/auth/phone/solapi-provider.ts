import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type {
  PhoneChallenge,
  PhoneVerificationProvider,
  PhoneVerificationResult,
} from './provider';

export type SolapiConfig = {
  apiKey: string;
  apiSecret: string;
  /** 솔라피에 등록·승인된 발신번호 (숫자만) */
  senderNumber: string;
  /** 인증번호 서명용 서버 비밀값. 브라우저·로그에 노출하지 않는다. */
  codeSecret: string;
};

type Dependencies = {
  fetch?: typeof fetch;
  now?: () => Date;
  randomCode?: () => string;
  randomSalt?: () => string;
  /** 같은 사용자의 확인 시도를 제한한다. false 면 시도 초과로 거부한다. */
  allowAttempt?: (userId: string) => Promise<boolean>;
};

const SEND_URL = 'https://api.solapi.com/messages/v4/send';
const CODE_TTL_MS = 5 * 60 * 1000;

type ChallengePayload = { p: string; u: string; e: number; n: string };

export function toKoreanLocalNumber(phoneE164: string): string {
  if (!/^\+82\d{9,10}$/.test(phoneE164)) throw new Error('국내 휴대전화 번호가 아닙니다.');
  return `0${phoneE164.slice(3)}`;
}

export function buildSolapiAuthorization(apiKey: string, apiSecret: string, date: string, salt: string): string {
  const signature = createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * 솔라피로 인증번호 문자를 보낸다.
 * 인증번호 원문은 저장하지 않고, 번호·사용자·만료시각과 함께 서버 비밀값으로 서명한 값만 challenge id 로 돌려준다.
 * 서버 인스턴스가 여러 개여도 같은 비밀값으로 확인할 수 있다.
 */
export class SolapiPhoneVerificationProvider implements PhoneVerificationProvider {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private readonly randomCode: () => string;
  private readonly randomSalt: () => string;
  private readonly allowAttempt: (userId: string) => Promise<boolean>;

  constructor(private readonly config: SolapiConfig, deps: Dependencies = {}) {
    this.fetchImpl = deps.fetch ?? fetch;
    this.now = deps.now ?? (() => new Date());
    this.randomCode = deps.randomCode ?? (() => String(randomInt(0, 1_000_000)).padStart(6, '0'));
    this.randomSalt = deps.randomSalt ?? (() => randomBytes(16).toString('hex'));
    this.allowAttempt = deps.allowAttempt ?? (async () => true);
  }

  private sign(payload: string, code: string): string {
    return createHmac('sha256', this.config.codeSecret).update(`${payload}|${code}`).digest('base64url');
  }

  async sendCode(phoneE164: string, userId: string): Promise<PhoneChallenge> {
    const to = toKoreanLocalNumber(phoneE164);
    const code = this.randomCode();
    const expiresAt = new Date(this.now().getTime() + CODE_TTL_MS);
    const payload = Buffer.from(JSON.stringify({
      p: phoneE164, u: userId, e: expiresAt.getTime(), n: this.randomSalt(),
    } satisfies ChallengePayload)).toString('base64url');

    const date = this.now().toISOString();
    const response = await this.fetchImpl(SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: buildSolapiAuthorization(this.config.apiKey, this.config.apiSecret, date, this.randomSalt()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to,
          from: this.config.senderNumber,
          text: `[집신] 인증번호 ${code} 입니다. 5분 안에 입력해 주세요.`,
        },
      }),
    });
    if (!response.ok) throw new Error('전화 인증 공급자 발송에 실패했습니다.');

    return { id: `${payload}.${this.sign(payload, code)}`, expiresAt: expiresAt.toISOString() };
  }

  async verifyCode(challengeId: string, code: string, userId: string): Promise<PhoneVerificationResult> {
    const [payload, signature] = challengeId.split('.');
    if (!payload || !signature) return { ok: false, reason: 'not_found' };

    let data: ChallengePayload;
    try {
      data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ChallengePayload;
    } catch {
      return { ok: false, reason: 'not_found' };
    }
    if (data.u !== userId) return { ok: false, reason: 'not_found' };
    if (this.now().getTime() > data.e) return { ok: false, reason: 'expired' };
    if (!await this.allowAttempt(userId)) return { ok: false, reason: 'attempts_exceeded' };

    const expected = Buffer.from(this.sign(payload, code));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
      return { ok: false, reason: 'mismatch' };
    }

    return {
      ok: true,
      phoneE164: data.p,
      verifiedAt: this.now().toISOString(),
      expiresAt: new Date(data.e).toISOString(),
    };
  }
}
