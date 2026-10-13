import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/components/PasswordSignupForm', () => ({ PasswordSignupForm: () => <div>가입 양식</div> }));
import SignupPage from '@/app/(auth)/signup/page';

describe('signup progress', () => {
  it('TEST-ZSD-AUTH-001 shows phone verification as a required signup step', async () => {
    render(await SignupPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('list', { name: '회원가입 진행 단계' })).toHaveTextContent('휴대전화 인증');
    expect(screen.getByText(/노트북·PC에서도 같은 계정/)).toBeInTheDocument();
  });
  it('marks email confirmation as the current step while waiting', async () => {
    render(await SignupPage({ searchParams: Promise.resolve({ notice: 'check_email' }) }));
    expect(screen.getByText('2 이메일 확인')).toHaveAttribute('aria-current', 'step');
  });
});
