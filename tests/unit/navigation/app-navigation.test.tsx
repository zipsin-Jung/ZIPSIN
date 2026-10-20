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
      ['만기 · 퇴거', '/expiry'], ['문서함', '/living?tab=document'], ['주소록', '/contacts'], ['알림', '/notifications'], ['설정', '/my'],
    ];
    for (const [name, href] of expected) expect(within(menu).getByRole('link', { name })).toHaveAttribute('href', href);
    expect(within(menu).getByRole('link', { name: '내 집' })).toHaveAttribute('aria-current', 'page');
  });
});

import { ModeSwitch, modeSwitchTarget } from '@/features/navigation/components/ModeSwitch';

describe('고객 ↔ 파트너 전환 (숨고 방식, 2026-10-19)', () => {
  it('TEST-MODE-001 전환 버튼이 가는 곳: 파트너 계정이 없으면 파트너 등록', () => {
    expect(modeSwitchTarget('customer', 'office-1')).toEqual({ href: '/space?to=office-1', label: '파트너로 전환' });
    expect(modeSwitchTarget('customer', null)).toEqual({ href: '/partners/new', label: '파트너로 전환' });
    expect(modeSwitchTarget('partner', 'office-1')).toEqual({ href: '/space?to=me', label: '고객으로 전환' });
  });

  it('TEST-MODE-002 파트너 모드 아래 메뉴: 사무소 홈 · 집 목록 · 기록하기 · 채팅 · 더보기', () => {
    render(<AppNavigation mode="partner" />);
    const mobile = screen.getByRole('navigation', { name: '모바일 주요 메뉴' });
    expect(within(mobile).getAllByRole('link').map((link) => link.textContent)).toEqual(['사무소 홈', '집 목록', '기록하기', '채팅', '더보기']);
  });

  it('TEST-MODE-003 파트너 모드 PC 메뉴에 직원·할 일, 고객 메뉴(체크리스트)는 없음', () => {
    render(<AppSidebar mode="partner" />);
    const menu = screen.getByRole('complementary', { name: '메뉴' });
    expect(within(menu).getByRole('link', { name: '직원' })).toHaveAttribute('href', '/office/members');
    expect(within(menu).queryByRole('link', { name: '체크리스트' })).not.toBeInTheDocument();
  });

  it('TEST-MODE-004 전환 버튼 글자', () => {
    render(<ModeSwitch mode="customer" partnerOfficeId={null} />);
    expect(screen.getByRole('link', { name: '파트너로 전환' })).toHaveAttribute('href', '/partners/new');
  });
});
