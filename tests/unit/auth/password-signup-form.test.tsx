import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/actions/register-password-account', () => ({
  registerPasswordAccountAction: vi.fn(),
}));

import { PasswordSignupForm } from '@/features/auth/components/PasswordSignupForm';

describe('PasswordSignupForm', () => {
  it('collects username password confirmation and email with required agreements', () => {
    render(<PasswordSignupForm next="/ck" />);

    expect(screen.getByLabelText('아이디')).toBeRequired();
    expect(screen.getByLabelText('비밀번호', { selector: 'input' })).toBeRequired();
    expect(screen.getByLabelText('비밀번호 확인')).toBeRequired();
    expect(screen.getByLabelText('이메일')).toBeRequired();
    expect(screen.getByRole('checkbox', { name: /서비스 이용약관/ })).toBeRequired();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    expect(document.querySelector('input[name="next"]')).toHaveValue('/ck');
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

  it('필수 동의를 한 번에 선택하고 연령 체크를 표시하지 않는다', async () => {
    const user = userEvent.setup();
    render(<PasswordSignupForm />);
    await user.click(screen.getByRole('checkbox', { name: '필수 항목 전체 동의' }));
    expect(screen.getByRole('checkbox', { name: /서비스 이용약관/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /개인정보 수집/ })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: /14세/ })).not.toBeInTheDocument();
  });
});
