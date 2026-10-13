'use server';

import { revalidatePath } from 'next/cache';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { chatMessageSchema, chatReadSchema } from '@/features/chat/schemas/message';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

export type ChatActionState = { error?: string; messageId?: number };

export async function sendMessageAction(formData: FormData): Promise<ChatActionState> {
  const parsed = chatMessageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('send_chat_message', {
    p_room_id: parsed.data.roomId,
    p_body: parsed.data.body,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error || !data) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  revalidatePath(`/chats/${parsed.data.roomId}`);
  return { messageId: data };
}

export async function markChatReadAction(formData: FormData): Promise<void> {
  const parsed = chatReadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase } = await requireOnboardingComplete();
  await supabase.rpc('mark_chat_read', {
    p_room_id: parsed.data.roomId,
    p_last_read_message_id: parsed.data.lastReadMessageId,
  });
}
