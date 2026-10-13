import { redirect } from 'next/navigation';
import { PurposePicker } from '@/features/auth/components/PurposePicker';
import { isOnboardingComplete } from '@/features/auth/domain/profile';
import { requireUser } from '@/features/auth/guards/require-onboarding';

export default async function RoleOnboardingPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: role }] = await Promise.all([
    supabase.from('profiles').select('phone_verified_at, usage_purpose').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_roles').select('primary_role').eq('user_id', user.id).maybeSingle(),
  ]);
  if (!profile?.phone_verified_at) redirect('/signup/verify');
  if (isOnboardingComplete({
    phoneVerifiedAt: profile?.phone_verified_at ?? null,
    acceptedTermsVersion: 'verified-upstream',
    acceptedPrivacyVersion: 'verified-upstream',
    confirmedAgeOver14: true,
    usagePurpose: profile?.usage_purpose ?? null,
    primaryRole: role?.primary_role ?? null,
  })) redirect('/home');

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm font-semibold text-emerald-700">가입 3단계</p>
      <h1 className="mt-2 text-3xl font-bold">집신을 주로 어떻게 사용하시나요?</h1>
      <p className="mt-3 mb-8 text-slate-600">지금 고른 목적에 맞춰 첫 화면과 안내 순서를 보여드릴게요.</p>
      <PurposePicker />
    </main>
  );
}
