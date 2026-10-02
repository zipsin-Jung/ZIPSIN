import { randomUUID } from 'node:crypto';
import type {
  PhoneChallenge,
  PhoneVerificationProvider,
  PhoneVerificationResult,
} from './provider';

type Entry = {
  phoneE164: string;
  userId: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  used: boolean;
};

type Options = {
  now?: () => Date;
  code?: string;
  maxAttempts?: number;
};

export class MockPhoneVerificationProvider implements PhoneVerificationProvider {
  private readonly entries = new Map<string, Entry>();
  private readonly now: () => Date;
  private readonly code: string;
  private readonly maxAttempts: number;

  constructor(options: Options = {}) {
    this.now = options.now ?? (() => new Date());
    this.code = options.code ?? '123456';
    this.maxAttempts = options.maxAttempts ?? 5;
  }

  async sendCode(phoneE164: string, userId: string): Promise<PhoneChallenge> {
    const id = randomUUID();
    const expiresAt = new Date(this.now().getTime() + 5 * 60 * 1000);
    this.entries.set(id, {
      phoneE164,
      userId,
      code: this.code,
      expiresAt,
      attempts: 0,
      used: false,
    });
    return { id, expiresAt: expiresAt.toISOString(), developmentCode: this.code };
  }

  async verifyCode(
    challengeId: string,
    code: string,
    userId: string,
  ): Promise<PhoneVerificationResult> {
    const entry = this.entries.get(challengeId);
    if (!entry || entry.userId !== userId) return { ok: false, reason: 'not_found' };
    if (entry.used) return { ok: false, reason: 'used' };
    if (this.now() > entry.expiresAt) return { ok: false, reason: 'expired' };
    entry.attempts += 1;
    if (entry.attempts >= this.maxAttempts && code !== entry.code) {
      return { ok: false, reason: 'attempts_exceeded' };
    }
    if (code !== entry.code) return { ok: false, reason: 'mismatch' };
    entry.used = true;
    return {
      ok: true,
      phoneE164: entry.phoneE164,
      verifiedAt: this.now().toISOString(),
      expiresAt: entry.expiresAt.toISOString(),
    };
  }
}
