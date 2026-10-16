import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountRecoveryForm } from '@/features/auth/components/AccountRecoveryForm';

function json(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('AccountRecoveryForm — 아이디 찾기 (이메일 → 화면에 바로)', () => {
  it('TEST-FIND-UI-001: 가린 아이디와 가입일을 바로 보여 준다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { status: 'found', accounts: [{ maskedUsername: 'zip***nt', createdAt: '2026-10-16T01:00:00Z' }] }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<AccountRecoveryForm />);
    await user.type(screen.getByLabelText('가입한 이메일'), 'na@example.com');
    await user.click(screen.getByRole('button', { name: '아이디 찾기' }));
    const result = await screen.findByRole('status');
    expect(result).toHaveTextContent('zip***nt');
    expect(result).toHaveTextContent('가입일 2026.10.16');
    expect(result).toHaveTextContent('안전을 위해 일부를 가렸어요.');
    expect(screen.getByRole('link', { name: '이 아이디로 로그인하기' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: '비밀번호도 기억나지 않아요' })).toHaveAttribute('href', '/account-recovery?tab=password');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/recovery/username', expect.objectContaining({ body: JSON.stringify({ email: 'na@example.com' }) }));
  });

  it('TEST-FIND-UI-002: 없는 이메일이면 오류와 회원가입 링크를 보여 준다 (시안 ⑨-A)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(200, { status: 'not_found' })));
    const user = userEvent.setup();
    render(<AccountRecoveryForm />);
    await user.type(screen.getByLabelText('가입한 이메일'), 'wrong@example.com');
    await user.click(screen.getByRole('button', { name: '아이디 찾기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이 이메일로 가입된 아이디가 없어요.');
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('button', { name: '다시 찾기' })).toBeInTheDocument();
    expect(screen.getByLabelText('가입한 이메일')).toHaveAttribute('aria-invalid', 'true');
  });

  it.each([
    [{ status: 'rate_limited' }, 429, '찾기 요청이 많아요.'],
    [{ status: 'invalid_email' }, 400, '이메일 형식을 확인해 주세요.'],
    [{ status: 'temporarily_unavailable' }, 503, '지금은 찾을 수 없어요.'],
  ])('TEST-FIND-UI-003: %o 응답을 알아듣기 쉬운 문장으로 알린다', async (body, status, text) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(status, body)));
    const user = userEvent.setup();
    render(<AccountRecoveryForm />);
    await user.type(screen.getByLabelText('가입한 이메일'), 'a@example.com');
    await user.click(screen.getByRole('button', { name: '아이디 찾기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(text);
  });

  it('TEST-FIND-UI-004: 네트워크 오류를 알린다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const user = userEvent.setup();
    render(<AccountRecoveryForm />);
    await user.type(screen.getByLabelText('가입한 이메일'), 'a@example.com');
    await user.click(screen.getByRole('button', { name: '아이디 찾기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('네트워크 연결을 확인');
  });
});

describe('AccountRecoveryForm — 비밀번호 재설정 (이름 + 휴대폰 인증)', () => {
  async function openPasswordTab() {
    const user = userEvent.setup();
    render(<AccountRecoveryForm />);
    await user.click(screen.getByRole('tab', { name: '비밀번호 재설정' }));
    return user;
  }

  it('TEST-PWRESET-UI-001: 아이디·이름·휴대폰 번호를 다 넣어야 인증번호를 보낼 수 있다', async () => {
    const user = await openPasswordTab();
    expect(screen.getByRole('tab', { name: '비밀번호 재설정' })).toHaveAttribute('aria-selected', 'true');
    const send = screen.getByRole('button', { name: '인증번호 받기' });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText('이름'), '정민선');
    await user.type(screen.getByLabelText('휴대폰 번호'), '01012345678');
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText('아이디'), 'zipsin_agent');
    expect(send).toBeEnabled();
  });

  it('TEST-PWRESET-UI-002: 인증에 성공하면 새 비밀번호 화면으로 이동한다', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(200, { ok: true, challengeId: 'c-1', maskedPhone: '010-****-5678' }))
      .mockResolvedValueOnce(json(200, { ok: true, username: 'zipsin_agent', resetReady: true }));
    vi.stubGlobal('fetch', fetchMock);
    const user = await openPasswordTab();
    await user.type(screen.getByLabelText('아이디'), 'zipsin_agent');
    await user.type(screen.getByLabelText('이름'), '정민선');
    await user.type(screen.getByLabelText('휴대폰 번호'), '010-1234-5678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    expect(await screen.findByText('010-****-5678로 인증번호를 보냈어요.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/recovery/phone/send', expect.objectContaining({ body: JSON.stringify({ username: 'zipsin_agent', name: '정민선', phone: '010-1234-5678' }) }));
    expect(screen.getByLabelText(/남은 시간/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('인증번호 6자리'), '123456');
    await user.click(screen.getByRole('button', { name: '인증번호 확인' }));
    expect(await screen.findByText(/본인 확인이 끝났어요/)).toBeInTheDocument();
    expect(assign).toHaveBeenCalledWith('/reset-password');
  });

  it('TEST-PWRESET-UI-003: 이름·번호가 맞는 계정이 없으면 그렇게 알려 준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(404, { ok: false, error: 'not_found' })));
    const user = await openPasswordTab();
    await user.type(screen.getByLabelText('아이디'), 'zipsin_agent');
    await user.type(screen.getByLabelText('이름'), '김없음');
    await user.type(screen.getByLabelText('휴대폰 번호'), '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('아이디·이름·휴대폰 번호가 모두 맞는 계정이 없어요.');
    expect(screen.queryByLabelText('인증번호 6자리')).not.toBeInTheDocument();
  });

  it.each([
    [{ error: 'expired' }, '인증번호가 만료됐어요.'],
    [{ error: 'attempts_exceeded' }, '입력 횟수를 넘었어요.'],
    [{ error: 'mismatch' }, '인증번호가 맞지 않아요.'],
  ])('TEST-PWRESET-UI-004: 인증 실패 %o', async (body, text) => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(json(200, { ok: true, challengeId: 'c-1', maskedPhone: '010-****-5678' }))
      .mockResolvedValueOnce(json(400, { ok: false, ...body })));
    const user = await openPasswordTab();
    await user.type(screen.getByLabelText('아이디'), 'zipsin_agent');
    await user.type(screen.getByLabelText('이름'), '정민선');
    await user.type(screen.getByLabelText('휴대폰 번호'), '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    await user.type(await screen.findByLabelText('인증번호 6자리'), '000000');
    await user.click(screen.getByRole('button', { name: '인증번호 확인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(text);
  });

  it('TEST-PWRESET-UI-005: 요청 제한과 네트워크 오류를 알린다', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(json(429, { error: 'rate_limited' }))
      .mockRejectedValueOnce(new Error('offline')));
    const user = await openPasswordTab();
    await user.type(screen.getByLabelText('아이디'), 'zipsin_agent');
    await user.type(screen.getByLabelText('이름'), '정민선');
    await user.type(screen.getByLabelText('휴대폰 번호'), '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('요청이 많아요.');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    expect(await screen.findByText(/네트워크 연결을 확인/)).toBeInTheDocument();
  });

  it('TEST-PWRESET-UI-006: 비밀번호 탭으로 바로 열 수 있다', () => {
    render(<AccountRecoveryForm initialTab="password" />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
  });
});
