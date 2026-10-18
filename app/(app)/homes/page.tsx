import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { formatContractDay } from '@/features/contracts/domain/lifecycle';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';
import { HomeDirectory, type HomeFilter } from '@/features/homes/components/HomeDirectory';

type Props = { searchParams: Promise<{ office?: string; filter?: string }> };

export default async function HomesPage({ searchParams }: Props) {
  const { supabase, user } = await requireOnboardingComplete();
  const { office, filter } = await searchParams;
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

  // 만기·할 일 표시는 보조 정보다. 불러오지 못해도 집 목록은 보여 주고, 표시만 비워 둔다.
  const homeIds = (homes ?? []).map((home) => home.id);
  const [contractResult, taskResult] = homeIds.length
    ? await Promise.all([
      supabase.from('contracts').select('home_id, ends_on').in('home_id', homeIds).eq('status', 'active'),
      supabase.from('records').select('home_id, title, task_status, task_due_at').in('home_id', homeIds).eq('record_kind', 'task'),
    ])
    : [null, null];
  const endsOnByHome = new Map<string, string | null>();
  for (const row of (contractResult?.error ? [] : contractResult?.data ?? []) as Array<{ home_id: string; ends_on: string | null }>) endsOnByHome.set(row.home_id, row.ends_on);
  const taskByHome = new Map<string, string>();
  const tasks = ((taskResult?.error ? [] : taskResult?.data ?? []) as Array<{ home_id: string; title: string; task_status: string | null; task_due_at: string | null }>)
    .filter((task) => task.task_status !== 'done')
    .sort((a, b) => (a.task_due_at ?? '9999').localeCompare(b.task_due_at ?? '9999'));
  for (const task of tasks) if (!taskByHome.has(task.home_id)) taskByHome.set(task.home_id, task.title);

  const initialFilter: HomeFilter = filter === 'expiring' || filter === 'task' ? filter : 'all';
  return (
    <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
      <div className="flex items-center gap-1">
        <Link aria-label="홈으로" className="-ml-2 grid size-11 place-items-center rounded-xl text-[#16211E]" href="/home"><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <h1 className="flex-1 text-[22px] font-bold tracking-[-0.02em] text-[#16211E]">연결된 집 {homes?.length ? `${homes.length}채` : ''}</h1>
        {registrationOffice && <Link href={`/homes/new?office=${registrationOffice}`} className="app-primary inline-flex min-h-11 items-center rounded-xl px-4 text-[15px] font-bold text-white">+ 집 등록</Link>}
      </div>
      {homes?.length ? (
        <HomeDirectory
          initialFilter={initialFilter}
          homes={homes.map((home) => ({
            id: home.id,
            label: home.home_label ?? home.address_line1,
            address: `${home.address_line1}${home.address_detail ? ` · ${home.address_detail}` : ''}`,
            contractDay: formatContractDay(endsOnByHome.get(home.id) ?? null),
            openTaskTitle: taskByHome.get(home.id) ?? null,
          }))}
        />
      ) : (
        <section className="mt-6 rounded-[20px] border border-[#E1E6E3] bg-white p-8 text-center sm:p-12">
          <p className="text-lg font-bold text-[#16211E]">아직 연결된 집이 없습니다.</p>
          <p className="mt-2 text-[15px] text-[#5D6A65]">첫 집을 등록하면 그 집의 사진과 업무를 한곳에서 이어갈 수 있습니다.</p>
          {registrationOffice && <Link href={`/homes/new?office=${registrationOffice}`} className="app-primary mt-5 inline-flex min-h-14 items-center rounded-xl px-6 text-[17px] font-bold text-white">첫 집 등록하기</Link>}
        </section>
      )}
    </main>
  );
}

function ListError({ denied = false }: { denied?: boolean }) {
  return <main className="mx-auto max-w-5xl px-5 py-16"><p role="alert">{workspaceErrorMessage(denied ? 'permission_denied' : 'server_error')}</p><Link className="mt-5 inline-block font-semibold text-[#0B6655]" href="/homes">다시 시도하기</Link><Link className="ml-5 inline-block font-semibold text-[#0B6655]" href="/home">업무 홈으로</Link></main>;
}
