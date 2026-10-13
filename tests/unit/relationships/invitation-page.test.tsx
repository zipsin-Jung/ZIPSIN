import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const guard = vi.hoisted(() => vi.fn());
vi.mock('@/features/auth/guards/require-onboarding', () => ({ requireOnboardingComplete: guard }));
import InvitationPage from '@/app/(app)/invitations/[token]/page';

describe('relationship invitation page', () => {
  it('shows only the office, role, and scope before acceptance', async () => {
    const rpc = vi.fn(async (name: string) => name === 'preview_office_invitation'
      ? { data: null, error: { message: 'invalid_input' } }
      : { data: { officeName: '집신 부동산', role: 'tenant', scope: 'current_contract', state: 'ready' }, error: null });
    guard.mockResolvedValue({ supabase: { rpc }, user: { id: 'user-1' } });

    render(await InvitationPage({ params: Promise.resolve({ token: 'a'.repeat(43) }), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { name: /집신 부동산에서 집 기록을 함께 보자고 초대했어요/ })).toBeInTheDocument();
    expect(screen.getByText('임차인 · 현재 계약')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '초대 수락하기' })).toBeInTheDocument();
    expect(screen.queryByText(/주소|계약서|연락처/)).not.toBeInTheDocument();
  });
});
