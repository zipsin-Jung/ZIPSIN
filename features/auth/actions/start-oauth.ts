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

export async function startOAuth(providerValue: string, nextValue?: string) {
  if (!isSupportedProvider(providerValue) || !isProviderEnabled(providerValue)) {
    redirect('/login?error=oauth_provider_unavailable');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const next = sanitizeNextPath(nextValue);
  const supabase = await createServerSupabaseClient();
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
