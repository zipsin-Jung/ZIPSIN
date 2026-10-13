import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync('supabase/migrations/202610130011_contract_lifecycle_home.sql', 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';

describe('contract lifecycle database boundary', () => {
  it('TEST-ZH-LIFE-003-E allows only active principal or associate members to save contract dates', () => {
    const body = fn('upsert_active_contract_for_home');
    expect(body).toMatch(/office_role in \('principal_broker', 'associate_broker'\)/i);
    expect(body).toMatch(/status = 'active'/i);
    expect(body).toMatch(/ended_at is null/i);
    expect(body).not.toMatch(/office_role in \([^)]*assistant/i);
    expect(body).toMatch(/insert into public\.access_audit_events/i);
  });

  it('TEST-ZH-LIFE-003-F binds plan writes to the current user and active landlord or tenant relationship', () => {
    const body = fn('set_own_contract_plan');
    expect(body).toMatch(/membership\.user_id = auth\.uid\(\)/i);
    expect(body).toMatch(/relationship_role in \('landlord', 'tenant'\)/i);
    expect(body).toMatch(/membership\.status = 'active'/i);
    expect(body).toMatch(/contract\.status = 'active'/i);
    expect(body).toMatch(/insert into public\.contract_plan_events/i);
  });

  it('TEST-ZH-LIFE-003-G keeps raw plan and audit identifiers server-only', () => {
    expect(sql).toMatch(/revoke all on public\.contract_plan_states from anon, authenticated/i);
    expect(sql).toMatch(/revoke all on public\.contract_plan_events from anon, authenticated/i);
    expect(sql).not.toMatch(/grant (select|insert|update|delete) on public\.contract_plan_states to authenticated/i);
    expect(sql).not.toMatch(/grant (select|insert|update|delete) on public\.contract_plan_events to authenticated/i);
  });

  it('TEST-ZH-LIFE-003-M returns party roles and statuses without exposing user identifiers', () => {
    const body = fn('get_contract_party_plan_statuses');
    expect(body).toMatch(/public\.can_access_contract\(p_contract_id\)/i);
    expect(body).toMatch(/relationship_role/i);
    expect(body).toMatch(/plan_status/i);
    expect(body).toMatch(/is_current_user/i);
    expect(body).not.toMatch(/returns table\s*\([^)]*user_id/i);
  });

  it('TEST-ZH-LIFE-003-N serializes identical plan changes before reading the previous state', () => {
    const body = fn('set_own_contract_plan');
    expect(body).toMatch(/pg_advisory_xact_lock[\s\S]*select state\.plan_status/i);
  });
});
