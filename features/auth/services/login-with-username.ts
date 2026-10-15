import 'server-only';
import { z } from 'zod';
import { normalizeKoreanMobile } from '@/features/auth/schemas/verification';
import { usernameSchema } from '@/features/auth/domain/username';

export type UsernameLoginRepository = {
  allowAttempt(username: string): Promise<boolean>;
  resolveIdentifier(identifier: string): Promise<{ userId?: string; email?: string; status: 'pending' | 'active' } | null>;
  getAuthIdentity(userId: string): Promise<{ email: string; emailConfirmed: boolean } | null>;
  signInWithPassword(email: string, password: string): Promise<{ accepted: boolean; userId: string | null }>;
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

  const rawIdentifier = credentials.username.trim();
  let identifier: string;
  const email = z.string().email().safeParse(rawIdentifier.toLowerCase());
  if (email.success) identifier = email.data;
  else {
    try { identifier = normalizeKoreanMobile(rawIdentifier); }
    catch {
      const username = usernameSchema.safeParse(rawIdentifier);
      if (!username.success) return { ok: false, error: 'invalid_credentials' };
      identifier = username.data;
    }
  }
  if (credentials.password.length < 8 || credentials.password.length > 128) {
    return { ok: false, error: 'invalid_credentials' };
  }

  if (!await repository.allowAttempt(identifier)) {
    return { ok: false, error: 'rate_limited' };
  }

  try {
    const mapping = await repository.resolveIdentifier(identifier);
    if (!mapping) return { ok: false, error: 'invalid_credentials' };

    let loginEmail = mapping.email;
    if (!loginEmail && mapping.userId) {
      const identity = await repository.getAuthIdentity(mapping.userId);
      if (!identity?.emailConfirmed) return { ok: false, error: 'invalid_credentials' };
      loginEmail = identity.email;
    }
    if (!loginEmail) return { ok: false, error: 'invalid_credentials' };

    const auth = await repository.signInWithPassword(loginEmail, credentials.password);
    if (!auth.accepted) return { ok: false, error: 'invalid_credentials' };

    if (mapping.status === 'pending' && (mapping.userId ?? auth.userId)) {
      await repository.activateUsername(mapping.userId ?? auth.userId!);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'service_unavailable' };
  }
}
