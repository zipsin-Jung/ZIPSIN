import type { VerifiedPasswordSignupInput } from '@/features/auth/schemas/password-signup';

type CreateAuthResult =
  | { userId: string; sessionCreated: boolean; error?: never }
  | { userId?: never; sessionCreated?: never; error: 'account_unavailable' | 'service_unavailable' };

export type VerifiedPasswordAccountRepository = {
  claimPhoneProof(input: { challengeId: string; intentDigest: string; claimDigest: string }): Promise<boolean>;
  createAuthUser(input: { email: string; password: string; username: string }): Promise<CreateAuthResult>;
  finalizeSignup(input: {
    userId: string;
    challengeId: string;
    intentDigest: string;
    claimDigest: string;
    username: string;
    email: string;
    displayName: string;
    source: 'zipsin_check' | null;
  }): Promise<'ok' | 'username_unavailable' | 'phone_unavailable' | 'service_unavailable'>;
  releaseClaim(input: { challengeId: string; intentDigest: string; claimDigest: string }): Promise<boolean>;
  deleteAuthUser(userId: string): Promise<boolean>;
  isolatePhoneProof(input: { challengeId: string; intentDigest: string; claimDigest: string }): Promise<boolean>;
  queueCleanup(userId: string): Promise<boolean>;
};

export type VerifiedRegistrationInput = VerifiedPasswordSignupInput & {
  intentDigest: string;
  claimDigest: string;
  displayName: string;
  next: string;
};

export async function registerVerifiedPasswordAccount(
  repository: VerifiedPasswordAccountRepository,
  input: VerifiedRegistrationInput,
) {
  const claim = {
    challengeId: input.challengeId,
    intentDigest: input.intentDigest,
    claimDigest: input.claimDigest,
  };
  if (!await repository.claimPhoneProof(claim)) {
    return { ok: false as const, error: 'phone_not_verified' as const };
  }

  const created = await repository.createAuthUser({
    email: input.email,
    password: input.password,
    username: input.username,
  });
  if (created.error) {
    await repository.releaseClaim(claim);
    return { ok: false as const, error: created.error === 'account_unavailable' ? 'email_unavailable' as const : created.error };
  }

  const finalized = await repository.finalizeSignup({
    userId: created.userId,
    ...claim,
    username: input.username,
    email: input.email,
    displayName: input.displayName,
    source: input.next === '/ck' || input.next.startsWith('/ck/') ? 'zipsin_check' : null,
  });
  if (finalized === 'ok') {
    return { ok: true as const, userId: created.userId, sessionCreated: created.sessionCreated };
  }

  if (await repository.deleteAuthUser(created.userId)) {
    await repository.releaseClaim(claim);
    return { ok: false as const, error: finalized };
  }
  await repository.isolatePhoneProof(claim);
  await repository.queueCleanup(created.userId);
  return { ok: false as const, error: 'service_unavailable' as const };
}
