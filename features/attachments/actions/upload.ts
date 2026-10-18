'use server';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { isVideoType, validateAttachmentSelection } from '@/features/attachments/domain/validation';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

const prepareSchema = z.object({ recordId: z.uuid(), name: z.string(), type: z.string(), size: z.coerce.number().int(), durationSeconds: z.number().positive().max(60).nullable().optional() });
export type PrepareUploadState = { ok: true; attachmentId: string; storagePath: string } | { ok: false; error: string };
export async function prepareAttachmentUploadAction(input: unknown): Promise<PrepareUploadState> {
  const parsed = prepareSchema.safeParse(input); if (!parsed.success) return { ok: false, error: workspaceErrorMessage('invalid_input') };
  const video = isVideoType(parsed.data.type);
  const validation = validateAttachmentSelection([{ name: parsed.data.name, type: parsed.data.type, size: parsed.data.size, ...(video ? { durationSeconds: parsed.data.durationSeconds ?? null } : {}) }]);
  if (!validation.ok) return { ok: false, error: validation.error };
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('prepare_attachment_upload', { p_record_id: parsed.data.recordId, p_original_name: parsed.data.name, p_media_type: parsed.data.type, p_byte_size: parsed.data.size, ...(video ? { p_duration_seconds: parsed.data.durationSeconds } : {}) });
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  const result = data as { attachmentId?: unknown; storagePath?: unknown };
  if (typeof result.attachmentId !== 'string' || typeof result.storagePath !== 'string') return { ok: false, error: workspaceErrorMessage('server_error') };
  return { ok: true, attachmentId: result.attachmentId, storagePath: result.storagePath };
}

export async function completeAttachmentUploadAction(attachmentId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!z.uuid().safeParse(attachmentId).success) return { ok: false, error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete(); const { error } = await supabase.rpc('complete_attachment_upload', { p_attachment_id: attachmentId, p_checksum_sha256: '' });
  return error ? { ok: false, error: workspaceErrorMessage(toWorkspaceErrorCode(error)) } : { ok: true };
}
