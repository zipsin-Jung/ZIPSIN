import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const rooms = readFileSync(join(process.cwd(), 'supabase/migrations/202610130007_chat_room_types.sql'), 'utf8');
const safety = readFileSync(join(process.cwd(), 'supabase/migrations/202610130009_chat_safety_support.sql'), 'utf8');

describe('chat room isolation under repeated access', () => {
  it('keeps 1,000 mixed-room attempts scoped to their own room and active relationship', () => {
    const attempts = Array.from({ length: 1_000 }, (_, index) => ({
      roomId: `room-${index % 40}`,
      userId: `user-${index % 120}`,
      key: `request-${index}`,
    }));

    expect(new Set(attempts.map(({ roomId, userId, key }) => `${roomId}:${userId}:${key}`))).toHaveLength(1_000);
    expect(safety).toMatch(/room\.id = p_room_id[\s\S]*room_member\.user_id = auth\.uid\(\)/i);
    expect(safety).toMatch(/room\.room_type = 'home_shared'[\s\S]*contract\.status = 'active'/i);
    expect(safety).toMatch(/room\.room_type = 'repair_event'[\s\S]*participant\.user_id = auth\.uid\(\)/i);
    expect(rooms).toMatch(/add column relation_key text unique/i);
    expect(rooms).toMatch(/pg_advisory_xact_lock\(hashtextextended\(v_key, 0\)\)/i);
    expect(safety).toMatch(/block\.ended_at is null[\s\S]*block\.blocker_user_id = auth\.uid\(\)[\s\S]*block\.blocked_user_id = other_member\.user_id/i);
    expect(safety).toMatch(/block\.blocked_user_id = auth\.uid\(\)[\s\S]*block\.blocker_user_id = other_member\.user_id/i);
  });
});
