import { describe, expect, it } from 'vitest';
import { passwordSignupSchema } from '@/features/auth/schemas/password-signup';

const valid = {
  username: 'home_owner',
  password: 'safe-password-2026',
  passwordConfirm: 'safe-password-2026',
  email: 'owner@example.com',
  termsAccepted: true,
  privacyAccepted: true,
};

describe('password signup schema', () => {
  it('accepts the approved account fields', () => {
    expect(passwordSignupSchema.parse(valid)).toMatchObject({
      username: 'home_owner',
      email: 'owner@example.com',
    });
  });

  it('normalizes username and email', () => {
    expect(passwordSignupSchema.parse({ ...valid, username: ' HOME_OWNER ', email: ' OWNER@EXAMPLE.COM ' }))
      .toMatchObject({ username: 'home_owner', email: 'owner@example.com' });
  });

  it('rejects passwords outside 8 to 128 characters', () => {
    expect(passwordSignupSchema.safeParse({ ...valid, password: 'short', passwordConfirm: 'short' }).success).toBe(false);
    const long = 'a'.repeat(129);
    expect(passwordSignupSchema.safeParse({ ...valid, password: long, passwordConfirm: long }).success).toBe(false);
  });

  it.each(['PASSWORD!1', 'password!x', 'password12'])('소문자·숫자·특수문자 중 하나라도 빠진 비밀번호 %s를 거부한다', (password) => {
    expect(passwordSignupSchema.safeParse({ ...valid, password, passwordConfirm: password }).success).toBe(false);
  });

  it('rejects a mismatched password confirmation', () => {
    expect(passwordSignupSchema.safeParse({ ...valid, passwordConfirm: 'different-password' }).success).toBe(false);
  });

  it.each(['termsAccepted', 'privacyAccepted'] as const)('requires %s', (field) => {
    expect(passwordSignupSchema.safeParse({ ...valid, [field]: false }).success).toBe(false);
  });
});
