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

const DISPLAY_ORDER: SocialProviderId[] = ['kakao', 'naver', 'google'];

const STYLE: Record<SocialProviderId, string> = {
  kakao: 'border-[#F2D600] bg-[#FEE500] text-[#191919]',
  naver: 'border-[#03A94D] bg-[#03C75A] text-white',
  google: 'border-[#8A9792] bg-white text-[#16211E]',
};

/** 실제 환경에 연결된 제공자만 보여준다. 연결 전 제공자는 버튼도 안내 문구도 만들지 않는다. */
export function SocialLoginButtons({ enabledProviders, next, onSelect }: Props) {
  const [isPending, startTransition] = useTransition();
  const providers = DISPLAY_ORDER
    .filter((id) => enabledProviders.includes(id))
    .map((id) => SUPPORTED_PROVIDERS.find((provider) => provider.id === id)!);

  if (providers.length === 0) return null;

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
    <div role="group" aria-label="간편 로그인" className="flex flex-col gap-2.5">
      {providers.map((provider) => (
        <button
          className={`h-12 rounded-xl border text-base font-semibold transition disabled:cursor-wait disabled:opacity-70 ${STYLE[provider.id]}`}
          disabled={isPending}
          key={provider.id}
          onClick={() => choose(provider.id)}
          type="button"
        >
          {provider.label}로 계속하기
        </button>
      ))}
      {isPending && <p role="status" className="text-sm text-[#5D6A65]">로그인 화면으로 이동하고 있습니다.</p>}
    </div>
  );
}
