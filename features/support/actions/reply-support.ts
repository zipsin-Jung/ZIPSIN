'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

export async function openSupportConversationAction(): Promise<void> {
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('open_support_conversation');
  if (error || !data) redirect(`/support?error=${toWorkspaceErrorCode(error)}`);
  redirect(`/support?room=${data}`);
}

export async function replySupportAction(formData: FormData): Promise<{ error?: string }> {
  const parsed = z.object({ roomId: z.uuid(), body: z.string().trim().min(1).max(2000), idempotencyKey: z.uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('reply_as_zipsin_support', { p_room_id: parsed.data.roomId, p_body: parsed.data.body, p_idempotency_key: parsed.data.idempotencyKey });
  if (error) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  revalidatePath('/support'); revalidatePath('/support/inbox');
  return {};
}

export async function setSupportStatusAction(formData: FormData): Promise<void> {
  const parsed = z.object({ roomId: z.uuid(), status: z.enum(['waiting', 'answered', 'resolved']) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase } = await requireOnboardingComplete();
  await supabase.rpc('set_support_status', { p_room_id: parsed.data.roomId, p_status: parsed.data.status });
  revalidatePath('/support'); revalidatePath('/support/inbox');
}

export async function setSupportMuteAction(formData: FormData): Promise<void> {
  const parsed = z.object({ roomId: z.uuid(), muted: z.enum(['true', 'false']) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase } = await requireOnboardingComplete();
  await supabase.rpc('set_chat_notifications_muted', { p_room_id: parsed.data.roomId, p_muted: parsed.data.muted === 'true' });
  revalidatePath('/support');
}
