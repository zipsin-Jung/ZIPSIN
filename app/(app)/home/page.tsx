import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { createOffice } from '@/features/workspace/actions/create-office';
import { HomeStart } from '@/features/workspace/components/HomeStart';

export default async function HomePage() {
  const { supabase, primaryRole } = await requireOnboardingComplete();
  const { data: memberships } = await supabase
    .from('office_memberships')
    .select('office_id')
    .eq('status', 'active');
  const officeIds = memberships?.map((membership: { office_id: string }) => membership.office_id) ?? [];
  const { data: offices } = officeIds.length
    ? await supabase.from('offices').select('id, name').in('id', officeIds)
    : { data: [] };

  return <HomeStart createOfficeAction={createOffice} offices={offices ?? []} primaryRole={primaryRole} />;
}
