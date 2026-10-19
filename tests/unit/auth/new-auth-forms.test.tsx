import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/actions/login-with-username', () => ({ loginWithUsernameAction: vi.fn() }));
vi.mock('@/features/auth/actions/register-verified-password-account', () => ({ registerVerifiedPasswordAccountAction: vi.fn() }));
vi.mock('@/features/auth/actions/request-account-recovery', () => ({ requestAccountRecoveryAction: vi.fn() }));

import { UsernameLoginForm } from '@/features/auth/components/UsernameLoginForm';
import { PasswordSignupForm } from '@/features/auth/components/PasswordSignupForm';
import { AccountRecoveryForm } from '@/features/auth/components/AccountRecoveryForm';

describe('new auth forms', () => {
  it('shows only username and password (no email/phone login) with DEC-037 save-ID and 30-day keep-login, and toggles visibility', async () => {
    const user = userEvent.setup();
    render(<UsernameLoginForm />);
    expect(screen.getByLabelText('아이디')).toBeRequired();
    expect(screen.queryByLabelText(/이메일|전화번호/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('아이디 저장')).not.toBeChecked();
    const keep = screen.getByLabelText('이 기기에서 30일 동안 로그인 유지');
    expect(keep).toBeChecked();
    expect(screen.getByText('사무소 공용 PC에서는 끄세요.')).toBeInTheDocument();
    await user.click(keep);
    expect(screen.getByText('브라우저를 닫으면 로그아웃돼요.')).toBeInTheDocument();
    expect(screen.getByText(/비밀번호는 집신이 저장하지 않아요/)).toBeInTheDocument();
    const password = screen.getByLabelText('비밀번호');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: '비밀번호 숨기기' })).toBeInTheDocument();
  });

  it('uses the exact signup button copy', () => {
    render(<PasswordSignupForm />);
    expect(screen.getByRole('button', { name: '회원가입 완료' })).toBeDisabled();
    expect(screen.getByLabelText('이메일')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('휴대폰 번호')).toHaveAttribute('autocomplete', 'tel');
  });

  it('starts on the username finder with an email field (시안 ⑧)', () => {
    render(<AccountRecoveryForm />);
    expect(screen.getByLabelText('가입한 이메일')).toBeRequired();
    expect(screen.getByRole('button', { name: '아이디 찾기' })).toBeInTheDocument();
  });
});
