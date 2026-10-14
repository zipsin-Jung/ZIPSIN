import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/202610140001_phone_verification_hardening.sql'), 'utf8');

describe('phone verification hardening migration', () => {
  it('OTP 원문 없이 목적·digest·시도·단일 소비 상태를 저장한다', () => {
    expect(sql).toMatch(/purpose text not null/i);
    expect(sql).toMatch(/code_digest text not null/i);
    expect(sql).toMatch(/attempts integer not null default 0/i);
    expect(sql).toMatch(/consumed_at is null/i);
    expect(sql).not.toMatch(/\bcode\s+text/i);
  });

  it('발급과 검증 RPC를 공개 역할에서 차단한다', () => {
    expect(sql).toMatch(/issue_phone_challenge/i);
    expect(sql).toMatch(/verify_phone_challenge/i);
    expect(sql).toMatch(/revoke all on function public\.issue_phone_challenge/i);
    expect(sql).toMatch(/revoke all on function public\.verify_phone_challenge/i);
  });
});
