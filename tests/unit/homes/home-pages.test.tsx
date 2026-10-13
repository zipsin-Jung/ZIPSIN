import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { guard, action, loadSummary } = vi.hoisted(() => ({ guard: vi.fn(), action: vi.fn(), loadSummary: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/features/auth/guards/require-onboarding', () => ({ requireOnboardingComplete: guard }));
vi.mock('@/features/homes/actions/create-home', () => ({ createHomeAction: action }));
vi.mock('@/features/contracts/services/contract-summary', () => ({ loadContractHomeSummaryFromSupabase: loadSummary }));
import NewHomePage from '@/app/(app)/homes/new/page';
import HomesPage from '@/app/(app)/homes/page';
import HomeDetailPage from '@/app/(app)/homes/[homeId]/page';
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
    expect(screen.getByRole('link', { name: '관리 집 A 기록 열기' })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.getByRole('link', { name: '관리 집 B 기록 열기' })).toHaveAttribute('href', '/homes/home-2');
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
  it('TEST-RC-REC-001 gives an empty home one clear first-record action', async () => {
    const homeId = '00000000-0000-4000-8000-000000000010';
    const db = database({
      records: { data: [], error: null },
      chat_rooms: { data: null, error: null },
    });
    guard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });
    loadSummary.mockResolvedValue({
      ok: true,
      status: 'ready',
      summary: {
        home: { id: homeId, officeId, label: '첫 번째 집', addressLine1: '서울시 예시로 10', addressDetail: '101호' },
        contract: { id: 'contract-1', kind: 'jeonse', startsOn: '2026-02-03', endsOn: '2027-02-02' },
        currentUserRelationship: 'tenant',
        ownPlanStatus: 'undecided',
        partyPlans: [{ role: 'tenant', status: 'undecided' }],
        canEditContract: false,
        contractDay: { label: 'D-112', days: 112 },
        lifecycle: [
          { id: 'contract', label: '계약 보관', completed: true },
          { id: 'move_in', label: '입주 기록', completed: false },
          { id: 'management', label: '거주·관리', completed: false },
          { id: 'expiry', label: '만기·퇴거', completed: false },
        ],
        nextActions: [],
      },
    });

    render(await HomeDetailPage({ params: Promise.resolve({ homeId }) }));

    expect(screen.getByRole('heading', { name: '첫 번째 집' })).toBeInTheDocument();
    expect(screen.getByText('D-112')).toBeInTheDocument();
    expect(screen.getByText('집의 시간')).toBeInTheDocument();
    expect(screen.getByText('아직 남긴 기록이 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '첫 기록 남기기' })).toHaveAttribute('href', `/homes/${homeId}/records/new`);
  });

  it('TEST-ZH-UI-007 shows the contract form only when the summary grants contract editing', async () => {
    const homeId = '00000000-0000-4000-8000-000000000011';
    const db = database({ records: { data: [], error: null }, chat_rooms: { data: null, error: null } });
    guard.mockResolvedValue({ supabase: db, user: { id: 'broker-1' } });
    loadSummary.mockResolvedValue({
      ok: true,
      status: 'no_contract',
      summary: {
        home: { id: homeId, officeId, label: '관리 집', addressLine1: '서울시 예시로 11', addressDetail: null },
        contract: null,
        currentUserRelationship: null,
        ownPlanStatus: 'undecided',
        partyPlans: [],
        canEditContract: true,
        contractDay: null,
        lifecycle: [
          { id: 'contract', label: '계약 보관', completed: false },
          { id: 'move_in', label: '입주 기록', completed: false },
          { id: 'management', label: '거주·관리', completed: false },
          { id: 'expiry', label: '만기·퇴거', completed: false },
        ],
        nextActions: [],
      },
    });

    render(await HomeDetailPage({ params: Promise.resolve({ homeId }) }));

    expect(screen.getByRole('heading', { name: '계약 기간 확인' })).toBeInTheDocument();
    expect(loadSummary).toHaveBeenCalledWith(db, { homeId, userId: 'broker-1' });
  });

  it('TEST-ZH-UI-008 hides internal database details when the contract summary fails', async () => {
    const homeId = '00000000-0000-4000-8000-000000000012';
    const db = database({});
    guard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });
    loadSummary.mockResolvedValue({ ok: false, error: 'load_failed' });

    render(await HomeDetailPage({ params: Promise.resolve({ homeId }) }));

    expect(screen.getByRole('alert')).toHaveTextContent('이 집을 확인할 수 없습니다.');
    expect(screen.queryByText('load_failed')).not.toBeInTheDocument();
  });
});
