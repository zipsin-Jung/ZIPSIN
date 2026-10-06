import { describe, expect, it } from 'vitest';
import { normalizeUsername, usernameSchema } from '@/features/auth/domain/username';

describe('username policy', () => {
  it('normalizes case and surrounding whitespace', () => {
    expect(normalizeUsername('  Home_Manager_01  ')).toBe('home_manager_01');
  });

  it.each(['abc', 'a'.repeat(21), '집신123', 'user-name', 'user name'])('rejects invalid username %s', (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });

  it.each(['admin', 'administrator', 'zipsin', 'support', 'root'])('rejects reserved username %s', (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });

  it.each(['home1', 'home_manager', 'broker_2026'])('accepts username %s', (value) => {
    expect(usernameSchema.parse(value)).toBe(value);
  });
});
