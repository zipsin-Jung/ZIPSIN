import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onboardingGuard, userGuard } = vi.hoisted(() => ({
  onboardingGuard: vi.fn(),
  userGuard: vi.fn(),
}));

vi.mock('@/features/auth/guards/require-onboarding', () => ({
  requireOnboardingComplete: onboardingGuard,
  requireUser: userGuard,
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/features/attachments/components/AttachmentUploader', () => ({
  AttachmentUploader: () => null,
}));
vi.mock('@/features/attachments/components/AttachmentLink', () => ({
  AttachmentLink: () => null,
}));

import HomeDetailPage from '@/app/(app)/homes/[homeId]/page';
import InvitationPage from '@/app/(app)/invitations/[token]/page';
import AppLayout from '@/app/(app)/layout';
import MyPage from '@/app/(app)/my/page';

type Result = { data: unknown; error: unknown };

function database(results: Record<string, Result>) {
  const from = vi.fn((table: string) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of ['select', 'eq', 'is', 'lte', 'limit', 'order', 'in']) {
      chain[method] = vi.fn(() => chain);
    }
    chain.maybeSingle = vi.fn().mockResolvedValue(results[table] ?? { data: null, error: null });
    chain.then = vi.fn((resolve) => Promise.resolve(results[table] ?? { data: [], error: null }).then(resolve));
    return chain;
  });
  const rpc = vi.fn().mockResolvedValue(results.rpc ?? { data: null, error: null });
  return { from, rpc };
}

describe('assignment-free office flow copy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not expose assignee management from a home', async () => {
    const db = database({
      homes: {
        data: {
          id: '00000000-0000-4000-8000-000000000010',
          office_id: '00000000-0000-4000-8000-000000000020',
          home_label: '월계동 집',
          address_line1: '서울특별시 노원구 예시로 10',
          address_detail: '101호',
        },
        error: null,
      },
      records: { data: [], error: null },
    });
    onboardingGuard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });

    render(await HomeDetailPage({
      params: Promise.resolve({ homeId: '00000000-0000-4000-8000-000000000010' }),
    }));

    expect(screen.getByRole('heading', { name: '월계동 집' })).toBeInTheDocument();
    expect(screen.queryByText('담당자 관리')).not.toBeInTheDocument();
  });

  it('explains that an accepted office member can use the office homes', async () => {
    const token = 'a'.repeat(32);
    const db = database({
      rpc: {
        data: { officeName: '집신 공인중개사무소', role: 'assistant', state: 'ready' },
        error: null,
      },
    });
    onboardingGuard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });

    render(await InvitationPage({
      params: Promise.resolve({ token }),
      searchParams: Promise.resolve({}),
    }));

    expect(screen.getByText(/수락하면 사무소에서 관리하는 집과 업무 기록을 함께 사용할 수 있습니다/)).toBeInTheDocument();
    expect(screen.queryByText(/담당으로 배정/)).not.toBeInTheDocument();
  });

  it('shows only working top-level routes in the app header', async () => {
    userGuard.mockResolvedValue({ supabase: database({}), user: { id: 'user-1' } });

    render(await AppLayout({ children: <div>본문</div> }));

    const desktop = screen.getByRole('navigation', { name: '주요 메뉴' });
    expect(within(desktop).getByRole('link', { name: /^홈$/ })).toHaveAttribute('href', '/home');
    expect(within(desktop).getByRole('link', { name: /^기록$/ })).toHaveAttribute('href', '/records');
    expect(within(desktop).getByRole('link', { name: /^채팅$/ })).toHaveAttribute('href', '/chats');
    expect(within(desktop).getByRole('link', { name: /^마이$/ })).toHaveAttribute('href', '/my');
  });

  it('provides a real my page instead of a placeholder navigation link', async () => {
    const db = database({
      profiles: { data: { display_name: '김집신' }, error: null },
      user_roles: { data: { primary_role: 'tenant' }, error: null },
    });
    onboardingGuard.mockResolvedValue({ supabase: db, user: { id: 'user-1' } });

    render(await MyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { name: '김집신님의 집신' })).toBeInTheDocument();
    expect(screen.getByText('임차인')).toBeInTheDocument();
    // 위 메뉴에서 빠진 할 일·고객지원은 마이에서 계속 들어갈 수 있어야 한다 (TEST-APP-NAV-003).
    expect(screen.getByRole('link', { name: /할 일/ })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: /고객지원 채팅/ })).toHaveAttribute('href', '/support');
  });
});
