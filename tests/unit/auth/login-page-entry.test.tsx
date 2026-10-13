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
});
