'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

const schema = z.object({
  homeId: z.uuid(),
  recordId: z.uuid(),
  to: z.enum(['landlord_review', 'scheduling', 'completed', 'receipt_attached']),
  method: z.enum(['app', 'phone_confirmed']),
  note: z.string().max(200),
});

export async function advanceRepairAction(formData: FormData) {
  const parsed = schema.safeParse({ homeId: formData.get('homeId'), recordId: formData.get('recordId'), to: formData.get('to'), method: formData.get('method'), note: formData.get('note') ?? '' });
  if (!parsed.success) redirect('/home');
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('advance_repair_stage', { p_record_id: parsed.data.recordId, p_to_stage: parsed.data.to, p_method: parsed.data.method, p_note: parsed.data.note || null });
  const code = error ? (['after_photo_required', 'receipt_required', 'permission_denied', 'conflict'].find((value) => error.message.includes(value)) ?? 'unknown') : null;
  redirect(`/homes/${parsed.data.homeId}/repairs/${parsed.data.recordId}${code ? `?error=${code}` : ''}`);
}
