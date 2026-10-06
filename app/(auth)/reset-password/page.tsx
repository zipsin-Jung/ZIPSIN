import { redirect } from 'next/navigation';
import { updatePasswordAction } from '@/features/auth/actions/update-password';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login?error=recovery_expired');

  const admin = createAdminSupabaseClient();
  const { data: mapping } = await admin.from('account_usernames')
    .select('username_normalized')
    .eq('user_id', data.user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-10 text-[#12362c]">
      <section className="mx-auto max-w-lg rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <h1 className="text-3xl font-black">계정 확인</h1>
        {mapping && <p className="mt-4 rounded-xl bg-emerald-50 p-4">회원님의 아이디는 <strong>{mapping.username_normalized}</strong>입니다.</p>}
        <p className="mt-4 mb-7 text-slate-600">새 비밀번호를 설정하면 기존 복구 세션은 종료됩니다.</p>
        {params.error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-800" role="alert">비밀번호를 확인하거나 새 링크를 요청해 주세요.</p>}
        <form action={updatePasswordAction} className="grid gap-5">
          <label className="font-bold">새 비밀번호<input className="mt-2 min-h-13 w-full rounded-xl border border-slate-300 px-4" name="password" type="password" minLength={8} maxLength={128} required /></label>
          <label className="font-bold">새 비밀번호 확인<input className="mt-2 min-h-13 w-full rounded-xl border border-slate-300 px-4" name="passwordConfirm" type="password" minLength={8} maxLength={128} required /></label>
          <button className="min-h-13 rounded-xl bg-[#0b543f] px-5 font-extrabold text-white" type="submit">비밀번호 변경</button>
        </form>
      </section>
    </main>
  );
}
