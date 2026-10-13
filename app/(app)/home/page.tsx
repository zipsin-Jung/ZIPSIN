import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { createOffice } from '@/features/workspace/actions/create-office';
import { HomeStart } from '@/features/workspace/components/HomeStart';
import { loadHomeDashboardFromSupabase } from '@/features/workspace/services/home-dashboard';

export default async function HomePage() {
  const { supabase, user, primaryRole } = await requireOnboardingComplete();
  const dashboard = await loadHomeDashboardFromSupabase(supabase, user.id);
  if (!dashboard.ok) return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">처리하지 못했습니다. 잠시 후 다시 시도해 주세요.</p></main>;
  const recentHomes = dashboard.homes.slice(0, 3).map((home) => ({ id: home.id, label: home.label, address: home.address }));
  const nextHome = dashboard.homes.find((home) => home.openTask);
  const task = nextHome?.openTask;
  return <HomeStart
    createOfficeAction={createOffice}
    offices={dashboard.offices}
    primaryRole={primaryRole}
    recentHomes={recentHomes}
    unreadChatCount={dashboard.unreadChatCount}
    nextTask={task && nextHome ? { id: task.id, homeId: nextHome.id, title: task.title, dueAt: task.dueAt } : null}
  />;
}
