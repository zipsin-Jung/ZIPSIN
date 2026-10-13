import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610130007_chat_room_types.sql'), 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';

describe('six chat room types', () => {
  it('limits persisted room types to the approved six', () => {
    expect(sql).toMatch(/room_type in \('direct', 'group', 'home_shared', 'office_internal', 'repair_event', 'support'\)/i);
  });

  it('deduplicates direct and relationship default rooms', () => {
    expect(sql).toMatch(/unique[\s\S]*direct_key/i);
    expect(sql).toMatch(/unique[\s\S]*relation_key/i);
    expect(fn('create_direct_room')).toMatch(/least\([\s\S]*greatest\(/i);
  });

  it('checks current office, contract, and repair relationships on room access', () => {
    const access = fn('can_access_chat_room');
    expect(access).toMatch(/room_type = 'office_internal'[\s\S]*office_memberships/i);
    expect(access).toMatch(/room_type = 'home_shared'[\s\S]*contract_id/i);
    expect(access).toMatch(/room_type = 'repair_event'[\s\S]*home_memberships[\s\S]*expires_at/i);
    expect(access).not.toMatch(/office_home_assignments/i);
  });

  it('creates relationship rooms only from exact active relationships', () => {
    const create = fn('create_relationship_room');
    expect(create).toMatch(/contract\.home_id = p_home_id[\s\S]*contract\.status = 'active'/i);
    expect(create).toMatch(/relationship\.home_id = p_home_id[\s\S]*relationship\.status = 'active'/i);
  });

  it('does not admit a different repairer merely because a contract matches', () => {
    const access = fn('can_access_chat_room');
    expect(access).toMatch(/participant\.id = room\.relationship_id[\s\S]*participant\.relationship_role in \('landlord', 'tenant'\)/i);
  });
});
