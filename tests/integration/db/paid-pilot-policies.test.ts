import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const path = 'supabase/migrations/202610130002_paid_pilot_core.sql';
const followup = existsSync(path) ? readFileSync(path, 'utf8') : '';

// Bound statement checks at the terminating semicolon and function checks at their $$ body.
// A later table/function must never satisfy a missing clause in the intended target.
function alterStatement(table: string, constraint: string): string {
  return followup.match(new RegExp(`^alter table public\\.${table} add constraint ${constraint}\\b[^;]*;`, 'im'))?.[0] ?? '';
}

function functionDefinition(name: string): string {
  return followup.match(new RegExp(`^create or replace function public\\.${name}\\([\\s\\S]*?as \\$\\$[\\s\\S]*?\\$\\$;`, 'im'))?.[0] ?? '';
}

function indexStatement(name: string): string {
  return followup.match(new RegExp(`^create unique index ${name}\\b[^;]*;`, 'im'))?.[0] ?? '';
}

// Static migration contract checks only: real Postgres execution belongs to Task 8.
// These catch missing revocations/constraints; they do not claim RLS execution evidence.
describe('paid pilot migration security contract', () => {
  it('revokes direct home, record, and attachment writes granted by the original migration', () => {
    for (const table of ['homes', 'records', 'attachments']) {
      expect(followup).toMatch(new RegExp(`^revoke insert, update, delete on public\\.${table} from anon, authenticated;`, 'im'));
    }
    for (const policy of ['homes_insert_creator', 'homes_update_authorized', 'records_insert_authorized', 'records_update_authorized', 'attachments_insert_authorized']) {
      expect(followup).toContain(`drop policy if exists "${policy}"`);
    }
  });

  it('binds office IDs to the canonical home and contract IDs to their home', () => {
    expect(followup).toMatch(/alter table public\.homes add column office_id uuid/i);
    for (const [table, constraint] of [
      ['office_home_assignments', 'assignments_home_office'],
      ['records', 'records_home_office'],
      ['invitations', 'invitations_home_office'],
    ]) {
      expect(alterStatement(table, constraint)).toMatch(/foreign key \(home_id, office_id\) references public\.homes \(id, office_id\)/i);
    }
    for (const [table, constraint] of [
      ['records', 'records_contract_home'],
      ['home_memberships', 'memberships_contract_home'],
      ['invitations', 'invitations_contract_home'],
    ]) {
      expect(alterStatement(table, constraint)).toMatch(/foreign key \(contract_id, home_id\) references public\.contracts \(id, home_id\)/i);
    }
  });

  it('allows new relationships after termination but only one active relationship per scope', () => {
    for (const [table, index] of [
      ['office_memberships', 'office_memberships_active_unique'],
      ['office_home_assignments', 'office_assignments_active_unique'],
      ['home_memberships', 'home_memberships_active_unique'],
    ]) {
      expect(followup).toContain(`'public.${table}'::regclass`);
      expect(indexStatement(index)).toContain(`on public.${table}`);
      expect(indexStatement(index)).toMatch(/where status = 'active' and ended_at is null/i);
    }
    expect(indexStatement('home_memberships_active_unique')).toMatch(/nulls not distinct/i);
    const constraintDrop = followup.match(/^do \$\$\s*declare old_constraint[\s\S]*?\$\$;/im)?.[0] ?? '';
    expect(constraintDrop).toMatch(/pg_constraint[\s\S]*?contype = 'u'/i);
    expect(constraintDrop).toMatch(/drop constraint %I/i);
  });

  it('prevents restoring an ended contract or moving it into a different home', () => {
    expect(functionDefinition('guard_contract_update')).toMatch(/old\.status in \('ended', 'cancelled'\)[\s\S]*?new\.status is distinct from old\.status/i);
    expect(followup).toMatch(/create trigger contracts_immutable_identity before update on public\.contracts/i);
  });

  it('refuses active assignments for users without active membership in that office', () => {
    expect(functionDefinition('guard_active_assignment')).toMatch(/membership\.user_id = new\.assigned_user_id[\s\S]*?membership\.status = 'active'/i);
    expect(followup).toMatch(/create trigger office_assignments_active_member before insert or update on public\.office_home_assignments/i);
  });

  it('makes terminal relationships irreversible and validates termination timestamps', () => {
    expect(functionDefinition('guard_relationship_update')).toMatch(/old\.status in \('ended', 'revoked'\)[\s\S]*?new\.status is distinct from old\.status/i);
    for (const table of ['office_memberships', 'office_home_assignments', 'home_memberships']) {
      expect(followup).toMatch(new RegExp(`create trigger \\w+ before update on public\\.${table}`, 'i'));
      expect(alterStatement(table, `${table}_lifecycle`)).toMatch(/ended_at is not null/i);
    }
  });

  it('protects record ownership, space, authorship, time, and deduplication identity from update', () => {
    for (const field of ['id', 'home_id', 'office_id', 'contract_id', 'record_space', 'record_kind', 'created_by', 'created_at', 'idempotency_key']) {
      expect(functionDefinition('guard_record_update')).toContain(`new.${field} is distinct from old.${field}`);
    }
    expect(followup).toMatch(/create trigger records_immutable_identity before update on public\.records/i);
  });

  it('validates invitation scope, role, expiry, and mutually exclusive terminal states', () => {
    const scope = alterStatement('invitations', 'invitations_scope');
    const consumption = alterStatement('invitations', 'invitations_consumption');
    expect(scope).toMatch(/invitation_kind = 'office_member'[\s\S]*?home_id is null and contract_id is null/i);
    expect(scope).toMatch(/invitation_kind = 'home_member'[\s\S]*?intended_role in \('landlord', 'tenant'\)/i);
    expect(consumption).toMatch(/accepted_at is null and accepted_by is null/i);
    expect(consumption).toMatch(/accepted_at < expires_at/i);
    expect(consumption).toMatch(/revoked_at is null or accepted_at is null/i);
    expect(followup).toMatch(/create trigger invitations_immutable_identity before update on public\.invitations/i);
  });

  it('requires a live contract and already-started membership when evaluating party access', () => {
    const access = functionDefinition('can_access_contract');
    expect(access).toMatch(/contract\.status = 'active'/i);
    expect(access).toMatch(/membership\.starts_at <= now\(\)/i);
    expect(access).toMatch(/membership\.access_scope = 'current_contract'/i);
    expect(access).toMatch(/membership\.relationship_role in \('landlord', 'tenant'\)/i);
    expect(functionDefinition('can_access_record')).not.toMatch(/record\.record_space = 'shared_history'/i);
  });

  it('offers DB record authorization using current relationships rather than selected primary roles', () => {
    const create = functionDefinition('can_create_record');
    expect(create).toMatch(/p_home_id uuid,[\s\S]*?p_office_id uuid,[\s\S]*?p_contract_id uuid,[\s\S]*?p_record_space text,[\s\S]*?p_record_kind text/i);
    expect(create).toMatch(/office_role = 'assistant'[\s\S]*?p_record_kind in \('photo', 'document', 'schedule', 'task'\)/i);
    expect(followup).toMatch(/revoke all on function public\.can_create_record\(uuid, uuid, uuid, text, text\) from public/i);
    expect(followup).toMatch(/grant execute on function public\.can_create_record\(uuid, uuid, uuid, text, text\) to authenticated/i);
  });

  it.each(['is_active_office_member', 'is_principal_office_member', 'can_perform_office_action'])(
    'replaces %s so future-started memberships grant no office access or action', (name) => {
      const definition = functionDefinition(name);
      expect(definition).toMatch(/from public\.office_memberships\b/i);
      expect(definition).toMatch(/office_id = p_office_id/i);
      expect(definition).toMatch(/user_id = auth\.uid\(\)/i);
      expect(definition).toMatch(/status = 'active'/i);
      expect(definition).toMatch(/ended_at is null/i);
      expect(definition).toMatch(/started_at <= now\(\)/i);
    },
  );
});
