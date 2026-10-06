import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/202610060001_account_usernames.sql'),
  'utf8',
);

describe('account username migration security', () => {
  it('enforces one normalized username at the database boundary', () => {
    expect(sql).toMatch(/username_normalized\s+citext\s+not null\s+unique/i);
    expect(sql).toMatch(/check\s*\(username_normalized\s*~\s*'\^\[a-z0-9_\]\{4,20\}\$'\)/i);
  });

  it('blocks direct table access for anonymous and authenticated clients', () => {
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/revoke all on public\.account_usernames from anon, authenticated/i);
    expect(sql).not.toMatch(/create policy/i);
  });

  it('claims usernames atomically for the authenticated user only', () => {
    expect(sql).toMatch(/function public\.claim_username\(p_username text\)/i);
    expect(sql).toMatch(/auth\.uid\(\)/i);
    expect(sql).toMatch(/on conflict \(username_normalized\) do nothing/i);
    expect(sql).toMatch(/grant execute on function public\.claim_username\(text\) to authenticated/i);
  });
});
