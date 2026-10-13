'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

export async function reportMessageAction(formData: FormData): Promise<void> {
  const parsed = z.object({ roomId: z.uuid(), messageId: z.coerce.number().int().positive(), reason: z.enum(['spam', 'harassment', 'privacy', 'fraud', 'other']), detail: z.string().max(1000).optional().default('') }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('report_chat_message', { p_message_id: parsed.data.messageId, p_reason_code: parsed.data.reason, p_detail: parsed.data.detail });
  if (!error) revalidatePath(`/chats/${parsed.data.roomId}`);
}
