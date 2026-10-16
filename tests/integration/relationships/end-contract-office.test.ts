import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationDirectory = join(process.cwd(), 'supabase/migrations');
const migrations = readdirSync(migrationDirectory).sort().map((name) => readFileSync(join(migrationDirectory, name), 'utf8')).join('\n');

function latestFunction(name: string) {
  const matches = [...migrations.matchAll(new RegExp(`create or replace function public\\.${name}\\([^]*?\\$\\$;`, 'gi'))];
  return matches.at(-1)?.[0] ?? '';
}

describe('계약 종료·사무소 구성원 내보내기 경계', () => {
  it('TEST-RC-END-001 계약 종료는 현재 사무소의 중개사만 할 수 있다', () => {
    const fn = latestFunction('end_active_contract');
    expect(fn).toMatch(/security definer set search_path = public/i);
    expect(fn).toMatch(/auth\.uid\(\)/);
    expect(fn).toMatch(/v_contract\.status <> 'active'[\s\S]*relation_ended/i);
    expect(fn).toMatch(/office_role in \('principal_broker', 'associate_broker'\)[\s\S]*membership\.status = 'active'[\s\S]*membership\.ended_at is null/i);
  });

  it('TEST-RC-END-002 계약이 끝나면 그 계약의 관계와 남은 초대가 함께 끝난다', () => {
    const fn = latestFunction('end_active_contract');
    expect(fn).toMatch(/update public\.home_memberships[\s\S]*status = 'ended', ended_at = now\(\)[\s\S]*contract_id = v_contract\.id/i);
    expect(fn).toMatch(/update public\.invitations[\s\S]*revoked_at = now\(\)[\s\S]*accepted_at is null/i);
    expect(fn).toMatch(/update public\.contracts[\s\S]*status = 'ended'/i);
    expect(fn).toMatch(/'end_contract', 'contract'[\s\S]*'contract_ended'/i);
    expect(fn).not.toMatch(/delete from/i);
  });

  it('TEST-RC-END-003 구성원 내보내기는 대표 중개사만, 마지막 대표는 내보낼 수 없다', () => {
    const fn = latestFunction('end_office_membership');
    expect(fn).toMatch(/security definer set search_path = public/i);
    expect(fn).toMatch(/membership\.office_role = 'principal_broker'[\s\S]*membership\.status = 'active'/i);
    expect(fn).toMatch(/last_principal/);
    expect(fn).toMatch(/update public\.office_memberships[\s\S]*status = 'ended', ended_at = now\(\)/i);
    expect(fn).toMatch(/update public\.office_home_assignments[\s\S]*status = 'ended'/i);
    expect(fn).not.toMatch(/delete from/i);
  });

  it('TEST-RC-END-004 두 함수는 로그인한 사용자에게만 실행 권한이 있다', () => {
    for (const name of ['end_active_contract', 'end_office_membership']) {
      expect(migrations).toMatch(new RegExp(`revoke all on function public\\.${name}\\(uuid\\) from public, anon, authenticated`, 'i'));
      expect(migrations).toMatch(new RegExp(`grant execute on function public\\.${name}\\(uuid\\) to authenticated`, 'i'));
    }
  });
});
