import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { createOffice } from '@/features/workspace/actions/create-office';
import { HomeStart } from '@/features/workspace/components/HomeStart';
import { cookies } from 'next/headers';
import { loadHomeDashboardFromSupabase } from '@/features/workspace/services/home-dashboard';
import { SPACE_COOKIE, pickSpace } from '@/features/workspace/domain/space';
import { loadHomeCoverPhotos, loadSpaceContext } from '@/features/workspace/services/spaces';

const relationLabels = { tenant: '사는 집', landlord: '세 준 집' } as const;

const officeErrors: Record<string, string> = {
  'office-name': '사무소 이름을 2~100자로 적어 주세요.',
  'office-role': '대표 공인중개사 계정만 사무소를 만들 수 있어요.',
  'office-create': '사무소를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
};

type Props = { searchParams?: Promise<{ created?: string; error?: string; joined?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const { supabase, user, primaryRole } = await requireOnboardingComplete();
  const [dashboard, context] = await Promise.all([loadHomeDashboardFromSupabase(supabase, user.id), loadSpaceContext(supabase, user.id)]);
  if (!dashboard.ok) return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">처리하지 못했습니다. 잠시 후 다시 시도해 주세요.</p></main>;
  // 공간(DEC-038): 개인 = 내가 임대인·임차인으로 직접 연결된 집, 사무소 = 그 사무소에 등록된 집. 볼 수 있는지는 RLS가 이미 정했다.
  const space = pickSpace((await cookies()).get(SPACE_COOKIE)?.value, context.offices, context.personalHomes.length);
  const relationByHome = new Map(context.personalHomes.map((item) => [item.homeId, item.relation]));
  const spaceHomes = dashboard.homes.filter((home) => space.kind === 'me' ? relationByHome.has(home.id) : home.officeId === space.office.id);
  const shown = spaceHomes.slice(0, 6);
  const covers = await loadHomeCoverPhotos(supabase, shown.map((home) => home.id));
  const recentHomes = shown.map((home) => {
    const relation = relationByHome.get(home.id);
    return {
      id: home.id,
      label: home.label,
      address: home.address,
      contractDay: home.contractDay,
      openTask: home.openTask,
      photoUrl: covers.get(home.id) ?? null,
      relation: space.kind === 'me' && relation ? relationLabels[relation] : undefined,
    };
  });
  const nextHome = spaceHomes.find((home) => home.openTask);
  // 최근 기록 칸 숫자와 이번 달 일정: 이 공간 집의 실제 기록에서만 센다(RLS가 허락한 것만).
  const spaceHomeIds = spaceHomes.map((home) => home.id);
  const { data: recordRows } = spaceHomeIds.length
    ? await supabase.from('records').select('id, home_id, record_kind, repair_stage, title, task_status, task_due_at').in('home_id', spaceHomeIds).limit(1000)
    : { data: [] as Array<{ id: string; home_id: string; record_kind: string; repair_stage: string | null; title: string; task_status: string | null; task_due_at: string | null }> };
  const rows = recordRows ?? [];
  const recordCounts = {
    photo: rows.filter((row) => row.record_kind === 'photo').length,
    document: rows.filter((row) => row.record_kind === 'document').length,
    receipt: rows.filter((row) => row.record_kind === 'repair' && row.repair_stage === 'receipt_attached').length,
    note: rows.filter((row) => row.record_kind === 'note').length,
    repair: rows.filter((row) => row.record_kind === 'repair').length,
  };
  const month = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 7);
  const monthOf = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 7);
  const labelOf = new Map(spaceHomes.map((home) => [home.id, home.label]));
  const events = [
    ...rows.filter((row) => row.task_due_at && row.task_status !== 'done' && monthOf(row.task_due_at) === month)
      .map((row) => ({ id: row.id, homeId: row.home_id, date: row.task_due_at as string, title: row.title, homeLabel: labelOf.get(row.home_id) ?? '' })),
    ...spaceHomes.filter((home) => home.endsOn && home.endsOn.slice(0, 7) === month)
      .map((home) => ({ id: `end-${home.id}`, homeId: home.id, date: `${home.endsOn}T00:00:00+09:00`, title: '계약 만기', homeLabel: home.label })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  // 새 직원 첫 화면: 초대를 막 수락했을 때만 사무소 메모 5개를 불러온다(RLS가 볼 수 있는 기록만).
  let staffNotes: Array<{ id: string; homeId: string; title: string }> | null = null;
  if (params.joined === 'office' && space.kind === 'office') {
    const { data, error } = await supabase.from('records').select('id, home_id, title').eq('record_kind', 'note').eq('record_space', 'office_internal').order('occurred_at', { ascending: false }).limit(5);
    staffNotes = error ? [] : (data ?? []).map((row) => ({ id: row.id, homeId: row.home_id, title: row.title }));
  }
  const task = nextHome?.openTask;
  return <HomeStart
    createOfficeAction={createOffice}
    offices={space.kind === 'office' ? [space.office, ...dashboard.offices.filter((office) => office.id !== space.office.id)] : dashboard.offices}
    spaceKind={space.kind}
    events={events}
    recordCounts={recordCounts}
    primaryRole={primaryRole}
    recentHomes={recentHomes}
    unreadChatCount={dashboard.unreadChatCount}
    counts={{
      totalHomes: spaceHomes.length,
      expiringSoon: spaceHomes.filter((home) => home.contractDay && home.contractDay.days >= 0 && home.contractDay.days <= 90).length,
      openTasks: spaceHomes.filter((home) => home.openTask).length,
    }}
    justCreatedOffice={params.created === 'office'}
    staffNotes={staffNotes}
    officeError={params.error ? officeErrors[params.error] : undefined}
    nextTask={task && nextHome ? { id: task.id, homeId: nextHome.id, title: task.title, dueAt: task.dueAt } : null}
  />;
}
