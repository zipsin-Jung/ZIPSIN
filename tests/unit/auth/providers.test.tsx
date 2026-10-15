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

  it('연결된 제공자만 보여주고 선택하면 실행한다', async () => {
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

    expect(screen.queryByRole('button', { name: /네이버|카카오/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/준비 중|연결 설정 후/)).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('카카오·네이버·Google 순서로 보여준다', () => {
    render(<SocialLoginButtons enabledProviders={['google', 'naver', 'kakao']} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      '카카오로 계속하기',
      '네이버로 계속하기',
      'Google로 계속하기',
    ]);
  });

  it('연결된 제공자가 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<SocialLoginButtons enabledProviders={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
