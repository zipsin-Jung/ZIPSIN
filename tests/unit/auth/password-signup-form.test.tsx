import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/actions/register-password-account', () => ({
  registerPasswordAccountAction: vi.fn(),
}));

import { PasswordSignupForm } from '@/features/auth/components/PasswordSignupForm';

describe('PasswordSignupForm', () => {
  it('collects username password confirmation and email with required agreements', () => {
    render(<PasswordSignupForm />);

    expect(screen.getByLabelText('아이디')).toBeRequired();
    expect(screen.getByLabelText('비밀번호', { selector: 'input' })).toBeRequired();
    expect(screen.getByLabelText('비밀번호 확인')).toBeRequired();
    expect(screen.getByLabelText('이메일')).toBeRequired();
    expect(screen.getByRole('checkbox', { name: /서비스 이용약관/ })).toBeRequired();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
  });
});
