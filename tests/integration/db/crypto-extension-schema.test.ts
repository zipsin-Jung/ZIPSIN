import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationFiles = [
  '202610060001_account_usernames.sql',
  '202610130002_paid_pilot_core.sql',
  '202610130004_office_wide_home_access.sql',
  '202610130005_relationship_invitations.sql',
];

describe('pgcrypto schema qualification', () => {
  it.each(migrationFiles)('%s qualifies digest through the extensions schema', (file) => {
    const sql = readFileSync(join(process.cwd(), 'supabase/migrations', file), 'utf8');
    expect(sql).not.toMatch(/(?<!\.)\bdigest\(/i);
  });
});
