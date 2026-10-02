import 'server-only';
import { redirect } from 'next/navigation';
import { isOnboardingComplete, type OnboardingProfile } from '@/features/auth/domain/profile';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Evaluation = OnboardingProfile & { hasSession: boolean };

export function evaluateOnboarding(state: Evaluation): string | null {
  if (!state.hasSession) return '/login';
  if (
    !state.phoneVerifiedAt ||
    !state.acceptedTermsVersion ||
    !state.acceptedPrivacyVersion ||
    !state.confirmedAgeOver14
  ) return '/signup/verify';
  if (!state.primaryRole) return '/onboarding/role';
  return isOnboardingComplete(state) ? null : '/signup/verify';
}

/* v8 ignore start -- Supabase/Next server boundary is verified by integration and browser gates. */
export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');
  return { supabase, user: data.user };
}

export async function requireOnboardingComplete() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: consents }, { data: role }] = await Promise.all([
    supabase.from('profiles').select('phone_verified_at').eq('user_id', user.id).maybeSingle(),
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
    confirmedAgeOver14: accepted.has('age_over_14'),
    primaryRole: role?.primary_role ?? null,
  });
  if (destination) redirect(destination);
  return { user, primaryRole: role!.primary_role };
}
/* v8 ignore stop */
