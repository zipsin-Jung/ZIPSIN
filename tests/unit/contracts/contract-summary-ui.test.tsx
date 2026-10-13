import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContractSummary } from '@/features/contracts/components/ContractSummary';

const summary = {
  homeLabel: '우리집',
  addressLine1: '서울 노원구 예시로 10',
  addressDetail: '101동 1401호',
  contractId: '00000000-0000-4000-8000-000000000001',
  endsOn: '2027-02-02',
  contractDay: { label: 'D-112', days: 112 },
  ownRelationship: 'tenant' as const,
  ownPlanStatus: 'move_out_preparing' as const,
  partyPlans: [
    { role: 'landlord' as const, status: 'renewal_considering' as const },
    { role: 'tenant' as const, status: 'move_out_preparing' as const },
  ],
};

describe('ContractSummary', () => {
  it('TEST-ZH-UI-001 shows the house, masked address, expiry, and date together', () => {
    render(<ContractSummary summary={summary} />);
    expect(screen.getByRole('heading', { name: '우리집' })).toBeInTheDocument();
    expect(screen.getByText('D-112')).toBeInTheDocument();
    expect(screen.getByText('2027년 2월 2일')).toBeInTheDocument();
    expect(screen.queryByText(/101동 1401호/)).not.toBeInTheDocument();
  });

  it('TEST-ZH-UI-002 offers exactly three own-plan states and explains they are not legal notice', () => {
    render(<ContractSummary summary={summary} />);
    expect(screen.getAllByRole('button', { name: /아직 결정 전|연장 생각 중|퇴거 준비/ })).toHaveLength(3);
    expect(screen.getByText(/계약 연장이나 퇴거 통지가 자동으로 전달되지는 않습니다/)).toBeInTheDocument();
    expect(document.querySelector('input[name="subjectUserId"]')).toBeNull();
  });

  it('TEST-ZH-UI-003 saves only the current user plan and shows party disagreement', async () => {
    const save = vi.fn().mockResolvedValue({ saved: true });
    const user = userEvent.setup();
    render(<ContractSummary summary={summary} onPlanSave={save} />);
    expect(screen.getByText('임대인 · 연장 생각 중')).toBeInTheDocument();
    expect(screen.getByText('임차인 · 퇴거 준비')).toBeInTheDocument();
    expect(screen.getByText('서로 확인이 필요해요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '연장 생각 중' }));
    const data = save.mock.calls[0]?.[0] as FormData;
    expect(data.get('contractId')).toBe(summary.contractId);
    expect(data.get('planStatus')).toBe('renewal_considering');
    expect(data.get('subjectUserId')).toBeNull();
  });
});
