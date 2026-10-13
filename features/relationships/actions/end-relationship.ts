'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

export async function endRelationshipAction(formData: FormData): Promise<void> {
  const parsed = z.object({ membershipId: z.uuid(), homeId: z.uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('end_home_relationship', { p_membership_id: parsed.data.membershipId });
  if (!error) revalidatePath(`/homes/${parsed.data.homeId}/people`);
}
