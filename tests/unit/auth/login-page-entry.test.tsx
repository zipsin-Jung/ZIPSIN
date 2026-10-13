import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoginPage from '@/app/(auth)/login/page';

describe('production login entry', () => {
  it('does not send users back to the retired preregistration page', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole('link', { name: /집신 소개/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '회원가입' }).every((link) => link.getAttribute('href') === '/signup')).toBe(true);
    expect(screen.queryByText(/사전\s*가입|데모/)).not.toBeInTheDocument();
  });

  it('집신체크에서 온 사용자의 회원가입에도 안전한 복귀 경로를 전달한다', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ next: '/ck' }) }));

    expect(screen.getAllByRole('link', { name: '회원가입' }).every(
      (link) => link.getAttribute('href') === '/signup?next=%2Fck',
    )).toBe(true);
  });

  it.each([
    ['rate_limited', '로그인 시도가 많아'],
    ['service_unavailable', '로그인 서비스 연결을 확인'],
    ['recovery_expired', '비밀번호 재설정 링크가 만료'],
  ])('%s 오류를 비밀번호 오류로 잘못 안내하지 않는다', async (error, message) => {
    render(await LoginPage({ searchParams: Promise.resolve({ error }) }));
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });
});
