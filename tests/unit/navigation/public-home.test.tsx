import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PublicHome from '@/components/PublicHome';

describe('PublicHome', () => {
  it('집신을 설명하고 실제 로그인과 회원가입으로 연결한다', () => {
    render(<PublicHome />);

    expect(screen.getByRole('heading', { name: /사람이 바뀌어도/ })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '로그인' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: /집신 시작하기/ })[0]).toHaveAttribute('href', '/signup');
    expect(screen.queryByText(/사전.?가입|데모|출시 알림/)).not.toBeInTheDocument();
  });
});
