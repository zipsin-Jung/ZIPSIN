import { z } from 'zod';
import { maskUsername } from '@/features/auth/domain/mask';

export type FindUsernameRepository = {
  allowAttempt(scope: 'username_lookup_origin' | 'username_lookup_email', key: string): Promise<boolean>;
  findUsernamesByEmail(email: string): Promise<Array<{ username: string; createdAt: string | null }>>;
};

export type FindUsernameResult =
  | { status: 'found'; accounts: Array<{ maskedUsername: string; createdAt: string | null }> }
  | { status: 'not_found' }
  | { status: 'invalid_email' }
  | { status: 'rate_limited' };

const emailSchema = z.string().trim().toLowerCase().email().max(254);

/**
 * 이메일을 넣으면 아이디를 화면에 바로 보여 준다(메일 발송·인증 없음, 2026-10-16 사용자 결정).
 * 대신 아이디 일부를 가리고, 접속 위치·이메일별로 시도 횟수를 제한한다.
 */
export async function findUsernameByEmail(
  repository: FindUsernameRepository,
  input: { email: unknown; origin: string },
): Promise<FindUsernameResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return { status: 'invalid_email' };
  if (!await repository.allowAttempt('username_lookup_origin', input.origin)) return { status: 'rate_limited' };
  if (!await repository.allowAttempt('username_lookup_email', parsed.data)) return { status: 'rate_limited' };

  const rows = await repository.findUsernamesByEmail(parsed.data);
  if (rows.length === 0) return { status: 'not_found' };
  return {
    status: 'found',
    accounts: rows.map((row) => ({ maskedUsername: maskUsername(row.username), createdAt: row.createdAt })),
  };
}
