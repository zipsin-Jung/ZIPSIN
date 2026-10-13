import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync('supabase/migrations/202610130011_contract_lifecycle_home.sql', 'utf8');

describe('usage purpose migration boundary', () => {
  it('stores purpose separately and saves valid purpose-role combinations atomically', () => {
    expect(migration).toMatch(/add column usage_purpose text/i);
    expect(migration).toMatch(/create or replace function public\.complete_usage_onboarding/i);
    expect(migration).toMatch(/management_other[\s\S]*p_primary_role is not null[\s\S]*invalid_role_combination/i);
    expect(migration).toMatch(/broker[\s\S]*principal_broker[\s\S]*associate_broker[\s\S]*assistant/i);
  });

  it('never uses usage purpose in home, contract, record, or chat authorization policies', () => {
    const policies = [...migration.matchAll(/create policy[\s\S]*?;/gi)].map((match) => match[0]).join('\n');
    expect(policies).not.toMatch(/usage_purpose/i);
  });
});
