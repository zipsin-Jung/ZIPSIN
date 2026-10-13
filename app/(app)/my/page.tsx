import Link from 'next/link';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

const roleLabels: Record<string, string> = {
  principal_broker: '대표 개업공인중개사',
  associate_broker: '소속공인중개사',
  assistant: '중개보조원',
  landlord: '임대인',
  tenant: '임차인',
};

export default async function MyPage() {
  const { supabase, user } = await requireOnboardingComplete();
  const [{ data: profile }, { data: role }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_roles').select('primary_role').eq('user_id', user.id).maybeSingle(),
  ]);
  const displayName = profile?.display_name?.trim() || '사용자';
  const roleLabel = role?.primary_role ? roleLabels[role.primary_role] ?? '집신 사용자' : '집신 사용자';

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
      <p className="text-sm font-bold text-[#0b695c]">마이</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#102a43]">
        {displayName}님의 집신
      </h1>
      <section className="app-panel mt-8 rounded-[28px] p-7">
        <p className="text-sm text-[#607785]">현재 역할</p>
        <p className="mt-2 text-xl font-extrabold text-[#102a43]">{roleLabel}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="app-primary rounded-2xl px-5 py-3 text-sm font-bold text-white" href="/homes">
            내 집 보기
          </Link>
          <Link className="rounded-2xl border border-[#cddbd9] px-5 py-3 text-sm font-bold text-[#0b695c]" href="/home">
            홈으로
          </Link>
        </div>
      </section>
    </main>
  );
}
