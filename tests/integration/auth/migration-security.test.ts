import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/202610020001_auth_profile.sql'),
  'utf8',
);

describe('auth migration security boundary', () => {
  it('인증 사용자의 민감 프로필·동의·역할 직접 쓰기를 허용하지 않는다', () => {
    expect(migration).not.toMatch(/profiles_(insert|update)_own/);
    expect(migration).not.toMatch(/consents_(insert|update)_own/);
    expect(migration).not.toMatch(/roles_(insert|update)_own/);
    expect(migration).toContain('revoke all on public.profiles from anon, authenticated');
    expect(migration).toContain('revoke all on public.consent_acceptances from anon, authenticated');
    expect(migration).toContain('revoke all on public.user_roles from anon, authenticated');
  });

  it('가입 완료 때 인증 결과의 만료와 일회성 소비를 DB에서 검사한다', () => {
    expect(migration).toContain('expires_at > now()');
    expect(migration).toContain('consumed_at is null');
    expect(migration).toContain('set consumed_at = now()');
  });

  it('역할 저장 RPC가 전화 인증과 필수 동의를 검사한다', () => {
    expect(migration).toContain('function public.set_primary_role');
    expect(migration).toContain("document_type = 'terms'");
    expect(migration).toContain("document_type = 'privacy'");
    expect(migration).toContain("document_type = 'age_over_14'");
    expect(migration).toContain("document_version = '2026-10-02'");
  });

  it('가입 RPC가 임의의 동의 문서 버전을 거부한다', () => {
    expect(migration).toContain("p_terms_version <> '2026-10-02'");
    expect(migration).toContain("p_privacy_version <> '2026-10-02'");
    expect(migration).toContain("raise exception 'invalid_document_version'");
  });
});
