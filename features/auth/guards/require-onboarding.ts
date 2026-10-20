import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { isOnboardingComplete, type OnboardingProfile } from '@/features/auth/domain/profile';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Evaluation = OnboardingProfile & { hasSession: boolean };

export function evaluateOnboarding(state: Evaluation): string | null {
  if (!state.hasSession) return '/login';
  if (
    !state.phoneVerifiedAt ||
    !state.acceptedTermsVersion ||
    !state.acceptedPrivacyVersion
  ) return '/signup/verify';
  if (!state.usagePurpose) return '/onboarding/role';
  if (state.usagePurpose === 'broker' && !state.primaryRole) return '/onboarding/role';
  return isOnboardingComplete(state) ? null : '/signup/verify';
}

/* v8 ignore start -- Supabase/Next server boundary is verified by integration and browser gates. */
/** 요청 한 번 안에서 로그인 확인은 한 번만(바탕 화면과 각 화면이 같은 결과를 함께 쓴다). */
export const requireUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');
  return { supabase, user: data.user };
});

export const requireOnboardingComplete = cache(async () => {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: consents }, { data: role }] = await Promise.all([
    supabase.from('profiles').select('phone_verified_at, usage_purpose').eq('user_id', user.id).maybeSingle(),
    supabase.from('consent_acceptances').select('document_type, document_version, accepted').eq('user_id', user.id),
    supabase.from('user_roles').select('primary_role').eq('user_id', user.id).maybeSingle(),
  ]);
  const accepted = new Map(
    (consents ?? []).filter((item) => item.accepted).map((item) => [item.document_type, item.document_version]),
  );
  const destination = evaluateOnboarding({
    hasSession: true,
    phoneVerifiedAt: profile?.phone_verified_at ?? null,
    acceptedTermsVersion: accepted.get('terms') ?? null,
    acceptedPrivacyVersion: accepted.get('privacy') ?? null,
    usagePurpose: profile?.usage_purpose ?? null,
    primaryRole: role?.primary_role ?? null,
  });
  if (destination) redirect(destination);
  return { supabase, user, usagePurpose: profile!.usage_purpose, primaryRole: role?.primary_role ?? null };
});
/* v8 ignore stop */
