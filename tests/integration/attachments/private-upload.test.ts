import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sqlPath = path.join(process.cwd(), 'supabase/migrations/202610130003_private_attachments.sql');
const sql = () => fs.readFileSync(sqlPath, 'utf8');
describe('private attachment storage boundary', () => {
  it('TEST-FILE-004 creates a private bucket with size and MIME limits', () => {
    const body = sql();
    expect(body).toMatch(/home-records[\s\S]*public[^,]*false/i);
    expect(body).toMatch(/file_size_limit[\s\S]*20971520/i);
    for (const mime of ['image/jpeg', 'image/png', 'image/heic', 'application/pdf']) expect(body).toContain(mime);
  });
  it('TEST-FILE-005 prepares paths server-side only after record authorization', () => {
    const body = sql();
    expect(body).toContain('create or replace function public.prepare_attachment_upload');
    expect(body).toContain('public.can_access_record');
    expect(body).toMatch(/auth\.uid\(\)[\s\S]*gen_random_uuid\(\)/);
  });
  it('TEST-FILE-006 completes only the pending attachment owner and enforces ten files', () => {
    const body = sql();
    expect(body).toContain('create or replace function public.complete_attachment_upload');
    expect(body).toMatch(/created_by = auth\.uid\(\)/);
    expect(body).toMatch(/count\(\*\)[\s\S]*>= 10/);
  });
  it('TEST-FILE-007 storage policies never expose a public read path', () => {
    const body = sql();
    expect(body).not.toMatch(/create policy[^;]*for select[^;]*using \(true\)/i);
    expect(body).toMatch(/storage\.objects[\s\S]*bucket_id = 'home-records'/i);
  });
});
