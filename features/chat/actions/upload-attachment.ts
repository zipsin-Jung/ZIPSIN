'use server';

import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

const inputSchema = z.object({
  roomId: z.uuid(), messageId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  type: z.enum(['image/jpeg', 'image/png', 'image/heic', 'application/pdf']),
  size: z.number().int().positive().max(20 * 1024 * 1024),
});
export type ChatUploadPreparation = { ok: true; attachmentId: string; storagePath: string } | { ok: false; error: string };

export async function prepareChatAttachmentAction(input: unknown): Promise<ChatUploadPreparation> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('prepare_chat_attachment_upload', {
    p_room_id: parsed.data.roomId, p_message_id: parsed.data.messageId,
    p_original_name: parsed.data.name, p_media_type: parsed.data.type, p_byte_size: parsed.data.size,
  });
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  const result = data as { attachmentId?: unknown; storagePath?: unknown };
  return typeof result.attachmentId === 'string' && typeof result.storagePath === 'string'
    ? { ok: true, attachmentId: result.attachmentId, storagePath: result.storagePath }
    : { ok: false, error: workspaceErrorMessage('server_error') };
}

export async function completeChatAttachmentAction(attachmentId: string): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(attachmentId).success) return { ok: false };
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('complete_chat_attachment_upload', { p_attachment_id: attachmentId });
  return { ok: !error };
}

export async function failChatAttachmentAction(attachmentId: string): Promise<void> {
  if (!z.uuid().safeParse(attachmentId).success) return;
  const { supabase } = await requireOnboardingComplete();
  await supabase.rpc('fail_chat_attachment_upload', { p_attachment_id: attachmentId });
}
