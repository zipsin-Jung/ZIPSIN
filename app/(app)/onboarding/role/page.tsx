import { redirect } from 'next/navigation';
import { RolePicker } from '@/features/auth/components/RolePicker';
import { requireUser } from '@/features/auth/guards/require-onboarding';

export default async function RoleOnboardingPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: role }] = await Promise.all([
    supabase.from('profiles').select('phone_verified_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_roles').select('primary_role').eq('user_id', user.id).maybeSingle(),
  ]);
  if (!profile?.phone_verified_at) redirect('/signup/verify');
  if (role?.primary_role) redirect('/home');

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm font-semibold text-emerald-700">가입 3단계</p>
      <h1 className="mt-2 text-3xl font-bold">어떤 역할로 시작할까요?</h1>
      <p className="mt-3 mb-8 text-slate-600">역할을 골라도 다른 사람의 집이나 사무소 기록이 자동으로 열리지 않습니다.</p>
      <RolePicker />
    </main>
  );
}
