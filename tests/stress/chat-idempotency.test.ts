import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610130006_chat_core.sql'), 'utf8');

describe('chat send retry safety', () => {
  it('has one database identity for twenty retries with the same key', () => {
    const attempts = Array.from({ length: 20 }, () => ({ roomId: 'room-1', senderId: 'user-1', key: 'same-key' }));
    expect(new Set(attempts.map((attempt) => `${attempt.roomId}:${attempt.senderId}:${attempt.key}`))).toHaveLength(1);
    expect(sql).toMatch(/unique \(room_id, sender_user_id, idempotency_key\)/i);
    expect(sql).toMatch(/on conflict \(room_id, sender_user_id, idempotency_key\)/i);
  });
});
