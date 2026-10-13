import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610130006_chat_core.sql'), 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';

describe('secure chat core SQL', () => {
  it('creates private room, membership, message, read, and notification tables', () => {
    for (const table of ['chat_rooms', 'chat_room_memberships', 'chat_messages', 'chat_read_states', 'notifications']) {
      expect(sql).toMatch(new RegExp(`create table public\\.${table}`, 'i'));
      expect(sql).toMatch(new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    }
  });

  it('denies non-members and ended members on every access check', () => {
    const access = fn('can_access_chat_room');
    expect(access).toMatch(/membership\.user_id = auth\.uid\(\)/i);
    expect(access).toMatch(/membership\.status = 'active'/i);
    expect(access).toMatch(/membership\.ended_at is null/i);
    expect(fn('can_send_chat_message')).toContain('can_access_chat_room');
  });

  it('sends only through an atomic RPC with server-derived sender and idempotency', () => {
    const send = fn('send_chat_message');
    expect(send).toMatch(/v_user_id uuid := auth\.uid\(\)/i);
    expect(send).toMatch(/btrim\(p_body\)/i);
    expect(send).toMatch(/char_length[\s\S]*2000/i);
    expect(send).toMatch(/on conflict \(room_id, sender_user_id, idempotency_key\)/i);
    expect(sql).toMatch(/revoke all on public\.chat_messages from/i);
  });

  it('never stores message text or participant personal data in notifications', () => {
    const notificationTable = sql.match(/create table public\.notifications[\s\S]*?\);/i)?.[0] ?? '';
    expect(notificationTable).not.toMatch(/body|email|phone|display_name/i);
    expect(notificationTable).toMatch(/room_id[\s\S]*message_id/i);
  });

  it('prevents read state from moving backwards and validates the room message', () => {
    const read = fn('mark_chat_read');
    expect(read).toMatch(/message\.room_id = p_room_id/i);
    expect(read).toMatch(/greatest\(/i);
    expect(read).toMatch(/last_read_message_id/i);
  });
});
