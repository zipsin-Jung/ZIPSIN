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
    <div className="grid gap-3" aria-label="간편가입 제공자">
      {SUPPORTED_PROVIDERS.map((provider) => {
        const enabled = enabledProviders.includes(provider.id);
        const accessibleName = `${provider.label}로 계속하기${enabled ? '' : ' 준비 중'}`;

        return (
          <button
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-900 transition hover:border-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            disabled={!enabled || isPending}
            key={provider.id}
            onClick={() => choose(provider.id)}
            type="button"
            aria-label={accessibleName}
          >
            {provider.label}로 계속하기
            {!enabled && <span className="ml-2 text-sm font-normal">준비 중</span>}
          </button>
        );
      })}
      {isPending && <p role="status">로그인 화면으로 이동하고 있습니다.</p>}
    </div>
  );
}
