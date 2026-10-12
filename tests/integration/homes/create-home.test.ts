import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createHome } from '@/features/homes/services/create-home';

const input = {
  officeId: '00000000-0000-4000-8000-000000000001', addressLine1: ' 서울시 예시로 10 ',
  addressDetail: ' 101호 ', homeLabel: ' 첫 관리 집 ', idempotencyKey: '00000000-0000-4000-8000-000000000002',
};
describe('createHome service', () => {
  it('TEST-HOME-001 creates only via an atomic repository request with normalized input', async () => {
    const repo = { create: vi.fn().mockResolvedValue({ data: 'home-1', error: null }) };
    expect(await createHome(repo, input)).toEqual({ ok: true, homeId: 'home-1' });
    expect(repo.create).toHaveBeenCalledExactlyOnceWith({ ...input, addressLine1: '서울시 예시로 10', addressDetail: '101호', homeLabel: '첫 관리 집' });
  });
  it.each([{ ...input, addressLine1: '짧음' }, { ...input, officeId: 'another-office' }, { ...input, idempotencyKey: '' }, { ...input, homeLabel: 'x'.repeat(81) }, { ...input, addressDetail: 'x'.repeat(121) }])('TEST-HOME-002 validates before any database call', async (invalid) => {
    const repo = { create: vi.fn() };
    expect(await createHome(repo, invalid)).toEqual({ ok: false, error: 'invalid_input' });
    expect(repo.create).not.toHaveBeenCalled();
  });
  it.each(['permission_denied', 'relation_ended', 'conflict'])('TEST-HOME-003 propagates safe %s for cross-office/ended/replayed requests', async (message) => {
    const repo = { create: vi.fn().mockResolvedValue({ data: null, error: { message, details: 'private address' } }) };
    expect(await createHome(repo, input)).toEqual({ ok: false, error: message });
  });
  it('TEST-HOME-004 hides thrown network/database details and permits a retry with the same key', async () => {
    const repo = { create: vi.fn().mockRejectedValueOnce(new Error('private address')).mockResolvedValueOnce({ data: 'home-1', error: null }) };
    expect(await createHome(repo, input)).toEqual({ ok: false, error: 'server_error' });
    expect(await createHome(repo, input)).toEqual({ ok: true, homeId: 'home-1' });
    expect(repo.create.mock.calls[0][0]).toEqual(repo.create.mock.calls[1][0]);
  });
});

const sql = readFileSync('supabase/migrations/202610130002_paid_pilot_core.sql', 'utf8');
const rpc = sql.match(/create or replace function public\.create_home_for_office\([\s\S]*?\n\$\$;/i)?.[0] ?? '';
describe('create_home_for_office SQL static contract (not runtime DB verification)', () => {
  it('TEST-HOME-005 authenticates and locks an active principal membership before mutation', () => {
    expect(rpc).toContain('auth.uid()');
    expect(rpc).toContain("raise exception 'authentication_required'");
    expect(rpc).toMatch(/membership\.office_id = p_office_id/);
    expect(rpc).toMatch(/membership\.user_id = v_user_id/);
    expect(rpc).toMatch(/membership\.office_role = 'principal_broker'/);
    expect(rpc).toMatch(/membership\.status = 'active'[\s\S]*membership\.ended_at is null[\s\S]*membership\.started_at <= now\(\)[\s\S]*for share/);
  });
  it('TEST-HOME-006 creates office-bound home, creator assignment and audit in one transaction', () => {
    expect(rpc).toMatch(/insert into public\.homes \(office_id, address_line1, address_detail, home_label, address_fingerprint, created_by, idempotency_key\)/);
    expect(rpc).toMatch(/values \(p_office_id,/);
    expect(rpc).toMatch(/insert into public\.office_home_assignments[\s\S]*values \(p_office_id, v_home_id, v_user_id, v_user_id\)/);
    expect(rpc).toContain('insert into public.access_audit_events');
    expect(rpc).not.toMatch(/exception\s+when|commit;/i);
  });
  it('TEST-HOME-007 serializes the same key and returns only an identical authorized prior request', () => {
    expect(sql).toMatch(/create unique index homes_creator_idempotency_unique on public\.homes \(created_by, idempotency_key\)/);
    expect(rpc).toContain('pg_advisory_xact_lock');
    expect(rpc).toMatch(/created_by = v_user_id and idempotency_key = p_idempotency_key/);
    expect(rpc).toMatch(/v_existing\.office_id is distinct from p_office_id/);
    expect(rpc).toContain("raise exception 'conflict'");
    expect(rpc).toContain('return v_existing.id');
  });
  it('TEST-HOME-008 has no address lookup or merge, and restricts execution', () => {
    expect(rpc).not.toMatch(/where[^;]*address_fingerprint|on conflict|update public\.homes|delete from public\.homes/i);
    expect(sql).toContain('revoke all on function public.create_home_for_office(uuid, text, text, text, uuid) from public, anon, authenticated');
    expect(sql).toContain('grant execute on function public.create_home_for_office(uuid, text, text, text, uuid) to authenticated');
  });
});
