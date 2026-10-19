import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ usePathname: () => '/home' }));
import { AppSidebar } from '@/features/navigation/components/AppSidebar';
import { AppNavigation } from '@/features/navigation/components/AppNavigation';

describe('AppNavigation (대표 Figma 2026-10-19)', () => {
  it('TEST-ZH-HOME-007 휴대폰 아래 메뉴: My Home · 체크리스트 · 거주·관리 · 알림 · 더보기', () => {
    render(<AppNavigation />);
    const mobile = screen.getByRole('navigation', { name: '모바일 주요 메뉴' });
    const links = within(mobile).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['My Home', '체크리스트', '거주·관리', '알림', '더보기']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/home', '/checklist', '/living', '/notifications', '/more']);
    expect(within(mobile).getByRole('link', { name: 'My Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('TEST-APP-NAV-002 PC 왼쪽 메뉴: Figma 메뉴가 모두 실제 화면으로 간다', () => {
    render(<AppSidebar />);
    const menu = screen.getByRole('complementary', { name: '메뉴' });
    const expected: Array<[string, string]> = [
      ['내 집', '/home'], ['체크리스트', '/checklist'], ['계약 · 입주', '/contract'], ['거주관리', '/living'],
      ['만기 · 퇴거', '/expiry'], ['문서함', '/living?tab=document'], ['알림', '/notifications'], ['설정', '/my'],
    ];
    for (const [name, href] of expected) expect(within(menu).getByRole('link', { name })).toHaveAttribute('href', href);
    expect(within(menu).getByRole('link', { name: '내 집' })).toHaveAttribute('aria-current', 'page');
  });
});
