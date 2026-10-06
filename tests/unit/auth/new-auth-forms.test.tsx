import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/actions/login-with-username', () => ({ loginWithUsernameAction: vi.fn() }));
vi.mock('@/features/auth/actions/register-password-account', () => ({ registerPasswordAccountAction: vi.fn() }));
vi.mock('@/features/auth/actions/request-account-recovery', () => ({ requestAccountRecoveryAction: vi.fn() }));

import { UsernameLoginForm } from '@/features/auth/components/UsernameLoginForm';
import { PasswordSignupForm } from '@/features/auth/components/PasswordSignupForm';
import { AccountRecoveryForm } from '@/features/auth/components/AccountRecoveryForm';

describe('new auth forms', () => {
  it('shows only username and password for normal login and toggles visibility', async () => {
    const user = userEvent.setup();
    render(<UsernameLoginForm />);
    expect(screen.getByLabelText('아이디')).toBeRequired();
    const password = screen.getByLabelText('비밀번호');
    expect(password).toHaveAttribute('type', 'password');
    expect(screen.queryByLabelText('이메일')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: '비밀번호 숨기기' })).toBeInTheDocument();
  });

  it('uses the exact signup button copy', () => {
    render(<PasswordSignupForm />);
    expect(screen.getByRole('button', { name: /^회원가입$/ })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toHaveAttribute('type', 'email');
  });

  it('collects recovery email without revealing account state', () => {
    render(<AccountRecoveryForm />);
    expect(screen.getByLabelText('가입 이메일')).toBeRequired();
    expect(screen.getByRole('button', { name: '확인 메일 받기' })).toBeInTheDocument();
  });
});
