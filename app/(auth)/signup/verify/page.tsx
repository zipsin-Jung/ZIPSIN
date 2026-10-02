import { redirect } from 'next/navigation';
import { VerificationForm } from '@/features/auth/components/VerificationForm';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function VerifySignupPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login?next=/signup/verify');

  return (
    <main className="min-h-screen bg-[#f8faf8] px-5 py-12 text-[#12362c]">
      <section className="mx-auto max-w-lg rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-emerald-700">가입 2단계</p>
        <h1 className="mt-2 text-3xl font-bold">연락처와 동의를 확인해 주세요</h1>
        <p className="mt-3 mb-8 leading-7 text-slate-600">집 주소와 계약 자료는 지금 받지 않습니다.</p>
        <VerificationForm
          displayName={data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? ''}
          email={data.user.email ?? ''}
        />
      </section>
    </main>
  );
}
