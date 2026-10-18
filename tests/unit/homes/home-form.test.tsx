import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomeForm, type HomeFormState } from '@/features/homes/components/HomeForm';

const props = { officeId: '00000000-0000-4000-8000-000000000001', idempotencyKey: '00000000-0000-4000-8000-000000000002' };
async function fill() {
  await userEvent.type(screen.getByLabelText('주소'), '서울시 예시로 10');
  await userEvent.type(screen.getByLabelText('동·호수 (선택)'), '101호');
  await userEvent.click(screen.getByText('사무소에서 부르는 이름 적기 (선택)'));
  await userEvent.type(screen.getByLabelText('내부 구분명 (선택)'), '첫 관리 집');
}
describe('HomeForm', () => {
  it('TEST-HOME-QUICK-001 shows a done screen with photo upload as the next step after saving', async () => {
    const action = vi.fn().mockResolvedValue({ homeId: 'new-home', redirectTo: '/homes/new-home' });
    render(<HomeForm {...props} action={action} />);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: '집 등록하기' }));
    expect(await screen.findByRole('heading', { name: '첫 관리 집 등록 끝' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '사진 올리기' })).toHaveAttribute('href', '/homes/new-home/records/new');
    expect(screen.getByRole('link', { name: '집 화면 보기' })).toHaveAttribute('href', '/homes/new-home');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('TEST-HOME-QUICK-002 keeps the address, clears the unit and uses a new request key for the same building', async () => {
    const action = vi.fn().mockResolvedValue({ homeId: 'home-201' });
    render(<HomeForm {...props} action={action} />);
    await userEvent.type(screen.getByLabelText('주소'), '서울시 예시로 10');
    await userEvent.type(screen.getByLabelText('동·호수 (선택)'), '201호');
    await userEvent.click(screen.getByRole('button', { name: '등록하고 같은 건물 다른 호수 바로 추가' }));
    expect(await screen.findByRole('status')).toHaveTextContent('서울시 예시로 10 201호 등록 끝');
    expect(screen.getByLabelText('주소')).toHaveValue('서울시 예시로 10');
    expect(screen.getByLabelText('동·호수 (선택)')).toHaveValue('');
    await userEvent.type(screen.getByLabelText('동·호수 (선택)'), '202호');
    await userEvent.click(screen.getByRole('button', { name: '집 등록하기' }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[1][0].get('idempotencyKey')).not.toBe(props.idempotencyKey);
  });

  it('TEST-HOME-009 shows inline validation and focuses the address without submitting', async () => {
    const action = vi.fn();
    render(<HomeForm {...props} action={action} />);
    await userEvent.click(screen.getByRole('button', { name: '집 등록하기' }));
    expect(await screen.findByText('주소를 5~200자로 적어 주세요.')).toBeInTheDocument();
    expect(screen.getByLabelText('주소')).toHaveFocus();
    expect(action).not.toHaveBeenCalled();
  });
  it('TEST-HOME-010 preserves all fields and request key after a server failure and retry', async () => {
    const action = vi.fn().mockResolvedValue({ error: '잠시 후 다시 시도해 주세요.' });
    render(<HomeForm {...props} action={action} />);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: '집 등록하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('잠시 후 다시 시도해 주세요.');
    expect(screen.getByLabelText('주소')).toHaveValue('서울시 예시로 10');
    expect(screen.getByLabelText('동·호수 (선택)')).toHaveValue('101호');
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
    expect(screen.getByLabelText('주소')).toHaveValue('서울시 예시로 10');
  });
});
