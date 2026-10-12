import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610130002_paid_pilot_core.sql'), 'utf8');
const fn = (name: string) => sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'))?.[0] ?? '';
describe('record mutation boundary', () => {
  it('TEST-REC-001 delegates authorization and writes an idempotent immutable record', () => {
    const body = fn('create_home_record');
    expect(body).toContain('public.can_create_record');
    expect(body).toContain('insert into public.records');
    expect(body).toMatch(/idempotency_key/);
    expect(body).toContain('insert into public.access_audit_events');
  });
  it('TEST-TASK-001 changes task state only through home access and audits it', () => {
    const body = fn('update_task_state');
    expect(body).toContain('public.has_active_office_home_access');
    expect(body).toMatch(/p_status not in \('todo', 'in_progress', 'done'\)/);
    expect(body).toContain('insert into public.access_audit_events');
  });
});
