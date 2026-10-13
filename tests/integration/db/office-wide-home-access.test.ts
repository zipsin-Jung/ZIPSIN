import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/202610130004_office_wide_home_access.sql'),
  'utf8',
);

function functionBody(name: string) {
  const match = migration.match(new RegExp(
    `create or replace function public\\.${name}\\([^]*?\\$\\$;`,
    'i',
  ));
  expect(match, `${name} must exist`).not.toBeNull();
  return match?.[0] ?? '';
}

describe('office-wide home access migration', () => {
  it('lets every active office role use an active home in its own office without assignment', () => {
    const access = functionBody('can_access_office_home');
    expect(access).toMatch(/join public\.office_memberships membership[\s\S]*membership\.office_id = home\.office_id/i);
    expect(access).toMatch(/membership\.user_id = auth\.uid\(\)/i);
    expect(access).toMatch(/membership\.office_role in \('principal_broker', 'associate_broker', 'assistant'\)/i);
    expect(access).toMatch(/membership\.status = 'active'/i);
    expect(access).toMatch(/membership\.ended_at is null/i);
    expect(access).toMatch(/membership\.started_at <= now\(\)/i);
    expect(access).not.toMatch(/office_home_assignments|assigned_user_id/i);
  });

  it('keeps write access scoped to the same active office membership', () => {
    const write = functionBody('can_write_office_home');
    expect(write).toMatch(/public\.can_access_office_home\(p_home_id\)/i);
    expect(write).not.toMatch(/office_home_assignments|assigned_user_id/i);
  });

  it('keeps external people inside an active current contract', () => {
    const contract = functionBody('can_access_contract');
    expect(contract).toMatch(/contract\.status = 'active'/i);
    expect(contract).toMatch(/membership\.contract_id = contract\.id/i);
    expect(contract).toMatch(/membership\.home_id = contract\.home_id/i);
    expect(contract).toMatch(/membership\.user_id = auth\.uid\(\)/i);
    expect(contract).toMatch(/membership\.status = 'active'/i);
    expect(contract).toMatch(/membership\.access_scope = 'current_contract'/i);
    expect(contract).toMatch(/membership\.relationship_role in \('landlord', 'tenant'\)/i);
  });

  it('makes the compatibility helper and record writes independent of historical assignments', () => {
    expect(functionBody('has_active_office_home_access')).toMatch(/public\.can_access_office_home\(p_home_id\)/i);
    expect(functionBody('can_create_record')).not.toMatch(/office_home_assignments|assigned_user_id/i);
    expect(functionBody('create_home_record')).not.toMatch(/office_home_assignments|assigned_user_id/i);
  });

  it('keeps assignment rows as history but removes their executable API from the official flow', () => {
    expect(migration).toMatch(/office_home_assignments[\s\S]*historical/i);
    expect(migration).toMatch(/revoke all on function public\.assign_office_member_to_home/i);
    expect(migration).toMatch(/revoke all on function public\.end_office_home_assignment/i);
    expect(migration).not.toMatch(/drop table[^;]*office_home_assignments/i);
  });
});
