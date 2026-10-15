import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610140003_auth_recovery_security.sql'), 'utf8');
describe('auth recovery security migration', () => {
  it('serializes sms reservations and recovery verification', () => {
    expect(sql).toContain('reserve_auth_sms_send');
    expect(sql).toContain('pg_advisory_xact_lock');
    expect(sql).toContain('issue_account_recovery_challenge');
    expect(sql).toContain('verify_account_recovery_challenge');
    expect(sql).toContain('for update');
  });
  it('requires phone verification in direct database write policies', () => {
    expect(sql).toContain('account_has_verified_phone');
    expect(sql).toContain('phone_verification_required');
    expect(sql).toContain('phone_already_registered');
  });
  it('creates single-use password recovery sessions', () => {
    expect(sql).toContain('account_recovery_sessions');
    expect(sql).toContain('consume_account_recovery_session');
  });
});
