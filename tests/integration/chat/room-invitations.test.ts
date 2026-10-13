import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610130007_chat_room_types.sql'), 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';

describe('chat room invitations and leaving', () => {
  it('does not expose user search and permits direct chat only through an existing relationship', () => {
    expect(sql).not.toMatch(/search_users|find_users|list_users/i);
    expect(fn('create_direct_room')).toContain('can_chat_with_user');
    expect(fn('can_chat_with_user')).toMatch(/office_memberships|home_memberships/i);
  });

  it('validates every group invite against a known relationship', () => {
    const create = fn('create_group_room');
    expect(create).toMatch(/cardinality\(p_member_ids\)/i);
    expect(create).toContain('can_chat_with_user');
    expect(fn('invite_chat_member')).toContain('can_chat_with_user');
  });

  it('allows only an active owner to invite and never changes existing history', () => {
    const invite = fn('invite_chat_member');
    expect(invite).toMatch(/membership_role = 'owner'/i);
    expect(invite).toMatch(/status = 'active'/i);
    expect(invite).toMatch(/insert into public\.chat_room_memberships/i);
    expect(invite).not.toMatch(/update public\.chat_room_memberships[\s\S]*status = 'active'/i);
  });

  it('leaves by ending only the current membership', () => {
    const leave = fn('leave_chat_room');
    expect(leave).toMatch(/user_id = v_user_id/i);
    expect(leave).toMatch(/status = 'ended'[\s\S]*ended_at = now\(\)/i);
    expect(leave).not.toMatch(/delete from/i);
  });
});
