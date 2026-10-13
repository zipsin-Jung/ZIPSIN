'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

const inputSchema = z.object({ roomId: z.uuid(), userId: z.uuid() });

export async function inviteRoomMemberAction(formData: FormData): Promise<{ error?: string }> {
  const parsed = inputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('invite_chat_member', { p_room_id: parsed.data.roomId, p_user_id: parsed.data.userId });
  if (error) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  revalidatePath(`/chats/${parsed.data.roomId}`);
  return {};
}

export async function leaveRoomAction(formData: FormData): Promise<void> {
  const roomId = z.uuid().safeParse(formData.get('roomId'));
  if (!roomId.success) return;
  const { supabase } = await requireOnboardingComplete();
  await supabase.rpc('leave_chat_room', { p_room_id: roomId.data });
  revalidatePath('/chats');
}
