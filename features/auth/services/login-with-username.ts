import 'server-only';
import { usernameSchema } from '@/features/auth/domain/username';

export type UsernameLoginRepository = {
  allowAttempt(username: string): Promise<boolean>;
  resolveUsername(username: string): Promise<{ userId: string; status: 'pending' | 'active' } | null>;
  getAuthIdentity(userId: string): Promise<{ email: string; emailConfirmed: boolean } | null>;
  signInWithPassword(email: string, password: string): Promise<boolean>;
  activateUsername(userId: string): Promise<void>;
};

type LoginResult =
  | { ok: true }
  | { ok: false; error: 'invalid_credentials' | 'rate_limited' | 'service_unavailable' };

export async function loginWithUsername(
  repository: UsernameLoginRepository,
  credentials: { username: string; password: string },
  enabled: boolean,
): Promise<LoginResult> {
  if (!enabled) return { ok: false, error: 'service_unavailable' };

  const parsedUsername = usernameSchema.safeParse(credentials.username);
  if (!parsedUsername.success || credentials.password.length < 8 || credentials.password.length > 128) {
    return { ok: false, error: 'invalid_credentials' };
  }

  if (!await repository.allowAttempt(parsedUsername.data)) {
    return { ok: false, error: 'rate_limited' };
  }

  try {
    const mapping = await repository.resolveUsername(parsedUsername.data);
    if (!mapping) return { ok: false, error: 'invalid_credentials' };

    const identity = await repository.getAuthIdentity(mapping.userId);
    if (!identity?.emailConfirmed) return { ok: false, error: 'invalid_credentials' };

    const accepted = await repository.signInWithPassword(identity.email, credentials.password);
    if (!accepted) return { ok: false, error: 'invalid_credentials' };

    if (mapping.status === 'pending') await repository.activateUsername(mapping.userId);
    return { ok: true };
  } catch {
    return { ok: false, error: 'service_unavailable' };
  }
}
