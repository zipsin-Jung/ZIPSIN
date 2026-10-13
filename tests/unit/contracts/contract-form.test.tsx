import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContractForm } from '@/features/contracts/components/ContractForm';

const homeId = '00000000-0000-4000-8000-000000000001';
const idempotencyKey = '00000000-0000-4000-8000-000000000002';

describe('ContractForm', () => {
  it('TEST-ZH-UI-005 validates reversed dates before calling the server', async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm homeId={homeId} idempotencyKey={idempotencyKey} action={action} />);
    await user.selectOptions(screen.getByLabelText('계약 종류'), 'jeonse');
    await user.type(screen.getByLabelText('계약 시작일'), '2027-02-02');
    await user.type(screen.getByLabelText('계약 만기일'), '2027-02-01');
    await user.click(screen.getByRole('button', { name: '계약 기간 저장' }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText('만기일은 시작일보다 빠를 수 없습니다.')).toBeInTheDocument();
  });

  it('TEST-ZH-UI-006 submits once and reports a safe server failure', async () => {
    const action = vi.fn().mockResolvedValue({ error: '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    const user = userEvent.setup();
    render(<ContractForm homeId={homeId} idempotencyKey={idempotencyKey} action={action} initial={{ contractKind: 'jeonse', startsOn: '2026-02-03', endsOn: '2027-02-02' }} />);
    await user.click(screen.getByRole('button', { name: '계약 기간 저장' }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('alert')).toHaveTextContent('저장하지 못했습니다');
  });

  it('TEST-ZH-UI-010 keeps an existing contract kind immutable while still submitting it', async () => {
    const action = vi.fn().mockResolvedValue({ saved: true });
    const user = userEvent.setup();
    render(<ContractForm contractExists homeId={homeId} idempotencyKey={idempotencyKey} action={action} initial={{ contractKind: 'monthly_rent', startsOn: '2026-02-03', endsOn: '2027-02-02' }} />);
    expect(screen.getByLabelText('계약 종류')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '계약 기간 저장' }));
    const data = action.mock.calls[0]?.[0] as FormData;
    expect(data.get('contractKind')).toBe('monthly_rent');
  });
});
