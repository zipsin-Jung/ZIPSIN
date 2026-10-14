import { maskPhone, normalizeKoreanMobile } from '@/features/auth/schemas/verification';

type DeliveryStatus = 'sent' | 'failed';

export type AnonymousSignupPhoneRepository = {
  allowSend(phoneE164: string, intentDigest: string): Promise<boolean>;
  issue(input: {
    challengeId: string;
    intentDigest: string;
    phoneE164: string;
    codeDigest: string;
    expiresAt: string;
  }): Promise<void>;
  send(input: { to: string; code: string; expiresInMinutes: number }): Promise<{ providerMessageId?: string }>;
  markDelivery(challengeId: string, status: DeliveryStatus, providerMessageId: string | null): Promise<void>;
};

export type AnonymousSignupPhoneVerifier = {
  verify(input: { challengeId: string; intentDigest: string; codeDigest: string }): Promise<string>;
};

export async function sendAnonymousSignupPhoneCode(
  repository: AnonymousSignupPhoneRepository,
  input: {
    phone: string;
    intentDigest: string;
    challengeId: string;
    code: string;
    codeDigest: string;
    expiresAt: string;
  },
) {
  const phoneE164 = normalizeKoreanMobile(input.phone);
  if (!await repository.allowSend(phoneE164, input.intentDigest)) {
    return { ok: false as const, error: 'rate_limited' as const };
  }
  await repository.issue({
    challengeId: input.challengeId,
    intentDigest: input.intentDigest,
    phoneE164,
    codeDigest: input.codeDigest,
    expiresAt: input.expiresAt,
  });
  try {
    const delivery = await repository.send({ to: phoneE164, code: input.code, expiresInMinutes: 5 });
    await repository.markDelivery(input.challengeId, 'sent', delivery.providerMessageId ?? null);
    return {
      ok: true as const,
      challengeId: input.challengeId,
      expiresAt: input.expiresAt,
      maskedPhone: maskPhone(phoneE164),
    };
  } catch {
    await repository.markDelivery(input.challengeId, 'failed', null);
    return { ok: false as const, error: 'provider_unavailable' as const };
  }
}

export async function verifyAnonymousSignupPhoneCode(
  repository: AnonymousSignupPhoneVerifier,
  input: { challengeId: string; intentDigest: string; codeDigest: string },
) {
  const status = await repository.verify(input);
  return status === 'verified'
    ? { ok: true as const }
    : { ok: false as const, error: status };
}
