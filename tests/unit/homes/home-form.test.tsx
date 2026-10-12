import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomeForm, type HomeFormState } from '@/features/homes/components/HomeForm';

const props = { officeId: '00000000-0000-4000-8000-000000000001', idempotencyKey: '00000000-0000-4000-8000-000000000002' };
async function fill() {
  await userEvent.type(screen.getByLabelText('도로명 주소'), '서울시 예시로 10');
  await userEvent.type(screen.getByLabelText('상세 위치 (선택)'), '101호');
  await userEvent.type(screen.getByLabelText('내부 구분명 (선택)'), '첫 관리 집');
}
describe('HomeForm', () => {
  it('TEST-HOME-009 shows inline validation and focuses the address without submitting', async () => {
    const action = vi.fn();
    render(<HomeForm {...props} action={action} />);
    await userEvent.click(screen.getByRole('button', { name: '집 등록하기' }));
    expect(await screen.findByText('도로명 주소를 5~200자로 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByLabelText('도로명 주소')).toHaveFocus();
    expect(action).not.toHaveBeenCalled();
  });
  it('TEST-HOME-010 preserves all fields and request key after a server failure and retry', async () => {
    const action = vi.fn().mockResolvedValue({ error: '잠시 후 다시 시도해 주세요.' });
    render(<HomeForm {...props} action={action} />);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: '집 등록하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('잠시 후 다시 시도해 주세요.');
    expect(screen.getByLabelText('도로명 주소')).toHaveValue('서울시 예시로 10');
    expect(screen.getByLabelText('상세 위치 (선택)')).toHaveValue('101호');
    expect(screen.getByLabelText('내부 구분명 (선택)')).toHaveValue('첫 관리 집');
    await userEvent.click(screen.getByRole('button', { name: '집 등록하기' }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0][0].get('idempotencyKey')).toBe(props.idempotencyKey);
    expect(action.mock.calls[1][0].get('idempotencyKey')).toBe(props.idempotencyKey);
  });
  it('TEST-HOME-011 blocks repeated submit events during saving', async () => {
    let finish!: (value: HomeFormState) => void;
    const action = vi.fn(() => new Promise<HomeFormState>((resolve) => { finish = resolve; }));
    render(<HomeForm {...props} action={action} />);
    await fill();
    const form = screen.getByRole('button', { name: '집 등록하기' }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(screen.getByRole('button', { name: '저장 중…' })).toBeDisabled();
    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => finish({ error: '다시 시도해 주세요.' }));
  });
  it('TEST-HOME-012 explains separate private spaces and keeps inputs after thrown failures', async () => {
    render(<HomeForm {...props} action={vi.fn().mockRejectedValue(new Error('private database error'))} />);
    expect(screen.getByText(/같은 주소여도 자동으로 합치지 않습니다/)).toBeInTheDocument();
    await fill();
    await userEvent.click(screen.getByRole('button', { name: '집 등록하기' }));
    expect(await screen.findByRole('alert')).not.toHaveTextContent('private database error');
    expect(screen.getByLabelText('도로명 주소')).toHaveValue('서울시 예시로 10');
  });
});
