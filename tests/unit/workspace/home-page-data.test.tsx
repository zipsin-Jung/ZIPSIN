import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { guard, loadDashboard } = vi.hoisted(() => ({ guard: vi.fn(), loadDashboard: vi.fn() }));
vi.mock('@/features/auth/guards/require-onboarding', () => ({ requireOnboardingComplete: guard }));
vi.mock('@/features/workspace/services/home-dashboard', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/workspace/services/home-dashboard')>();
  return { ...original, loadHomeDashboardFromSupabase: loadDashboard };
});
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/features/workspace/services/spaces', () => ({
  loadSpaceContext: async () => ({ displayName: '김집신', offices: [{ id: 'office-1', name: '집신 공인중개사무소', canRegisterHome: true }], personalHomes: [] }),
  loadHomeCoverPhotos: async () => new Map(),
}));
import HomePage from '@/app/(app)/home/page';

describe('home page data boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard.mockResolvedValue({ supabase: { from: () => ({ select: () => ({ in: () => ({ limit: async () => ({ data: [{ id: 'r1', home_id: 'home-1', record_kind: 'photo', repair_stage: null, title: '입주 사진', task_status: null, task_due_at: null }] }) }) }) }) }, user: { id: 'user-1' }, usagePurpose: 'broker', primaryRole: 'principal_broker' });
  });

  it('passes real dashboard counts and priority homes to the workspace', async () => {
    loadDashboard.mockResolvedValue({
      ok: true,
      offices: [{ id: 'office-1', name: '집신 공인중개사무소', canRegisterHome: true }],
      homes: [{ id: 'home-1', label: '집신아파트 1401호', address: '서울 노원구', endsOn: '2027-02-02', contractDay: { label: 'D-112', days: 112 }, openTask: null, updatedAt: '2026-10-13T00:00:00Z', officeId: 'office-1' }],
      unreadChatCount: 2,
      notificationCount: 3,
    });
    render(await HomePage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText('집신아파트 1401호')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /새 대화 2개/ })).toHaveAttribute('href', '/chats');
    expect(screen.getByRole('link', { name: /사진\s*1장/ })).toBeInTheDocument();
  });

  it('shows an error instead of an empty home when loading fails', async () => {
    loadDashboard.mockResolvedValue({ ok: false, error: 'load_failed' });
    render(await HomePage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('alert')).toHaveTextContent('처리하지 못했습니다');
    expect(screen.queryByText('아직 연결된 집이 없습니다')).not.toBeInTheDocument();
  });
});
