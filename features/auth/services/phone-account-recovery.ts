import { maskPhone } from '@/features/auth/schemas/verification';

type StartRepository = {
  findAccountByPhone(phoneE164: string): Promise<{ userId: string } | null>;
  sendOtp(input: { to: string; code: string; expiresInMinutes: number }): Promise<{ providerMessageId: string }>;
  saveChallenge(input: { challengeId: string; phoneE164: string; userId: string | null; digest: string; expiresAt: string; providerMessageId: string }): Promise<void>;
};

export async function startPhoneAccountRecovery(
  repository: StartRepository,
  phoneE164: string,
  challenge: { code: string; challengeId: string; digest: string; expiresAt: string },
) {
  const account = await repository.findAccountByPhone(phoneE164);
  const sent = await repository.sendOtp({ to: phoneE164, code: challenge.code, expiresInMinutes: 5 });
  await repository.saveChallenge({
    challengeId: challenge.challengeId,
    phoneE164,
    userId: account?.userId ?? null,
    digest: challenge.digest,
    expiresAt: challenge.expiresAt,
    providerMessageId: sent.providerMessageId,
  });
  return { ok: true as const, challengeId: challenge.challengeId, maskedPhone: maskPhone(phoneE164) };
}

type VerifyRepository = {
  verifyChallenge(challengeId: string, code: string): Promise<
    | { status: 'verified'; username: string | null }
    | { status: 'expired' | 'used' | 'mismatch' | 'not_found' | 'attempts_exceeded' }
  >;
};

export async function verifyPhoneAccountRecovery(repository: VerifyRepository, challengeId: string, code: string) {
  const result = await repository.verifyChallenge(challengeId, code);
  if (result.status !== 'verified') return { ok: false as const, error: result.status };
  return { ok: true as const, username: result.username };
}
