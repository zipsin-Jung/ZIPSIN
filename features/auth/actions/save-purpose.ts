'use server';

import { redirect } from 'next/navigation';
import { parseUsageSelection, type BrokerRole, type UsagePurpose } from '@/features/auth/domain/purpose';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function saveUsagePurpose(value: { purpose: UsagePurpose; brokerRole: BrokerRole | null }) {
  let selection;
  try {
    selection = parseUsageSelection(value);
  } catch {
    return { ok: false as const, error: 'invalid_selection' as const };
  }
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const { error } = await supabase.rpc('complete_usage_onboarding', {
    p_usage_purpose: selection.usagePurpose,
    p_primary_role: selection.primaryRole,
  });
  if (error) return { ok: false as const, error: 'save_failed' as const };
  redirect('/home');
}
