import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610130009_chat_safety_support.sql'), 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';

describe('official ZIPSIN support access', () => {
  it('seeds one immutable official identity and limits the active representative to one', () => {
    expect(sql).toMatch(/집신 고객지원/);
    expect(sql).toMatch(/support_identities/i);
    expect(sql).toMatch(/unique[\s\S]*support_authorizations_one_active_representative/i);
  });

  it('deduplicates one support room per user', () => {
    const open = fn('open_support_conversation');
    expect(open).toMatch(/'support:' \|\| v_user_id/i);
    expect(open).toMatch(/on conflict \(relation_key\)/i);
  });

  it('rejects unofficial replies and records the real actor behind the official sender', () => {
    const reply = fn('reply_as_zipsin_support');
    expect(reply).toMatch(/support_authorizations/i);
    expect(reply).toMatch(/sender_user_id[\s\S]*v_user_id/i);
    expect(reply).toMatch(/sender_kind[\s\S]*'support'/i);
    expect(reply).toMatch(/support_identity_id/i);
  });

  it('does not grant a support representative access to non-support rooms', () => {
    const access = fn('can_access_chat_room');
    expect(access).toMatch(/room\.room_type = 'support'[\s\S]*support_authorizations/i);
    expect(access).not.toMatch(/support_authorizations[\s\S]*room\.room_type in \('direct', 'group'/i);
  });
});
