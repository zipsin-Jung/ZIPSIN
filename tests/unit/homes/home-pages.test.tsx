import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { guard, action } = vi.hoisted(() => ({ guard: vi.fn(), action: vi.fn() }));
vi.mock('@/features/auth/guards/require-onboarding', () => ({ requireOnboardingComplete: guard }));
vi.mock('@/features/homes/actions/create-home', () => ({ createHomeAction: action }));
import NewHomePage from '@/app/(app)/homes/new/page';
import HomesPage from '@/app/(app)/homes/page';
const officeId = '00000000-0000-4000-8000-000000000001';
function database(results: Record<string, { data: unknown; error: unknown }>) {
  const chains: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {};
  const from = vi.fn((table: string) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of ['select', 'eq', 'is', 'lte', 'limit', 'order', 'in']) chain[method] = vi.fn(() => chain);
    chain.maybeSingle = vi.fn().mockResolvedValue(results[table]);
    chain.then = vi.fn((resolve) => Promise.resolve(results[table]).then(resolve));
    chains[table] = chain;
    return chain;
  });
  return { from, chains };
}
describe('home route server boundaries', () => {
  beforeEach(() => vi.clearAllMocks());
  it('TEST-HOME-017 validates session and active personal principal membership before showing form', async () => {
    const db = database({ office_memberships: { data: { office_id: officeId, office_role: 'principal_broker' }, error: null } });
    guard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });
    render(await NewHomePage({ searchParams: Promise.resolve({ office: officeId }) }));
    expect(screen.getByRole('heading', { name: '집 등록하기' })).toBeInTheDocument();
    expect(screen.getByLabelText('도로명 주소')).toBeInTheDocument();
    expect(db.chains.office_memberships.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(db.chains.office_memberships.eq).toHaveBeenCalledWith('office_id', officeId);
    expect(db.chains.office_memberships.eq).toHaveBeenCalledWith('status', 'active');
    expect(db.chains.office_memberships.is).toHaveBeenCalledWith('ended_at', null);
    expect(db.chains.office_memberships.lte).toHaveBeenCalledWith('started_at', expect.any(String));
  });
  it.each([null, { office_id: officeId, office_role: 'assistant' }, { office_id: officeId, office_role: 'associate_broker' }])('TEST-HOME-018 rejects missing/ung ranted membership without exposing a form', async (membership) => {
    const db = database({ office_memberships: { data: membership, error: null } });
    guard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });
    render(await NewHomePage({ searchParams: Promise.resolve({ office: officeId }) }));
    expect(screen.queryByLabelText('도로명 주소')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('이 계정으로는 집을 등록할 수 없습니다. 사무소 대표에게 권한을 확인해 주세요.');
    expect(screen.getByRole('link', { name: '업무 홈으로' })).toHaveAttribute('href', '/home');
  });
  it('TEST-HOME-019 lists only office-filtered active RLS-visible homes and keeps equal addresses separate', async () => {
    const db = database({
      homes: { data: [{ id: 'home-1', home_label: '관리 집 A', address_line1: '같은 도로명 주소', address_detail: '101호' }, { id: 'home-2', home_label: '관리 집 B', address_line1: '같은 도로명 주소', address_detail: '101호' }], error: null },
      office_memberships: { data: { office_role: 'principal_broker' }, error: null },
    });
    guard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });
    render(await HomesPage({ searchParams: Promise.resolve({ office: officeId }) }));
    expect(screen.getByRole('link', { name: /관리 집 A/ })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.getByRole('link', { name: /관리 집 B/ })).toHaveAttribute('href', '/homes/home-2');
    expect(db.chains.homes.eq).toHaveBeenCalledWith('office_id', officeId);
    expect(db.chains.homes.eq).toHaveBeenCalledWith('status', 'active');
  });
  it('TEST-HOME-020 separates database failure from an empty list without exposing database details', async () => {
    const db = database({ homes: { data: null, error: { message: 'private database details' } } });
    guard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });
    render(await HomesPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('alert')).toHaveTextContent('처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    expect(screen.queryByText('아직 연결된 집이 없습니다.')).not.toBeInTheDocument();
    expect(screen.queryByText('private database details')).not.toBeInTheDocument();
  });
});
