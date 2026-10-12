import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/202610130001_office_home_records.sql'),
  'utf8',
);

describe('office and home access migration', () => {
  it('separates offices, staff assignments, homes, contracts, records, and attachments', () => {
    for (const table of [
      'offices',
      'office_memberships',
      'homes',
      'office_home_assignments',
      'contracts',
      'home_memberships',
      'invitations',
      'records',
      'attachments',
      'access_audit_events',
    ]) {
      expect(migration).toMatch(new RegExp(`create table public\\.${table}\\b`, 'i'));
      expect(migration).toMatch(new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    }
  });

  it('does not make an address or guessed home id sufficient for access', () => {
    expect(migration).toMatch(/function public\.has_active_home_access\(p_home_id uuid\)/i);
    expect(migration).toMatch(/office_home_assignments[\s\S]*assigned_user_id = auth\.uid\(\)/i);
    expect(migration).toMatch(/home_memberships[\s\S]*user_id = auth\.uid\(\)/i);
    expect(migration).toMatch(/create policy "homes_select_authorized"[\s\S]*has_active_home_access\(id\)/i);
    expect(migration).not.toMatch(/using\s*\([^)]*address/i);
  });

  it('denies ended staff and home relationships', () => {
    expect(migration).toMatch(/office_memberships[\s\S]*status = 'active'/i);
    expect(migration).toMatch(/office_home_assignments[\s\S]*status = 'active'/i);
    expect(migration).toMatch(/home_memberships[\s\S]*status = 'active'/i);
    expect(migration).toMatch(/ended_at is null/i);
  });

  it('keeps office internal records separate from contract and shared history records', () => {
    expect(migration).toMatch(/record_space text not null check \(record_space in \(\s*'office_internal',\s*'current_contract',\s*'shared_history'\s*\)\)/i);
    expect(migration).toMatch(/function public\.can_access_record\(p_record_id uuid\)/i);
    expect(migration).toMatch(/record_space = 'office_internal'[\s\S]*is_active_office_member/i);
    expect(migration).toMatch(/record_space = 'current_contract'[\s\S]*contract_id/i);
    expect(migration).toMatch(/record_space = 'shared_history'[\s\S]*has_active_home_access/i);
  });

  it('stores only hashed, expiring, revocable, single-use invitations', () => {
    expect(migration).toMatch(/token_hash text not null unique/i);
    expect(migration).not.toMatch(/token_raw|invitation_token text/i);
    expect(migration).toMatch(/expires_at timestamptz not null/i);
    expect(migration).toMatch(/revoked_at timestamptz/i);
    expect(migration).toMatch(/accepted_at timestamptz/i);
    expect(migration).toMatch(/accepted_by uuid/i);
  });

  it('prevents assistants from being assigned broker-only authority', () => {
    expect(migration).toMatch(/office_role text not null check \(office_role in \(\s*'principal_broker',\s*'associate_broker',\s*'assistant'\s*\)\)/i);
    expect(migration).toMatch(/function public\.can_perform_office_action\(\s*p_office_id uuid,\s*p_action text\s*\)/i);
    expect(migration).toMatch(/p_action in \('explain_property', 'negotiate_terms', 'approve_contract'\)[\s\S]*office_role in \('principal_broker', 'associate_broker'\)/i);
  });

  it('keeps each contract private from occupants of other contracts at the same address', () => {
    expect(migration).toMatch(/function public\.can_access_contract\(p_contract_id uuid\)/i);
    expect(migration).toMatch(/home_memberships[\s\S]*contract_id = p_contract_id[\s\S]*user_id = auth\.uid\(\)/i);
    expect(migration).toMatch(/create policy "contracts_select_authorized"[\s\S]*can_access_contract\(id\)/i);
    expect(migration).toMatch(/record\.record_space = 'current_contract'[\s\S]*can_access_contract\(record\.contract_id\)/i);
    expect(migration).not.toMatch(/contracts_select_authorized"[\s\S]{0,160}has_active_home_access\(home_id\)/i);
  });

  it('does not expose every home member to another home member', () => {
    expect(migration).toMatch(/create policy "home_memberships_select_related"[\s\S]*user_id = auth\.uid\(\)[\s\S]*has_active_office_home_access\(home_id\)/i);
    expect(migration).not.toMatch(/home_memberships_select_related"[\s\S]{0,180}has_active_home_access\(home_id\)/i);
  });

  it('allows authenticated access only through RLS and keeps audit events server-only', () => {
    expect(migration).toMatch(/grant select, insert, update on public\.homes to authenticated/i);
    expect(migration).toMatch(/grant select, insert, update on public\.records to authenticated/i);
    expect(migration).not.toMatch(/grant delete on public\.(homes|records|attachments) to authenticated/i);
    expect(migration).toMatch(/revoke all on public\.access_audit_events from anon, authenticated/i);
    expect(migration).toMatch(/grant select, insert on public\.access_audit_events to service_role/i);
  });

  it('creates an office and its principal membership atomically for a principal broker', () => {
    expect(migration).toMatch(/function public\.create_office\(p_name text\)/i);
    expect(migration).toMatch(/primary_role = 'principal_broker'/i);
    expect(migration).toMatch(/insert into public\.offices[\s\S]*insert into public\.office_memberships/i);
    expect(migration).toMatch(/office_role[\s\S]*'principal_broker'/i);
  });
});
