export type AuthProvider = 'google' | 'kakao' | 'naver';
export type ProviderState = {provider: AuthProvider; available: boolean; reason?: 'not-configured'};
export type ProviderConfiguration = Record<AuthProvider, boolean>;

const PROVIDERS: AuthProvider[] = ['google', 'kakao', 'naver'];

export function listProviderStates(configuration: ProviderConfiguration): ProviderState[] {
  return PROVIDERS.map((provider) => configuration[provider]
    ? {provider, available: true}
    : {provider, available: false, reason: 'not-configured'});
}
