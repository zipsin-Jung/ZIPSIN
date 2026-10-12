import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { createOffice } from '@/features/workspace/actions/create-office';
import { HomeStart } from '@/features/workspace/components/HomeStart';

export default async function HomePage() {
  const { supabase, user, primaryRole } = await requireOnboardingComplete();
  const { data: memberships, error: membershipError } = await supabase
    .from('office_memberships')
    .select('office_id, office_role')
    .eq('user_id', user.id)
    .eq('status', 'active').is('ended_at', null).lte('started_at', new Date().toISOString());
  if (membershipError) return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">처리하지 못했습니다. 잠시 후 다시 시도해 주세요.</p></main>;
  const officeIds = memberships?.map((membership) => membership.office_id) ?? [];
  const { data: offices } = officeIds.length
    ? await supabase.from('offices').select('id, name').in('id', officeIds)
    : { data: [] };

  const summaries = (offices ?? []).map((office) => ({ ...office, canRegisterHome: memberships?.some((membership) => membership.office_id === office.id && membership.office_role === 'principal_broker') ?? false }));
  return <HomeStart createOfficeAction={createOffice} offices={summaries} primaryRole={primaryRole} />;
}
