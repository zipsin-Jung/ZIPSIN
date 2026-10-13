'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

export type CreateRoomState = { error?: string; roomId?: string };
const uuid = z.uuid();

export async function createDirectRoomAction(formData: FormData): Promise<CreateRoomState> {
  const parsed = uuid.safeParse(formData.get('otherUserId'));
  if (!parsed.success) return { error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('create_direct_room', { p_other_user_id: parsed.data });
  if (error || !data) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  return { roomId: data };
}

export async function createGroupRoomAction(formData: FormData): Promise<CreateRoomState> {
  const parsed = z.object({ title: z.string().trim().min(1).max(80), memberIds: z.array(uuid).min(1).max(49) }).safeParse({
    title: formData.get('title'),
    memberIds: formData.getAll('memberId'),
  });
  if (!parsed.success || new Set(parsed.data.memberIds).size !== parsed.data.memberIds.length) return { error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('create_group_room', { p_title: parsed.data.title, p_member_ids: parsed.data.memberIds });
  if (error || !data) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  return { roomId: data };
}

export async function createRelationshipRoomAction(formData: FormData): Promise<void> {
  const parsed = z.object({
    roomType: z.enum(['office_internal', 'home_shared', 'repair_event']),
    officeId: uuid.optional(), homeId: uuid.optional(), contractId: uuid.optional(), relationshipId: uuid.optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/home');
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('create_relationship_room', {
    p_room_type: parsed.data.roomType,
    p_office_id: parsed.data.officeId ?? null,
    p_home_id: parsed.data.homeId ?? null,
    p_contract_id: parsed.data.contractId ?? null,
    p_relationship_id: parsed.data.relationshipId ?? null,
  });
  if (error || !data) redirect(`/home?error=${toWorkspaceErrorCode(error)}`);
  redirect(`/chats/${data}`);
}
