import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PublicHome from '@/components/PublicHome';

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('PublicHome', () => {
  it('TEST-RC-PUB-001 첫 장에서 집신의 제품 정의와 시작 행동을 설명한다', () => {
    render(<PublicHome />);

    expect(screen.getByRole('heading', { level: 1, name: '부동산, 아직도 위치와 서류만 보고 계신가요?' })).toBeInTheDocument();
    expect(screen.queryByText(/사전.?가입|데모|출시 알림/)).not.toBeInTheDocument();
  });

  it('TEST-PUB-SV-001 헤더와 한 화면 캐러셀 외 세로 소개 섹션과 푸터를 렌더링하지 않는다', () => {
    render(<PublicHome />);

    expect(screen.getAllByRole('region', { name: '집신이 필요한 네 장면' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /장면 보기/ })).toHaveLength(4);
    expect(document.querySelector('#features')).not.toBeInTheDocument();
    expect(document.querySelector('#how')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });

  // TEST-PUB-SERVICES-001 (2026-10-16, 2026-10-18 변경): 상단 순서는 집신체크 · 집신수리 · 집신클린.
  // 체크는 집신체크로, 수리는 준비 중 화면으로 간다.
  it('TEST-PUB-SERVICES-001 상단 서비스 메뉴는 집신체크·집신수리·집신클린 순서이고 체크·수리가 링크다', () => {
    render(<PublicHome />);
    const nav = screen.getByRole('navigation', { name: '집신 서비스' });
    const items = Array.from(nav.querySelectorAll('li > a, li > span')).map((item) => item.firstChild?.textContent);
    expect(items).toEqual(['집신체크', '집신수리', '집신클린']);
    const links = Array.from(nav.querySelectorAll('a'));
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/ck');
    expect(links[1]).toHaveAttribute('href', '/rp');
    expect(links[1]).toHaveTextContent('집신수리 (준비 중)');
  });

  // TEST-PUB-SERVICES-004 (D3, 2026-10-18 변경): 클린만 회색이며 누를 수 없다.
  it('TEST-PUB-SERVICES-004 집신클린은 누를 수 없고 화면읽기에는 준비 중으로 읽힌다', () => {
    render(<PublicHome />);
    const nav = screen.getByRole('navigation', { name: '집신 서비스' });
    expect(nav.querySelectorAll('button')).toHaveLength(0);
    const soon = nav.querySelectorAll('[aria-disabled="true"]');
    expect(soon).toHaveLength(1);
    expect(soon[0]).toHaveTextContent('집신클린 (준비 중)');
  });

  it('TEST-RC-PUB-IMG-001 서론의 집 관리 이력 이미지를 우선 노출한다', () => {
    render(<PublicHome />);

    const image = screen.getByRole('img', { name: /에어컨과 배관, 난방과 마감의 관리 이력/ });
    expect(image).toHaveAttribute('src', expect.stringContaining('story-04-home-history.png'));
  });

  it('TEST-PUB-INSTALL-CTA-001 설치, 로그인, 웹 시작 순서로 실제 서비스 진입을 제공한다', () => {
    render(<PublicHome />);

    const header = document.querySelector('header');
    const headerActions = header?.querySelector('[data-header-actions]');
    expect(headerActions).toBeInTheDocument();
    const actions = Array.from(headerActions?.children ?? []).filter((element) => element.matches('button, a'));

    expect(actions).toHaveLength(3);
    expect(actions[0]).toHaveAccessibleName('앱으로 다운로드');
    expect(actions[1]).toHaveAccessibleName('로그인');
    expect(actions[1]).toHaveAttribute('href', '/login');
    expect(actions[2]).toHaveAccessibleName('회원가입');
    expect(actions[2]).toHaveAttribute('href', '/signup');
    expect(screen.queryByRole('link', { name: /App Store|Google Play/ })).not.toBeInTheDocument();
  });

  it('TEST-RC-PUB-IMG-003 이미지가 실패해도 설명과 실제 CTA를 유지한다', () => {
    render(<PublicHome />);

    fireEvent.error(screen.getByRole('img', { name: /에어컨과 배관, 난방과 마감의 관리 이력/ }));

    expect(screen.getByText('이미지를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /내 집 기록 시작하기/ })[0]).toHaveAttribute('href', '/signup');
  });
});
