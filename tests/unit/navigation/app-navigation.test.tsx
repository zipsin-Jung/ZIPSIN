import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ usePathname: () => '/home' }));
import { AppNavigation } from '@/features/navigation/components/AppNavigation';

describe('AppNavigation', () => {
  it('TEST-ZH-HOME-007 links the five mobile destinations (홈·기록·기록하기·채팅·마이) and marks the current route', () => {
    render(<AppNavigation />);

    const mobile = screen.getByRole('navigation', { name: '모바일 주요 메뉴' });
    const names = within(mobile).getAllByRole('link').map((link) => link.textContent);
    expect(names).toEqual(['홈', '기록', '기록하기', '채팅', '마이']);
    expect(within(mobile).getByRole('link', { name: '홈' })).toHaveAttribute('href', '/home');
    expect(within(mobile).getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page');
    expect(within(mobile).getByRole('link', { name: '기록' })).toHaveAttribute('href', '/records');
    expect(within(mobile).getByRole('link', { name: '기록하기' })).toHaveAttribute('href', '/records/new');
    expect(within(mobile).getByRole('link', { name: '채팅' })).toHaveAttribute('href', '/chats');
    expect(within(mobile).getByRole('link', { name: '마이' })).toHaveAttribute('href', '/my');
  });

  it('TEST-APP-NAV-002 desktop menu shows 홈·기록·채팅·마이 plus one 기록하기 button', () => {
    render(<AppNavigation />);
    const desktop = screen.getByRole('navigation', { name: '주요 메뉴' });
    expect(within(desktop).getAllByRole('link').map((link) => link.textContent)).toEqual(['홈', '기록', '채팅', '마이']);
    const add = screen.getAllByRole('link', { name: '기록하기' });
    expect(add).toHaveLength(2);
  });
});
