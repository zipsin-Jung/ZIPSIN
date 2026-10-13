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
    expect(sql).toMatch(/grant select, insert, update on public\.account_usernames to service_role/i);
    expect(sql).not.toMatch(/create policy/i);
  });

  it('claims usernames atomically for the authenticated user only', () => {
    expect(sql).toMatch(/function public\.claim_username\(p_username text\)/i);
    expect(sql).toMatch(/auth\.uid\(\)/i);
    expect(sql).toMatch(/on conflict \(username_normalized\) do nothing/i);
    expect(sql).toMatch(/grant execute on function public\.claim_username\(text\) to authenticated/i);
  });

  it('stores only hashed rate-limit keys and exposes consumption to service role only', () => {
    expect(sql).toMatch(/create table public\.auth_rate_limits/i);
    expect(sql).toMatch(/key_hash text not null/i);
    expect(sql).toMatch(/extensions\.digest\(p_key, 'sha256'\)/i);
    expect(sql).toMatch(/function public\.consume_auth_rate_limit\(/i);
    expect(sql).toMatch(/grant execute on function public\.consume_auth_rate_limit\([\s\S]*?\) to service_role/i);
    expect(sql).toMatch(/revoke all on public\.auth_rate_limits from anon, authenticated/i);
  });

  it('keeps failed signup cleanup records private to the service role', () => {
    expect(sql).toMatch(/create table public\.auth_cleanup_queue/i);
    expect(sql).toMatch(/alter table public\.auth_cleanup_queue enable row level security/i);
    expect(sql).toMatch(/revoke all on public\.auth_cleanup_queue from anon, authenticated/i);
    expect(sql).toMatch(/grant select, insert, update on public\.auth_cleanup_queue to service_role/i);
  });
});
