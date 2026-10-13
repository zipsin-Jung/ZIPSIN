import { describe, expect, it } from 'vitest';
import { chatMessageSchema, chatReadSchema } from '@/features/chat/schemas/message';
import { getRecentMessages, mergeMessagePages } from '@/features/chat/services/message';

const roomId = '00000000-0000-4000-8000-000000000001';

describe('chat message input', () => {
  it('trims a message and accepts a client idempotency key', () => {
    const result = chatMessageSchema.safeParse({ roomId, body: '  확인했습니다.  ', idempotencyKey: '00000000-0000-4000-8000-000000000002' });
    expect(result.success && result.data.body).toBe('확인했습니다.');
  });

  it.each(['', '   ', '가'.repeat(2001)])('rejects empty or oversized body', (body) => {
    expect(chatMessageSchema.safeParse({ roomId, body, idempotencyKey: '00000000-0000-4000-8000-000000000002' }).success).toBe(false);
  });

  it('requires a positive read message id', () => {
    expect(chatReadSchema.safeParse({ roomId, lastReadMessageId: 10 }).success).toBe(true);
    expect(chatReadSchema.safeParse({ roomId, lastReadMessageId: 0 }).success).toBe(false);
  });

  it('merges paginated and realtime messages without duplicates in order', () => {
    expect(mergeMessagePages([{ id: 3 }, { id: 2 }], [{ id: 4 }, { id: 3 }, { id: 1 }]).map(({ id }) => id)).toEqual([4, 3, 2, 1]);
  });

  it('loads the next message page before the supplied cursor', async () => {
    const calls: Array<[string, unknown]> = [];
    const page = [{ id: 9, room_id: roomId, sender_user_id: roomId, body: '이전 메시지', created_at: '2026-10-13T00:00:00Z' }];
    const query = {
      select() { return this; },
      eq(column: string, value: unknown) { calls.push([column, value]); return this; },
      order() { return this; },
      limit(value: number) { calls.push(['limit', value]); return this; },
      lt(column: string, value: unknown) { calls.push([column, value]); return this; },
      then(resolve: (value: { data: typeof page; error: null }) => unknown) { return Promise.resolve(resolve({ data: page, error: null })); },
    };
    const supabase = { from: () => query } as never;
    await expect(getRecentMessages(supabase, roomId, 10)).resolves.toEqual(page);
    expect(calls).toContainEqual(['room_id', roomId]);
    expect(calls).toContainEqual(['id', 10]);
    expect(calls).toContainEqual(['limit', 30]);
  });
});
