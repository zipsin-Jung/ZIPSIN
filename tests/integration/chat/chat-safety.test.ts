import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610130009_chat_safety_support.sql'), 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';

describe('chat blocking and reporting', () => {
  it('checks both block directions whenever a direct room is accessed', () => {
    const access = fn('can_access_chat_room');
    expect(access).toMatch(/chat_blocks/i);
    expect(access).toMatch(/blocker_user_id = auth\.uid\(\)[\s\S]*blocked_user_id/i);
    expect(access).toMatch(/blocked_user_id = auth\.uid\(\)[\s\S]*blocker_user_id/i);
  });

  it('blocks only a known direct participant and closes the direct path immediately', () => {
    const block = fn('block_direct_user');
    expect(block).toMatch(/room_type = 'direct'/i);
    expect(block).toMatch(/chat_room_memberships/i);
    expect(block).toMatch(/insert into public\.chat_blocks/i);
  });

  it('allows reporting only a message visible to the reporter without copying body text', () => {
    const report = fn('report_chat_message');
    expect(report).toContain('can_access_chat_room');
    expect(report).toMatch(/select message\.room_id[\s\S]*message\.id = p_message_id/i);
    const table = sql.match(/create table public\.chat_reports[\s\S]*?\);/i)?.[0] ?? '';
    expect(table).not.toMatch(/message_body|body text|content text/i);
  });
});
