import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/actions/register-verified-password-account', () => ({
  registerVerifiedPasswordAccountAction: vi.fn(),
}));

import { PasswordSignupForm } from '@/features/auth/components/PasswordSignupForm';

describe('PasswordSignupForm', () => {
  it('collects username password confirmation and email with required agreements', () => {
    render(<PasswordSignupForm next="/ck" />);

    expect(screen.getByLabelText('아이디')).toBeRequired();
    expect(screen.getByLabelText('비밀번호', { selector: 'input' })).toBeRequired();
    expect(screen.getByLabelText('비밀번호 확인')).toBeRequired();
    expect(screen.getByLabelText('이메일')).toBeRequired();
    expect(screen.getByLabelText('휴대폰 번호')).toBeRequired();
    expect(screen.getByRole('button', { name: '인증번호 받기' })).toBeInTheDocument();
    expect(screen.queryByLabelText('인증번호')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /서비스 이용약관/ })).toBeRequired();
    expect(screen.getByRole('button', { name: '회원가입 완료' })).toBeDisabled();
    expect(document.querySelector('input[name="next"]')).toHaveValue('/ck');
  });

  it('문자 발송 뒤 인증번호 입력을 바로 아래에 펼치고 성공 상태를 저장한다', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, challengeId: '11111111-1111-4111-8111-111111111111', maskedPhone: '010-****-5678', expiresAt: '2026-10-14T01:05:00.000Z' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }));
    render(<PasswordSignupForm />);
    await user.type(screen.getByLabelText('휴대폰 번호'), '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    expect(await screen.findByLabelText('인증번호')).toHaveAttribute('autocomplete', 'one-time-code');
    await user.type(screen.getByLabelText('인증번호'), '123456');
    await user.click(screen.getByRole('button', { name: '인증 확인' }));
    expect(await screen.findByText('휴대폰 인증이 완료되었습니다.')).toBeInTheDocument();
    expect(document.querySelector('input[name="challengeId"]')).toHaveValue('11111111-1111-4111-8111-111111111111');
    vi.unstubAllGlobals();
  });

  it('인증 뒤 휴대폰 번호를 바꾸면 인증 상태를 즉시 무효화한다', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, challengeId: '11111111-1111-4111-8111-111111111111', maskedPhone: '010-****-5678' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }));
    render(<PasswordSignupForm />);
    const phone = screen.getByLabelText('휴대폰 번호');
    await user.type(phone, '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    await user.type(await screen.findByLabelText('인증번호'), '123456');
    await user.click(screen.getByRole('button', { name: '인증 확인' }));
    expect(await screen.findByText('휴대폰 인증이 완료되었습니다.')).toBeInTheDocument();
    await user.type(phone, '9');
    expect(screen.queryByText('휴대폰 인증이 완료되었습니다.')).not.toBeInTheDocument();
    expect(document.querySelector('input[name="challengeId"]')).toHaveValue('');
    vi.unstubAllGlobals();
  });

  it('비밀번호 조건과 보기 버튼을 제공한다', async () => {
    const user = userEvent.setup();
    render(<PasswordSignupForm />);
    const password = screen.getByLabelText('비밀번호', { selector: 'input' });
    expect(screen.getByText('영문 소문자·숫자·특수문자를 포함해 8자 이상')).toBeInTheDocument();
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('마우스만 올려도 비밀번호를 노출하지 않는다', async () => {
    const user = userEvent.setup();
    render(<PasswordSignupForm />);
    const password = screen.getByLabelText('비밀번호', { selector: 'input' });
    await user.hover(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('필수 동의를 한 번에 선택하고 연령 체크를 표시하지 않는다', async () => {
    const user = userEvent.setup();
    render(<PasswordSignupForm />);
    await user.click(screen.getByRole('checkbox', { name: '필수 항목 전체 동의' }));
    expect(screen.getByRole('checkbox', { name: /서비스 이용약관/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /개인정보 수집/ })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: /14세/ })).not.toBeInTheDocument();
  });

  it('아이디 중복 확인 뒤 값을 바꾸면 확인 상태를 무효화한다', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'available' }),
    }));
    render(<PasswordSignupForm />);

    const username = screen.getByLabelText('아이디');
    await user.type(username, 'new_user');
    await user.click(screen.getByRole('button', { name: '아이디 중복 확인' }));
    expect(await screen.findByText('사용할 수 있는 아이디입니다.')).toBeInTheDocument();

    await user.type(username, '2');
    expect(screen.queryByText('사용할 수 있는 아이디입니다.')).not.toBeInTheDocument();
    expect(screen.getByText('아이디 중복 확인이 필요합니다.')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('늦게 도착한 이전 아이디 응답은 현재 아이디를 승인하지 않는다', async () => {
    let resolveResponse!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveResponse = resolve; })));
    const user = userEvent.setup();
    render(<PasswordSignupForm />);
    const username = screen.getByLabelText('아이디');
    await user.type(username, 'first_user');
    await user.click(screen.getByRole('button', { name: '아이디 중복 확인' }));
    await user.clear(username);
    await user.type(username, 'second_user');
    resolveResponse({ ok: true, json: async () => ({ status: 'available' }) });
    expect(await screen.findByText('아이디 중복 확인이 필요합니다.')).toBeInTheDocument();
    expect(screen.queryByText('사용할 수 있는 아이디입니다.')).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
