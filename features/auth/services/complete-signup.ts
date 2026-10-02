import { signupSchema, type SignupInput } from '@/features/auth/schemas/verification';

export type VerifiedPhone = { phoneE164: string; verifiedAt: string };

export type SignupRepository = {
  getVerifiedPhone(userId: string, challengeId: string): Promise<VerifiedPhone | null>;
  saveSignup(input: {
    userId: string;
    displayName: string;
    email: string;
    phoneE164: string;
    phoneVerifiedAt: string;
    termsVersion: string;
    privacyVersion: string;
    ageOver14: true;
    marketingSmsAccepted: boolean;
    marketingEmailAccepted: boolean;
  }): Promise<void>;
};

const DOCUMENT_VERSION = '2026-10-02';

export async function completeSignupWithRepository(
  repository: SignupRepository,
  userId: string,
  rawInput: SignupInput,
) {
  const input = signupSchema.parse(rawInput);
  const phone = await repository.getVerifiedPhone(userId, input.challengeId);
  if (!phone) return { ok: false as const, error: 'phone_not_verified' as const };

  await repository.saveSignup({
    userId,
    displayName: input.displayName,
    email: input.email,
    phoneE164: phone.phoneE164,
    phoneVerifiedAt: phone.verifiedAt,
    termsVersion: DOCUMENT_VERSION,
    privacyVersion: DOCUMENT_VERSION,
    ageOver14: true,
    marketingSmsAccepted: input.marketingSmsAccepted,
    marketingEmailAccepted: input.marketingEmailAccepted,
  });
  return { ok: true as const };
}
