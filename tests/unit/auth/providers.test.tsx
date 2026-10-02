import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import {
  SUPPORTED_PROVIDERS,
  isSupportedProvider,
  toSupabaseProvider,
} from '@/features/auth/domain/providers';

describe('social providers', () => {
  it('Google·Kakao·Naver만 허용한다', () => {
    expect(SUPPORTED_PROVIDERS.map((provider) => provider.id)).toEqual([
      'google',
      'kakao',
      'naver',
    ]);
    expect(isSupportedProvider('github')).toBe(false);
  });

  it('Naver를 Supabase custom provider 이름으로 바꾼다', () => {
    expect(toSupabaseProvider('naver')).toBe('custom:naver');
    expect(toSupabaseProvider('google')).toBe('google');
  });

  it('설정된 제공자는 선택하고 준비 중 제공자는 실행하지 않는다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <SocialLoginButtons
        enabledProviders={['google']}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Google로 계속하기' }));
    expect(onSelect).toHaveBeenCalledWith('google');

    const naver = screen.getByRole('button', { name: 'Naver로 계속하기 준비 중' });
    expect(naver).toBeDisabled();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
