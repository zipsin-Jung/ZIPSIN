import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ usePathname: () => '/home' }));
import { AppSidebar } from '@/features/navigation/components/AppSidebar';
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

  it('TEST-APP-NAV-002 PC는 왼쪽 메뉴(Figma My Home): 있는 화면만 링크, 없는 화면은 준비 중', () => {
    render(<AppSidebar />);
    const menu = screen.getByRole('complementary', { name: '메뉴' });
    expect(within(menu).getByRole('link', { name: '내 집' })).toHaveAttribute('href', '/home');
    expect(within(menu).getByRole('link', { name: '계약 · 입주' })).toHaveAttribute('href', '/homes');
    expect(within(menu).getByRole('link', { name: '알림' })).toHaveAttribute('href', '/notifications');
    expect(within(menu).getByRole('link', { name: '설정' })).toHaveAttribute('href', '/my');
    expect(within(menu).queryByRole('link', { name: /체크리스트/ })).not.toBeInTheDocument();
    expect(within(menu).getAllByText('준비 중').length).toBeGreaterThanOrEqual(2);
  });
});
