import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { createOffice } from '@/features/workspace/actions/create-office';
import { HomeStart } from '@/features/workspace/components/HomeStart';
import { loadHomeDashboardFromSupabase } from '@/features/workspace/services/home-dashboard';

const officeErrors: Record<string, string> = {
  'office-name': '사무소 이름을 2~100자로 적어 주세요.',
  'office-role': '대표 공인중개사 계정만 사무소를 만들 수 있어요.',
  'office-create': '사무소를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
};

type Props = { searchParams?: Promise<{ created?: string; error?: string; joined?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const { supabase, user, primaryRole } = await requireOnboardingComplete();
  const dashboard = await loadHomeDashboardFromSupabase(supabase, user.id);
  if (!dashboard.ok) return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">처리하지 못했습니다. 잠시 후 다시 시도해 주세요.</p></main>;
  const recentHomes = dashboard.homes.slice(0, 6).map((home) => ({
    id: home.id,
    label: home.label,
    address: home.address,
    contractDay: home.contractDay,
    openTask: home.openTask,
  }));
  const nextHome = dashboard.homes.find((home) => home.openTask);
  // 새 직원 첫 화면: 초대를 막 수락했을 때만 사무소 메모 5개를 불러온다(RLS가 볼 수 있는 기록만).
  let staffNotes: Array<{ id: string; homeId: string; title: string }> | null = null;
  if (params.joined === 'office' && dashboard.offices.length) {
    const { data, error } = await supabase.from('records').select('id, home_id, title').eq('record_kind', 'note').eq('record_space', 'office_internal').order('occurred_at', { ascending: false }).limit(5);
    staffNotes = error ? [] : (data ?? []).map((row) => ({ id: row.id, homeId: row.home_id, title: row.title }));
  }
  const task = nextHome?.openTask;
  return <HomeStart
    createOfficeAction={createOffice}
    offices={dashboard.offices}
    primaryRole={primaryRole}
    recentHomes={recentHomes}
    unreadChatCount={dashboard.unreadChatCount}
    counts={{
      totalHomes: dashboard.homes.length,
      expiringSoon: dashboard.homes.filter((home) => home.contractDay && home.contractDay.days >= 0 && home.contractDay.days <= 90).length,
      openTasks: dashboard.homes.filter((home) => home.openTask).length,
    }}
    justCreatedOffice={params.created === 'office'}
    staffNotes={staffNotes}
    officeError={params.error ? officeErrors[params.error] : undefined}
    nextTask={task && nextHome ? { id: task.id, homeId: nextHome.id, title: task.title, dueAt: task.dueAt } : null}
  />;
}
