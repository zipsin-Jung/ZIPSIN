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

  it('TEST-ZH-LIFE-003-G exposes plan states only through existing contract authorization', () => {
    expect(sql).toMatch(/create policy "contract_plan_states_select_authorized"[\s\S]*public\.can_access_contract\(contract_id\)/i);
    expect(sql).toMatch(/revoke all on public\.contract_plan_states from anon, authenticated/i);
    expect(sql).not.toMatch(/grant (insert|update|delete) on public\.contract_plan_states to authenticated/i);
  });
});
