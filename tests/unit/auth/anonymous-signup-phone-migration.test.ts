import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = join(process.cwd(), 'supabase/migrations/202610140004_anonymous_signup_phone.sql');
const sql = existsSync(migrationPath) ? readFileSync(migrationPath, 'utf8') : '';

describe('anonymous signup phone migration', () => {
  it('keeps anonymous challenges behind a service-role-only RLS boundary', () => {
    expect(sql).toContain('create table public.anonymous_signup_phone_challenges');
    expect(sql).toContain('alter table public.anonymous_signup_phone_challenges enable row level security');
    expect(sql).toContain('revoke all on public.anonymous_signup_phone_challenges from public, anon, authenticated');
    expect(sql).toContain('grant select, insert, update, delete on public.anonymous_signup_phone_challenges to service_role');
  });

  it('issues, verifies, claims, releases, and consumes one challenge', () => {
    expect(sql).toContain('function public.issue_anonymous_signup_phone_challenge');
    expect(sql).toContain('function public.verify_anonymous_signup_phone_challenge');
    expect(sql).toContain('function public.claim_anonymous_signup_phone_challenge');
    expect(sql).toContain('function public.release_anonymous_signup_phone_claim');
    expect(sql).toContain('function public.finalize_verified_password_signup');
    expect(sql).toContain('attempts >= 5');
    expect(sql).toContain('expires_at > now()');
    expect(sql).toContain('consumed_at is null');
    expect(sql).toContain('for update');
    expect(sql).toContain('pg_advisory_xact_lock');
  });

  it('finalizes username, profile, consents, attribution, and proof together', () => {
    expect(sql).toContain('insert into public.account_usernames');
    expect(sql).toContain("status = 'active'");
    expect(sql).toContain('insert into public.profiles');
    expect(sql).toContain("'terms'");
    expect(sql).toContain("'privacy'");
    expect(sql).not.toContain("'age_over_14'");
    expect(sql).toContain('insert into public.signup_attributions');
    expect(sql).toContain('set consumed_at = now()');
  });

  it('only grants challenge RPC execution to service_role', () => {
    expect(sql).toMatch(/revoke all on function public\.issue_anonymous_signup_phone_challenge[\s\S]*from public, anon, authenticated/);
    expect(sql).toMatch(/grant execute on function public\.issue_anonymous_signup_phone_challenge[\s\S]*to service_role/);
    expect(sql).toMatch(/revoke all on function public\.finalize_verified_password_signup[\s\S]*from public, anon, authenticated/);
    expect(sql).toMatch(/grant execute on function public\.finalize_verified_password_signup[\s\S]*to service_role/);
  });
});
