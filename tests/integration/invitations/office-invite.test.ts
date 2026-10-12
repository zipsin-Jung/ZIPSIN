import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610130002_paid_pilot_core.sql'), 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';

describe('office invitation and assignment SQL boundaries', () => {
  it('TEST-MEMBER-001 stores only a digest and requires an active principal', () => {
    const body = fn('create_office_invitation');
    expect(body).toContain("digest(p_token, 'sha256')");
    expect(body).toMatch(/office_role = 'principal_broker'[\s\S]*status = 'active'[\s\S]*started_at <= now\(\)/);
    expect(body).toMatch(/p_role not in \('associate_broker', 'assistant'\)/);
  });
  it('TEST-MEMBER-002 accepts an unexpired unused token once and creates one membership', () => {
    const body = fn('accept_office_invitation');
    expect(body).toMatch(/for update/);
    expect(body).toMatch(/expires_at <= now\(\)/);
    expect(body).toMatch(/revoked_at is not null/);
    expect(body).toMatch(/accepted_at is not null/);
    expect(body).toContain('insert into public.office_memberships');
  });
  it('TEST-MEMBER-003 revokes only an active invitation by its principal', () => {
    const body = fn('revoke_office_invitation');
    expect(body).toMatch(/is_principal_office_member/);
    expect(body).toMatch(/accepted_at is not null[\s\S]*invitation_used/);
    expect(body).toMatch(/revoked_at is not null[\s\S]*invitation_revoked/);
  });
  it('TEST-ASSIGN-001 assigns only an active member to a home in the same office', () => {
    const body = fn('assign_office_member_to_home');
    expect(body).toMatch(/home\.office_id = p_office_id/);
    expect(body).toMatch(/membership\.office_id = p_office_id/);
    expect(body).toContain('insert into public.office_home_assignments');
  });
});
