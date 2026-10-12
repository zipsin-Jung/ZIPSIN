import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const path = 'supabase/migrations/202610130002_paid_pilot_core.sql';
const sql = readFileSync('supabase/migrations/202610130001_office_home_records.sql', 'utf8')
  + (existsSync(path) ? readFileSync(path, 'utf8') : '');
const followup = existsSync(path) ? readFileSync(path, 'utf8') : '';

// Static migration contract checks only: real Postgres execution belongs to Task 8.
// These catch missing revocations/constraints; they do not claim RLS execution evidence.
describe('paid pilot migration security contract', () => {
  it('revokes direct home, record, and attachment writes granted by the original migration', () => {
    for (const table of ['homes', 'records', 'attachments']) {
      expect(sql).toMatch(new RegExp(`revoke insert, update, delete on public\\.${table} from anon, authenticated`, 'i'));
    }
    for (const policy of ['homes_insert_creator', 'homes_update_authorized', 'records_insert_authorized', 'records_update_authorized', 'attachments_insert_authorized']) {
      expect(followup).toContain(`drop policy if exists "${policy}"`);
    }
  });

  it('binds office IDs to the canonical home and contract IDs to their home', () => {
    expect(followup).toMatch(/alter table public\.homes add column office_id uuid/i);
    for (const table of ['office_home_assignments', 'records', 'invitations']) {
      expect(followup).toMatch(new RegExp(`alter table public\\.${table}[\\s\\S]*?foreign key \\(home_id, office_id\\) references public\\.homes \\(id, office_id\\)`, 'i'));
    }
    for (const table of ['records', 'home_memberships', 'invitations']) {
      expect(followup).toMatch(new RegExp(`alter table public\\.${table}[\\s\\S]*?foreign key \\(contract_id, home_id\\) references public\\.contracts \\(id, home_id\\)`, 'i'));
    }
  });

  it('allows new relationships after termination but only one active relationship per scope', () => {
    for (const table of ['office_memberships', 'office_home_assignments', 'home_memberships']) {
      expect(followup).toContain(`'public.${table}'::regclass`);
      expect(followup).toMatch(new RegExp(`create unique index \\w+ on public\\.${table}[\\s\\S]*?where status = 'active' and ended_at is null`, 'i'));
    }
    expect(followup).toMatch(/nulls not distinct/i);
    expect(followup).toMatch(/pg_constraint[\s\S]*?contype = 'u'/i);
    expect(followup).toMatch(/drop constraint %I/i);
  });

  it('prevents restoring an ended contract or moving it into a different home', () => {
    expect(followup).toMatch(/old\.status in \('ended', 'cancelled'\)[\s\S]*?new\.status is distinct from old\.status/i);
    expect(followup).toMatch(/create trigger contracts_immutable_identity before update on public\.contracts/i);
  });

  it('refuses active assignments for users without active membership in that office', () => {
    expect(followup).toMatch(/function public\.guard_active_assignment\(\)[\s\S]*?membership\.user_id = new\.assigned_user_id[\s\S]*?membership\.status = 'active'/i);
    expect(followup).toMatch(/create trigger office_assignments_active_member before insert or update on public\.office_home_assignments/i);
  });

  it('makes terminal relationships irreversible and validates termination timestamps', () => {
    expect(followup).toMatch(/old\.status in \('ended', 'revoked'\)[\s\S]*?new\.status is distinct from old\.status/i);
    for (const table of ['office_memberships', 'office_home_assignments', 'home_memberships']) {
      expect(followup).toMatch(new RegExp(`create trigger \\w+ before update on public\\.${table}`, 'i'));
      expect(followup).toMatch(new RegExp(`${table}_lifecycle[\\s\\S]*?ended_at is not null`, 'i'));
    }
  });

  it('protects record ownership, space, authorship, time, and deduplication identity from update', () => {
    for (const field of ['id', 'home_id', 'office_id', 'contract_id', 'record_space', 'record_kind', 'created_by', 'created_at', 'idempotency_key']) {
      expect(followup).toContain(`new.${field} is distinct from old.${field}`);
    }
    expect(followup).toMatch(/create trigger records_immutable_identity before update on public\.records/i);
  });

  it('validates invitation scope, role, expiry, and mutually exclusive terminal states', () => {
    expect(followup).toMatch(/invitations_scope[\s\S]*?invitation_kind = 'office_member'[\s\S]*?home_id is null and contract_id is null/i);
    expect(followup).toMatch(/invitation_kind = 'home_member'[\s\S]*?intended_role in \('landlord', 'tenant'\)/i);
    expect(followup).toMatch(/accepted_at is null and accepted_by is null/i);
    expect(followup).toMatch(/accepted_at < expires_at/i);
    expect(followup).toMatch(/revoked_at is null or accepted_at is null/i);
    expect(followup).toMatch(/create trigger invitations_immutable_identity before update on public\.invitations/i);
  });

  it('requires a live contract and already-started membership when evaluating party access', () => {
    const access = followup.slice(followup.indexOf('function public.can_access_contract('));
    expect(access).toMatch(/contract\.status = 'active'/i);
    expect(access).toMatch(/membership\.starts_at <= now\(\)/i);
    expect(access).toMatch(/membership\.access_scope = 'current_contract'/i);
    expect(access).toMatch(/membership\.relationship_role in \('landlord', 'tenant'\)/i);
    expect(access).not.toMatch(/record\.record_space = 'shared_history'/i);
  });

  it('offers DB record authorization using current relationships rather than selected primary roles', () => {
    expect(followup).toMatch(/function public\.can_create_record\([\s\S]*?p_home_id uuid,[\s\S]*?p_office_id uuid,[\s\S]*?p_contract_id uuid,[\s\S]*?p_record_space text,[\s\S]*?p_record_kind text/i);
    expect(followup).toMatch(/office_role = 'assistant'[\s\S]*?p_record_kind in \('photo', 'document', 'schedule', 'task'\)/i);
    expect(followup).toMatch(/revoke all on function public\.can_create_record\(uuid, uuid, uuid, text, text\) from public/i);
    expect(followup).toMatch(/grant execute on function public\.can_create_record\(uuid, uuid, uuid, text, text\) to authenticated/i);
  });
});
