import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KakaoInquiryButton } from '@/features/support/components/KakaoInquiryButton';

describe('KakaoInquiryButton', () => {
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

  it('TEST-SUPPORT-KAKAO-003 reserves a touch target above the mobile navigation', () => {
    render(<KakaoInquiryButton />);

    const link = screen.getByRole('link', {
      name: '카카오톡으로 집신 대표에게 문의하기 (새 창)',
    });
    expect(link).toHaveClass('fixed', 'right-4', 'z-[60]', 'min-h-14', 'min-w-14');
    expect(link.className).toContain('bottom-[calc(5rem+env(safe-area-inset-bottom))]');
    expect(link.className).toContain('md:bottom-6');
    expect(link.className).toContain('md:right-6');
  });
});
