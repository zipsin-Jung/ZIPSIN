import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/components/PasswordSignupForm', () => ({ PasswordSignupForm: () => <div>가입 양식</div> }));
import SignupPage from '@/app/(auth)/signup/page';

describe('signup progress', () => {
  it('TEST-SP-FLOW-01 uses the approved central card copy for one-screen signup', async () => {
    render(await SignupPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('heading', { level: 1, name: '집신 회원가입' })).toBeInTheDocument();
    expect(screen.getByText('한 번 가입하면 휴대전화와 PC에서 같은 계정으로 이용해요.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '로그인' })[0]).toHaveAttribute('href', '/login');
  });

  // TEST-SP-NOEMAIL-01 (2026-10-16): 이메일 확인 안내를 보여 주지 않는다.
  it('never asks the user to confirm their email', async () => {
    render(await SignupPage({ searchParams: Promise.resolve({}) }));
    expect(screen.queryByText(/확인 링크/)).not.toBeInTheDocument();
    expect(screen.queryByText(/메일을 확인/)).not.toBeInTheDocument();
  });

  it('shows a readable error when the signup is rejected', async () => {
    render(await SignupPage({ searchParams: Promise.resolve({ error: 'service_unavailable' }) }));
    expect(screen.getByRole('alert')).toHaveTextContent('가입 설정을 확인하고 있습니다.');
  });

  it('집신체크 가입도 휴대폰 인증 뒤 돌아감을 안내한다', async () => {
    render(await SignupPage({ searchParams: Promise.resolve({ next: '/ck' }) }));
    expect(screen.getByText(/가입을 마치면 집신체크로 바로 돌아가요/)).toBeInTheDocument();
    expect(screen.queryByText(/문자 인증 없이/)).not.toBeInTheDocument();
  });
});
