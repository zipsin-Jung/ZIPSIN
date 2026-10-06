'use client';

import { useTransition } from 'react';
import { startOAuth } from '@/features/auth/actions/start-oauth';
import {
  SUPPORTED_PROVIDERS,
  type SocialProviderId,
} from '@/features/auth/domain/providers';

type Props = {
  enabledProviders: SocialProviderId[];
  next?: string;
  onSelect?: (provider: SocialProviderId) => void;
};

export function SocialLoginButtons({ enabledProviders, next, onSelect }: Props) {
  const [isPending, startTransition] = useTransition();

  function choose(provider: SocialProviderId) {
    if (onSelect) {
      onSelect(provider);
      return;
    }

    startTransition(async () => {
      await startOAuth(provider, next);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="간편 로그인 제공자">
      {SUPPORTED_PROVIDERS.map((provider) => {
        const enabled = enabledProviders.includes(provider.id);
        const accessibleName = `${provider.label}로 계속하기${enabled ? '' : ' 준비 중'}`;

        return (
          <button
            className={`min-h-13 rounded-xl border px-3 py-3 text-base font-extrabold shadow-sm transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c58c32] disabled:cursor-not-allowed disabled:opacity-60 ${provider.id === 'kakao' ? 'border-[#f5d800] bg-[#fee500] text-[#171717]' : provider.id === 'naver' ? 'border-[#03a94d] bg-[#03c75a] text-white' : 'border-slate-300 bg-white text-slate-900'}`}
            disabled={!enabled || isPending}
            key={provider.id}
            onClick={() => choose(provider.id)}
            type="button"
            aria-label={accessibleName}
          >
            {provider.label}
            <span className="sr-only">로 계속하기{!enabled ? ' 준비 중' : ''}</span>
          </button>
        );
      })}
      {isPending && <p role="status">로그인 화면으로 이동하고 있습니다.</p>}
    </div>
  );
}
