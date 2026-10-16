import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { updatePasswordAction } from '@/features/auth/actions/update-password';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { NewPasswordFields } from '@/features/auth/components/NewPasswordFields';
import { digestRecoveryToken, RECOVERY_COOKIE } from '@/features/auth/server/recovery-session';
import { maskPhone } from '@/features/auth/schemas/verification';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = { searchParams: Promise<{ error?: string }> };

// 2026-10-16 승인 시안 ⑨-B: 휴대폰 인증을 마친 뒤 새 비밀번호 만들기.
export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const recoveryToken = (await cookies()).get(RECOVERY_COOKIE)?.value;
  if (!data.user && !recoveryToken) redirect('/login?error=recovery_expired');

  const admin = createAdminSupabaseClient();
  let userId = data.user?.id ?? null;
  if (!userId && recoveryToken) {
    const { data: session } = await admin.from('account_recovery_sessions')
      .select('user_id, expires_at, consumed_at').eq('token_digest', digestRecoveryToken(recoveryToken)).maybeSingle();
    if (!session || session.consumed_at || new Date(session.expires_at).getTime() <= Date.now()) redirect('/login?error=recovery_expired');
    userId = session.user_id;
  }
  const mapping = userId ? (await admin.from('account_usernames')
    .select('username_normalized').eq('user_id', userId).maybeSingle()).data : null;
  const profile = userId ? (await admin.from('profiles')
    .select('display_name, phone_e164').eq('user_id', userId).maybeSingle()).data : null;
  const verifiedWho = [
    mapping?.username_normalized,
    profile?.display_name ? `${profile.display_name} 님` : null,
    profile?.phone_e164 ? maskPhone(profile.phone_e164) : null,
  ].filter(Boolean).join(' · ');

  return (
    <AuthCard notice="10분 안에 바꾸지 않으면 다시 인증해야 해요." title="새 비밀번호 만들기" titleId="reset-title">
      <div className="-order-1 flex items-center gap-2 rounded-xl bg-[#EAF2EF] px-3.5 py-3 text-[15px] font-semibold text-[#0B6655]" role="status">
        <CircleCheck aria-hidden="true" className="size-[18px]" />
        {verifiedWho ? `${verifiedWho} 확인됨` : '본인 확인이 끝났어요'}
      </div>
      {mapping && <p className="-mt-3 text-[15px] text-[#3E4B47]">아이디 <strong className="text-[#16211E]">{mapping.username_normalized}</strong>의 비밀번호를 새로 정해요.</p>}
      {params.error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E8B4AE] bg-[#FDF3F2] p-4 text-[15px] text-[#8C1D18]" role="alert">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>{params.error === 'invalid_password' ? '비밀번호 조건과 확인 칸을 다시 확인해 주세요.' : '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'}</p>
        </div>
      )}
      <form action={updatePasswordAction} className="flex flex-col gap-[18px]">
        <NewPasswordFields />
      </form>
    </AuthCard>
  );
}
