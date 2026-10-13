'use server';

import type {Provider} from '@supabase/supabase-js';
import {getSafeReturnPath} from '@/features/auth/domain/return-path';
import type {AuthProvider} from '@/features/auth/domain/providers';
import {readServerEnv} from '@/lib/env/server';
import {createSupabaseServerClient} from '@/lib/supabase/server';

class ProviderUnavailableError extends Error {
  constructor(provider: AuthProvider) {
    super(`AUTH_PROVIDER_UNAVAILABLE:${provider}`);
    this.name = 'ProviderUnavailableError';
  }
}

export async function startOAuth(provider: AuthProvider, returnTo: string): Promise<{redirectTo: string}> {
  const env = readServerEnv();
  if (!env.oauthProviders[provider]) throw new ProviderUnavailableError(provider);
  const safeReturn = getSafeReturnPath(returnTo);
  const callback = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000');
  callback.searchParams.set('returnTo', safeReturn);
  const supabase = await createSupabaseServerClient();
  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {redirectTo: callback.toString()},
  });
  if (error || !data.url) throw new Error('AUTH_START_FAILED');
  return {redirectTo: data.url};
}
