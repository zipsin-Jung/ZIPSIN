'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { toWorkspaceErrorCode } from '@/features/workspace/domain/errors';

export async function blockDirectUserAction(formData: FormData): Promise<void> {
  const parsed = z.object({ roomId: z.uuid(), otherUserId: z.uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/chats');
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('block_direct_user', { p_other_user_id: parsed.data.otherUserId });
  if (error) redirect(`/chats/${parsed.data.roomId}?error=${toWorkspaceErrorCode(error)}`);
  redirect('/chats');
}
