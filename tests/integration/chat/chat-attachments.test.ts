import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610130008_chat_attachments.sql'), 'utf8');
const signedRoute = readFileSync(join(process.cwd(), 'app/api/chat-attachments/[attachmentId]/url/route.ts'), 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';

describe('private chat attachments', () => {
  it('uses a private bucket with approved types and 20MB files', () => {
    expect(sql).toMatch(/'chat-attachments'[\s\S]*false[\s\S]*20971520/i);
    expect(sql).toMatch(/image\/jpeg[\s\S]*image\/png[\s\S]*image\/heic[\s\S]*application\/pdf/i);
  });

  it('prepares only for the sender message and caps each message at ten files', () => {
    const prepare = fn('prepare_chat_attachment_upload');
    expect(prepare).toMatch(/message\.sender_user_id = v_user_id/i);
    expect(prepare).toContain('can_access_chat_room');
    expect(prepare).toMatch(/v_count >= 10/i);
    expect(prepare).toMatch(/'chat\/' \|\| p_room_id[\s\S]*p_message_id[\s\S]*v_attachment_id/i);
  });

  it('does not expose guessed paths after relationship termination', () => {
    expect(sql).toMatch(/bucket_id = 'chat-attachments'[\s\S]*can_access_chat_room/i);
    expect(sql).not.toMatch(/public = true/i);
  });

  it('marks failed and stale pending uploads without treating them as ready', () => {
    expect(sql).toMatch(/status in \('pending', 'ready', 'failed'\)/i);
    expect(fn('fail_chat_attachment_upload')).toMatch(/status = 'failed'/i);
    expect(sql).toMatch(/upload_expires_at/i);
  });

  it('issues a signed URL for five minutes only after a ready authorized row is found', () => {
    expect(signedRoute).toMatch(/eq\('status', 'ready'\)/i);
    expect(signedRoute).toMatch(/createSignedUrl\(attachment\.storage_path, 300\)/i);
    expect(signedRoute).toMatch(/expiresIn: 300/i);
  });
});
