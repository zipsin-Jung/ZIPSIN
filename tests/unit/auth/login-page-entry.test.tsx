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
});
