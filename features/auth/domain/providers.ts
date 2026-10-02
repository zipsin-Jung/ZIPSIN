export type SocialProviderId = 'google' | 'kakao' | 'naver';

export const SUPPORTED_PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'kakao', label: 'Kakao' },
  { id: 'naver', label: 'Naver' },
] as const satisfies ReadonlyArray<{
  id: SocialProviderId;
  label: string;
}>;

export function isSupportedProvider(value: string): value is SocialProviderId {
  return SUPPORTED_PROVIDERS.some((provider) => provider.id === value);
}

export function toSupabaseProvider(
  provider: SocialProviderId,
): 'google' | 'kakao' | 'custom:naver' {
  return provider === 'naver' ? 'custom:naver' : provider;
}
