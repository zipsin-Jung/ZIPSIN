import Link from 'next/link';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { logoutAction } from '@/features/auth/actions/logout';

const roleLabels: Record<string, string> = {
  principal_broker: '대표 개업공인중개사',
  associate_broker: '소속공인중개사',
  assistant: '중개보조원',
  landlord: '임대인',
  tenant: '임차인',
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function MyPage({ searchParams }: Props) {
  const params = await searchParams;
  const { supabase, user } = await requireOnboardingComplete();
  const [{ data: profile }, { data: role }] = await Promise.all([
    supabase.from('profiles').select('display_name, usage_purpose').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_roles').select('primary_role').eq('user_id', user.id).maybeSingle(),
  ]);
  const displayName = profile?.display_name?.trim() || '사용자';
  const roleLabel = role?.primary_role ? roleLabels[role.primary_role] ?? '집신 사용자' : '집신 사용자';

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
      <p className="text-sm font-bold text-[#0B6655]">마이</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#16211E]">
        {displayName}님의 집신
      </h1>
      {params.error === 'logout_failed' && <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-800" role="alert">로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
      <section className="app-panel mt-8 rounded-[28px] p-7">
        <p className="text-sm text-[#5D6A65]">현재 사용 목적과 역할</p>
        <p className="mt-2 text-xl font-extrabold text-[#16211E]">{roleLabel}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="app-primary rounded-2xl px-5 py-3 text-sm font-bold text-white" href="/homes">
            내 집 보기
          </Link>
          <Link className="rounded-2xl border border-[#E1E6E3] px-5 py-3 text-sm font-bold text-[#0B6655]" href="/home">
            홈으로
          </Link>
        </div>
        <nav aria-label="업무와 도움" className="mt-8 border-t border-[#E1E6E3] pt-4">
          <ul className="grid">
            <li><Link className="flex min-h-14 items-center justify-between border-b border-[#E1E6E3] text-base font-semibold" href="/tasks">할 일<span aria-hidden="true">›</span></Link></li>
            <li><Link className="flex min-h-14 items-center justify-between text-base font-semibold" href="/support">고객지원 채팅<span aria-hidden="true">›</span></Link></li>
          </ul>
        </nav>
        <form action={logoutAction} className="mt-4 border-t border-[#E1E6E3] pt-6">
          <button className="min-h-12 rounded-2xl border border-red-200 px-5 py-3 text-sm font-bold text-red-700" type="submit">로그아웃</button>
          <p className="mt-2 text-xs leading-5 text-[#5D6A65]">공용 PC에서는 작업을 마친 뒤 반드시 로그아웃해 주세요.</p>
        </form>
      </section>
    </main>
  );
}
