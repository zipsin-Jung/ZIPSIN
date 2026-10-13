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

  it('집신체크 가입은 문자 인증 없이 같은 계정으로 바로 저장함을 안내한다', async () => {
    render(await SignupPage({ searchParams: Promise.resolve({ next: '/ck' }) }));
    expect(screen.getByText(/집신체크로 바로 돌아가요/)).toBeInTheDocument();
    expect(screen.queryByText('3 휴대전화 인증')).not.toBeInTheDocument();
  });
});
