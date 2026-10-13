import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/202610130005_relationship_invitations.sql'),
  'utf8',
);
const fn = (name: string) => sql.match(
  new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'),
)?.[0] ?? '';

describe('relationship invitation SQL boundaries', () => {
  it('stores only a digest and verifies the exact active home and contract', () => {
    const body = fn('create_relationship_invitation');
    expect(body).toContain("digest(p_token, 'sha256')");
    expect(body).toMatch(/contract\.id = p_contract_id[\s\S]*contract\.home_id = p_home_id[\s\S]*contract\.status = 'active'/i);
    expect(body).toMatch(/p_role in \('landlord', 'tenant'\)[\s\S]*p_scope = 'current_contract'/i);
    expect(body).toMatch(/p_role = 'repairer'[\s\S]*p_scope = 'repair_event'/i);
  });

  it('locks and consumes one invitation only once', () => {
    const body = fn('accept_relationship_invitation');
    expect(body).toMatch(/for update/i);
    expect(body).toMatch(/revoked_at is not null[\s\S]*invitation_revoked/i);
    expect(body).toMatch(/accepted_at is not null[\s\S]*invitation_used/i);
    expect(body).toMatch(/expires_at <= now\(\)[\s\S]*invitation_expired/i);
    expect(body).toContain('insert into public.home_memberships');
    expect(body).toMatch(/update public\.invitations set accepted_at = now\(\), accepted_by = v_user_id/i);
  });

  it('prevents previous contracts and expired repair access', () => {
    const body = fn('accept_relationship_invitation');
    expect(body).toMatch(/contract\.status = 'active'/i);
    expect(body).toMatch(/relationship_expires_at <= now\(\)/i);
    expect(body).toMatch(/expires_at[\s\S]*relationship_expires_at/i);
  });

  it('ends an active relationship and writes an audit event atomically', () => {
    const body = fn('end_home_relationship');
    expect(body).toMatch(/for update/i);
    expect(body).toMatch(/update public\.home_memberships[\s\S]*status = 'ended'[\s\S]*ended_at = now\(\)/i);
    expect(body).toMatch(/insert into public\.access_audit_events/i);
  });

  it('provides a privacy-safe invitation preview', () => {
    const body = fn('preview_relationship_invitation');
    expect(body).toMatch(/jsonb_build_object/i);
    expect(body).not.toMatch(/address_line1|address_detail|phone|email/i);
  });
});
