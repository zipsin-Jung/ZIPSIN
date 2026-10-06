import { z } from 'zod';

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'support',
  'zipsin',
]);

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .pipe(z.string().regex(/^[a-z0-9_]{4,20}$/))
  .refine((value) => !RESERVED_USERNAMES.has(value), {
    message: '사용할 수 없는 아이디입니다.',
  });
