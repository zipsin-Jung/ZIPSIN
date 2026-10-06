import {
  passwordSignupSchema,
  type PasswordSignupInput,
} from '@/features/auth/schemas/password-signup';

type CreateAuthResult =
  | { userId: string; error?: never }
  | { userId?: never; error: 'email_exists' | 'service_error' };

export type PasswordAccountRepository = {
  createAuthUser(input: { email: string; password: string; username: string }): Promise<CreateAuthResult>;
  reserveUsername(userId: string, username: string): Promise<boolean>;
  deleteAuthUser(userId: string): Promise<void>;
};

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: 'account_unavailable' | 'service_unavailable' };

export async function registerPasswordAccount(
  repository: PasswordAccountRepository,
  rawInput: PasswordSignupInput,
): Promise<RegisterResult> {
  const input = passwordSignupSchema.parse(rawInput);
  const created = await repository.createAuthUser({
    email: input.email,
    password: input.password,
    username: input.username,
  });

  if (created.error) {
    return {
      ok: false,
      error: created.error === 'email_exists' ? 'account_unavailable' : 'service_unavailable',
    };
  }

  try {
    const reserved = await repository.reserveUsername(created.userId, input.username);
    if (reserved) return { ok: true, userId: created.userId };
  } catch {
    // Compensate only the user created by this request.
  }

  await repository.deleteAuthUser(created.userId);
  return { ok: false, error: 'account_unavailable' };
}
