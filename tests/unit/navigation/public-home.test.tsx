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

    expect(screen.getByRole('heading', { level: 1, name: '집에 관한 모든 일, 이제 집신으로.' })).toBeInTheDocument();
    expect(screen.getByText('사진·문서·대화·일정을 집 한 채에 이어서 기록하세요.')).toBeInTheDocument();
    expect(screen.queryByText(/사전.?가입|데모|출시 알림/)).not.toBeInTheDocument();
  });

  it('TEST-RC-HERO-INTEGRATION-001 공개 Hero와 생활 사례를 하나의 네 장 캐러셀로 통합한다', () => {
    render(<PublicHome />);

    expect(screen.getAllByRole('region', { name: '집신이 필요한 네 장면' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /장면 보기/ })).toHaveLength(4);
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByText(/찾고, 묻고, 설명하는 일을/)).not.toBeInTheDocument();
    expect(screen.queryByText('다음 일정')).not.toBeInTheDocument();
  });

  it('TEST-RC-PUB-IMG-001 승인된 첫 이미지를 우선 노출한다', () => {
    render(<PublicHome />);

    const image = screen.getByRole('img', { name: /흩어진 계약서와 사진, 통화와 일정/ });
    expect(image).toHaveAttribute('src', expect.stringContaining('story-01-gather.png'));
  });

  it('TEST-RC-PUB-003 실제 서비스 경로로만 연결한다', () => {
    render(<PublicHome />);

    expect(screen.getAllByRole('link', { name: '로그인' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: /웹에서 시작하기/ })[0]).toHaveAttribute('href', '/signup');
    expect(screen.getAllByRole('link', { name: '고객지원' })[0]).toHaveAttribute('href', '/support');
    expect(screen.queryByRole('link', { name: /앱 다운로드|App Store|Google Play/ })).not.toBeInTheDocument();
  });

  it('TEST-SUPPORT-KAKAO-004 푸터에서 공식 카카오 채널을 안전하게 연다', () => {
    render(<PublicHome />);

    const channel = screen.getByRole('link', { name: '집신 카카오 채널 (새 창)' });
    expect(channel).toHaveAttribute('href', 'https://pf.kakao.com/_xhcxkFX');
    expect(channel).toHaveAttribute('target', '_blank');
    expect(channel).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(channel).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('TEST-RC-PUB-IMG-003 이미지가 실패해도 설명과 제품 화면과 실제 CTA를 유지한다', () => {
    render(<PublicHome />);

    fireEvent.error(screen.getByRole('img', { name: /흩어진 계약서와 사진, 통화와 일정/ }));

    expect(screen.getByText('이미지를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByText('사진·문서·대화·일정')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /웹에서 시작하기/ })[0]).toHaveAttribute('href', '/signup');
  });

  it('TEST-RC-PUB-EV-001 제품 화면 예시를 실제 기능 버튼으로 오해하게 만들지 않는다', () => {
    render(<PublicHome />);

    expect(screen.getByText('집신 제품 화면')).toBeInTheDocument();
    expect(screen.getByText('초대된 사람만')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /계약 문서 확인|집신 채팅 열기/ })).not.toBeInTheDocument();
  });
});
