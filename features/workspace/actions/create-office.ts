'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

const officeSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export async function createOffice(formData: FormData) {
  const parsed = officeSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) redirect('/home?error=office-name');

  const { supabase, primaryRole } = await requireOnboardingComplete();
  if (primaryRole !== 'principal_broker') redirect('/home?error=office-role');

  const { error } = await supabase.rpc('create_office', { p_name: parsed.data.name });
  if (error) redirect('/home?error=office-create');
  redirect('/home?created=office');
}
