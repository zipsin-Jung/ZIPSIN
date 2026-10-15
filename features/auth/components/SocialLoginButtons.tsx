'use client';

import { useTransition } from 'react';
import { MessageCircle } from 'lucide-react';
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
  const available = SUPPORTED_PROVIDERS.filter((provider) => enabledProviders.includes(provider.id));

  function choose(provider: SocialProviderId) {
    if (onSelect) {
      onSelect(provider);
      return;
    }

    startTransition(async () => {
      await startOAuth(provider, next);
    });
  }

  if (available.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-center gap-5" aria-label="간편 로그인 제공자">
        {available.map((provider) => {
        const accessibleName = `${provider.label}로 계속하기`;

        return (
          <button
            className={`grid size-16 shrink-0 place-items-center rounded-full border text-xl font-black shadow-sm transition hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#c58c32] active:scale-95 motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60 ${provider.id === 'kakao' ? 'border-[#f5d800] bg-[#fee500] text-[#171717]' : provider.id === 'naver' ? 'border-[#03a94d] bg-[#03c75a] text-white' : 'border-slate-300 bg-white text-[#4285f4]'}`}
            disabled={isPending}
            key={provider.id}
            onClick={() => choose(provider.id)}
            type="button"
            aria-label={accessibleName}
          >
            {provider.id === 'google' ? 'G' : provider.id === 'kakao' ? <MessageCircle aria-hidden="true" className="size-7" fill="currentColor" /> : 'N'}
            <span className="sr-only">로 계속하기</span>
          </button>
        );
        })}
      </div>
      {isPending && <p role="status">로그인 화면으로 이동하고 있습니다.</p>}
    </div>
  );
}
