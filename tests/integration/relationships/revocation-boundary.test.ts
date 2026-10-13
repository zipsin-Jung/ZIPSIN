import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationDirectory = join(process.cwd(), 'supabase/migrations');
const migrations = readdirSync(migrationDirectory).sort().map((name) => readFileSync(join(migrationDirectory, name), 'utf8')).join('\n');

function latestFunction(name: string) {
  const matches = [...migrations.matchAll(new RegExp(`create or replace function public\\.${name}\\([^]*?\\$\\$;`, 'gi'))];
  return matches.at(-1)?.[0] ?? '';
}

describe('relationship revocation boundaries', () => {
  it('TEST-RC-ACL-001 denies a guessed home or record ID without a current relationship', () => {
    const home = latestFunction('can_access_office_home');
    const record = latestFunction('can_access_record');
    expect(home).toMatch(/home\.id = p_home_id[\s\S]*membership\.user_id = auth\.uid\(\)/i);
    expect(home).toMatch(/membership\.status = 'active'[\s\S]*membership\.ended_at is null/i);
    expect(record).toMatch(/public\.can_access_office_home\(record\.home_id\)|public\.can_access_contract\(record\.contract_id\)/i);
  });

  it('TEST-RC-ACL-002 isolates previous-contract records and personal data', () => {
    const contract = latestFunction('can_access_contract');
    const record = latestFunction('can_access_record');
    expect(contract).toMatch(/contract\.status = 'active'/i);
    expect(contract).toMatch(/membership\.contract_id = contract\.id/i);
    expect(contract).toMatch(/membership\.access_scope = 'current_contract'/i);
    expect(record).toMatch(/record\.record_space = 'current_contract'[\s\S]*record\.contract_id is not null[\s\S]*can_access_contract/i);
    expect(record).not.toMatch(/record_space = 'shared_history'/i);
  });

  it('TEST-RC-ACL-003 denies departed staff while retained office records remain stored', () => {
    const office = latestFunction('can_access_office_home');
    expect(office).toMatch(/membership\.status = 'active'/i);
    expect(office).toMatch(/membership\.ended_at is null/i);
    expect(migrations).not.toMatch(/delete from public\.records/i);
  });

  it('TEST-RC-ACL-004 revalidates current relationships for open direct, group, home, office, and repair chats', () => {
    const access = latestFunction('can_access_chat_room');
    expect(access).toMatch(/room\.room_type = 'direct'[\s\S]*public\.has_current_chat_peer/i);
    expect(access).toMatch(/room\.room_type = 'group'[\s\S]*public\.has_current_chat_peer/i);
    expect(latestFunction('has_current_chat_peer')).toMatch(/public\.can_chat_with_user\(peer\.user_id\)/i);
    expect(access).toMatch(/room\.room_type = 'office_internal'[\s\S]*office_memberships/i);
    expect(access).toMatch(/room\.room_type = 'home_shared'[\s\S]*contract\.status = 'active'[\s\S]*home_memberships/i);
    expect(access).toMatch(/room\.room_type = 'repair_event'[\s\S]*relationship\.status = 'active'[\s\S]*relationship\.ended_at is null/i);
  });

  it('TEST-RC-INV-001 rejects expired, reused, revoked, and mixed-scope invitations', () => {
    const office = latestFunction('accept_office_invitation');
    const relationship = latestFunction('accept_relationship_invitation');
    for (const body of [office, relationship]) {
      expect(body).toMatch(/revoked_at is not null/i);
      expect(body).toMatch(/accepted_at is not null/i);
      expect(body).toMatch(/expires_at <= now\(\)/i);
      expect(body).toMatch(/for update/i);
    }
    expect(office).toMatch(/invitation_kind = 'office_member'/i);
    expect(relationship).toMatch(/invitation_kind in \('home_member', 'repair_event'\)/i);
  });
});
