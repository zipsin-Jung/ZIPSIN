import Link from 'next/link';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';
import { HomeDirectory } from '@/features/homes/components/HomeDirectory';

export default async function HomesPage({ searchParams }: { searchParams: Promise<{ office?: string }> }) {
  const { supabase, user } = await requireOnboardingComplete();
  const { office } = await searchParams;
  if (office && !z.uuid().safeParse(office).success) return <ListError denied />;
  let query = supabase.from('homes').select('id, home_label, address_line1, address_detail').eq('status', 'active');
  if (office) query = query.eq('office_id', office);
  const { data: homes, error } = await query.order('created_at', { ascending: false });
  if (error) return <ListError />;
  let membershipQuery = supabase.from('office_memberships').select('office_id, office_role')
    .eq('user_id', user.id).eq('status', 'active').is('ended_at', null).lte('started_at', new Date().toISOString());
  if (office) membershipQuery = membershipQuery.eq('office_id', office);
  const { data: membership } = await membershipQuery.order('created_at').limit(1).maybeSingle();
  const registrationOffice = membership?.office_role === 'principal_broker' ? (office ?? membership.office_id) : null;
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
      <Link href="/home" className="text-sm font-bold text-[#0b695c]">← 홈으로</Link>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-bold text-[#0b695c]">집마다 이어지는 기록</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-[#102a43]">내가 연결된 집</h1></div>
        {registrationOffice && <Link href={`/homes/new?office=${registrationOffice}`} className="app-primary rounded-2xl px-5 py-4 font-bold text-white transition">집 등록하기</Link>}
      </div>
      {homes?.length ? <HomeDirectory homes={homes.map((home) => ({ id: home.id, label: home.home_label ?? home.address_line1, address: `${home.address_line1}${home.address_detail ? ` · ${home.address_detail}` : ''}` }))} /> : <section className="app-panel mt-8 rounded-[28px] p-8 text-center sm:p-12"><p className="text-lg font-bold text-[#244657]">아직 연결된 집이 없습니다.</p><p className="mt-2 text-sm text-[#607785]">첫 집을 등록하면 그 집의 사진과 업무를 한곳에서 이어갈 수 있습니다.</p></section>}
    </main>
  );
}

function ListError({ denied = false }: { denied?: boolean }) {
  return <main className="mx-auto max-w-5xl px-5 py-16"><p role="alert">{workspaceErrorMessage(denied ? 'permission_denied' : 'server_error')}</p><Link className="mt-5 inline-block font-semibold text-emerald-900" href="/homes">다시 시도하기</Link><Link className="ml-5 inline-block font-semibold text-emerald-900" href="/home">업무 홈으로</Link></main>;
}
