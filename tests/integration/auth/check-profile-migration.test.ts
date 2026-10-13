import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ZIPSIN Check profile migration compatibility', () => {
  const sql = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/202610130001_zipsin_check_account_sync.sql'),
    'utf8',
  );

  it('기존 집신 profiles를 다시 만들지 않고 user_id 프로필에 필드만 추가한다', () => {
    expect(sql).not.toMatch(/create table public\.profiles/i);
    expect(sql).toMatch(/alter table public\.profiles[\s\S]*add column if not exists onboarding_state/i);
    expect(sql).toMatch(/alter table public\.profiles[\s\S]*add column if not exists user_type/i);
    expect(sql).not.toMatch(/\bid\s*=\s*auth\.uid\(\)/i);
  });
});
