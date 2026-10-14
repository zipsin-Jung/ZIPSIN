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

    expect(screen.getByRole('heading', { level: 1, name: /계약과 동시에 흩어지는 부동산 정보.*집신 한곳에 모아 관리하고.*하나의 집 이력으로 가치를 키웁니다/ })).toBeInTheDocument();
    expect(screen.queryByText(/사전.?가입|데모|출시 알림/)).not.toBeInTheDocument();
  });

  it('TEST-PUB-SV-001 헤더와 한 화면 캐러셀 외 세로 소개 섹션과 푸터를 렌더링하지 않는다', () => {
    render(<PublicHome />);

    expect(screen.getAllByRole('region', { name: '집신이 필요한 네 장면' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /장면 보기/ })).toHaveLength(4);
    expect(document.querySelector('#features')).not.toBeInTheDocument();
    expect(document.querySelector('#how')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('TEST-RC-PUB-IMG-001 승인된 첫 이미지를 우선 노출한다', () => {
    render(<PublicHome />);

    const image = screen.getByRole('img', { name: /흩어진 계약서와 사진, 통화와 일정/ });
    expect(image).toHaveAttribute('src', expect.stringContaining('story-01-gather.png'));
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
    expect(actions[2]).toHaveAccessibleName('웹에서 시작하기');
    expect(actions[2]).toHaveAttribute('href', '/signup');
    expect(screen.queryByRole('link', { name: /App Store|Google Play/ })).not.toBeInTheDocument();
  });

  it('TEST-RC-PUB-IMG-003 이미지가 실패해도 설명과 실제 CTA를 유지한다', () => {
    render(<PublicHome />);

    fireEvent.error(screen.getByRole('img', { name: /흩어진 계약서와 사진, 통화와 일정/ }));

    expect(screen.getByText('이미지를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /내 집 기록 시작하기/ })[0]).toHaveAttribute('href', '/signup');
  });
});
