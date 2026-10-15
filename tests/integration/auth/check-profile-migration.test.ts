import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ZIPSIN Check profile migration compatibility', () => {
  const sql = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/202610130101_zipsin_check_account_sync.sql'),
    'utf8',
  );

  it('기존 집신 profiles를 다시 만들지 않고 user_id 프로필에 필드만 추가한다', () => {
    expect(sql).not.toMatch(/create table public\.profiles/i);
    expect(sql).toMatch(/alter table public\.profiles[\s\S]*add column if not exists onboarding_state/i);
    expect(sql).toMatch(/alter table public\.profiles[\s\S]*add column if not exists user_type/i);
    expect(sql).not.toMatch(/\bid\s*=\s*auth\.uid\(\)/i);
  });

  it('인증 사용자만 실행하는 원자적 온보딩 RPC로 프로필과 유입을 저장한다', () => {
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/complete_check_onboarding\(p_user_type text\)/i);
    expect(sql).toMatch(/values \(auth\.uid\(\), p_user_type, 'complete'\)/i);
    expect(sql).toMatch(/grant execute on function public\.complete_check_onboarding\(text\) to authenticated/i);
  });
});
