import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppNavigation } from '@/features/navigation/components/AppNavigation';

describe('AppNavigation', () => {
  it('links the five mobile destinations to real app routes', () => {
    render(<AppNavigation />);

    const mobile = screen.getByRole('navigation', { name: '모바일 주요 메뉴' });
    expect(mobile).toHaveTextContent('홈');
    expect(mobile).toHaveTextContent('집');
    expect(mobile).toHaveTextContent('추가');
    expect(mobile).toHaveTextContent('채팅');
    expect(mobile).toHaveTextContent('마이');
    expect(within(mobile).getByRole('link', { name: '홈' })).toHaveAttribute('href', '/home');
    expect(within(mobile).getByRole('link', { name: '채팅' })).toHaveAttribute('href', '/chats');
    expect(within(mobile).getByRole('link', { name: '마이' })).toHaveAttribute('href', '/my');
  });
});
