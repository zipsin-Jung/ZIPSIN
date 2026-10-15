import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KakaoInquiryButton } from '@/features/support/components/KakaoInquiryButton';

const navigation = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}));

describe('KakaoInquiryButton', () => {
  beforeEach(() => {
    navigation.pathname = '/';
  });

  it('TEST-SUPPORT-KAKAO-002 opens the official Kakao chat safely in a new window', () => {
    render(<KakaoInquiryButton />);

    const link = screen.getByRole('link', {
      name: '카카오톡으로 집신 대표에게 문의하기 (새 창)',
    });
    expect(link).toHaveAttribute('href', 'https://pf.kakao.com/_xhcxkFX/chat');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('external'));
    expect(link).toHaveTextContent('카카오톡 문의');
  });

  it('TEST-SUPPORT-KAKAO-003 reserves a touch target above mobile and tablet controls', () => {
    render(<KakaoInquiryButton />);

    const link = screen.getByRole('link', {
      name: '카카오톡으로 집신 대표에게 문의하기 (새 창)',
    });
    expect(link).toHaveClass('fixed', 'right-4', 'z-[60]', 'min-h-14', 'min-w-14');
    expect(link.className).toContain('bottom-[calc(5rem+env(safe-area-inset-bottom))]');
    expect(link.className).toContain('md:bottom-24');
    expect(link.className).toContain('md:right-6');
    expect(link.className).toContain('lg:bottom-6');
  });

  it('TEST-SUPPORT-KAKAO-004 leaves the ZIPSIN Check route to its single route-specific inquiry button', () => {
    navigation.pathname = '/ck';

    render(<KakaoInquiryButton />);

    expect(
      screen.queryByRole('link', {
        name: '카카오톡으로 집신 대표에게 문의하기 (새 창)',
      }),
    ).not.toBeInTheDocument();
  });
});
