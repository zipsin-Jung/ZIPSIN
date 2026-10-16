import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { AuthCard, authPrimaryButtonClass } from '@/features/auth/components/AuthCard';
import { maskEmail } from '@/features/auth/domain/mask';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = { searchParams: Promise<{ next?: string }> };

// 2026-10-16 승인 시안 ⑦: 가입 완료 → 바로 시작(이메일 확인 없음).
export default async function SignupCompletePage({ searchParams }: Props) {
  const params = await searchParams;
  const next = sanitizeNextPath(params.next);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const { data: mapping } = await createAdminSupabaseClient()
    .from('account_usernames').select('username_normalized').eq('user_id', data.user.id).maybeSingle();

  return (
    <AuthCard showLogo={false} title="가입이 끝났어요" titleId="signup-done-title">
      <div aria-hidden="true" className="-order-1 grid size-14 place-items-center rounded-2xl bg-[#EAF2EF]">
        <Check className="size-7 text-[#0B6655]" strokeWidth={2.2} />
      </div>
      <p className="-mt-3 text-base leading-[1.7] text-[#3E4B47]">
        {mapping?.username_normalized
          ? <>이제 아이디 <strong className="text-[#16211E]">{mapping.username_normalized}</strong>로 휴대전화와 PC 어디서나 로그인할 수 있어요.</>
          : '이제 휴대전화와 PC 어디서나 로그인할 수 있어요.'}
      </p>
      {data.user.email && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-[#F6F7F5] p-4">
          <p className="text-sm font-semibold text-[#3E4B47]">아이디 찾기용 이메일</p>
          <p className="text-base font-semibold">{maskEmail(data.user.email)}</p>
          <p className="text-sm leading-relaxed text-[#5D6A65]">아이디를 잊으면 이 이메일로 찾을 수 있어요. 비밀번호는 이름과 휴대폰 인증으로 다시 만들어요.</p>
        </div>
      )}
      <Link className={authPrimaryButtonClass} href={next}>집신 시작하기</Link>
    </AuthCard>
  );
}
