'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';
import {
  isSupportedProvider,
  toSupabaseProvider,
  type SocialProviderId,
} from '@/features/auth/domain/providers';

function isProviderEnabled(provider: SocialProviderId): boolean {
  return process.env[`NEXT_PUBLIC_AUTH_${provider.toUpperCase()}_ENABLED`] === 'true';
}

function getAuthSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const parsed = new URL(siteUrl);
  const isLoopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (process.env.NODE_ENV === 'production' && (parsed.protocol !== 'https:' || isLoopback)) {
    throw new Error('AUTH_SITE_URL_INVALID');
  }
  return parsed.origin;
}

export async function startOAuth(providerValue: string, nextValue?: string) {
  if (!isSupportedProvider(providerValue) || !isProviderEnabled(providerValue)) {
    redirect('/login?error=oauth_provider_unavailable');
  }

  const siteUrl = getAuthSiteUrl();
  const next = sanitizeNextPath(nextValue);
  // Social login has no "로그인 유지" choice, so it keeps the default
  // persistent session and clears any leftover session-only marker.
  const supabase = await createServerSupabaseClient({ sessionOnly: false });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: toSupabaseProvider(providerValue),
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect('/login?error=oauth_start_failed');
  }

  redirect(data.url);
}
