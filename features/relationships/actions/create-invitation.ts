'use server';

import { randomBytes } from 'node:crypto';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { relationshipInvitationSchema } from '@/features/relationships/schemas/invitation';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

export type RelationshipInvitationState = { error?: string; invitePath?: string };

export async function createRelationshipInvitationAction(formData: FormData): Promise<RelationshipInvitationState> {
  const raw = Object.fromEntries(formData);
  let relationshipExpiresAt: string | undefined;
  if (typeof raw.relationshipExpiresAt === 'string' && raw.relationshipExpiresAt) {
    const parsedDate = new Date(raw.relationshipExpiresAt);
    if (Number.isNaN(parsedDate.getTime())) return { error: workspaceErrorMessage('invalid_input') };
    relationshipExpiresAt = parsedDate.toISOString();
  }
  const parsed = relationshipInvitationSchema.safeParse({
    ...raw,
    contractId: raw.contractId || undefined,
    relationshipExpiresAt,
  });
  if (!parsed.success) return { error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc('create_relationship_invitation', {
    p_home_id: parsed.data.homeId,
    p_contract_id: parsed.data.contractId ?? null,
    p_role: parsed.data.role,
    p_scope: parsed.data.scope,
    p_token: token,
    p_expires_at: expiresAt,
    p_relationship_expires_at: parsed.data.relationshipExpiresAt ?? null,
  });
  if (error || !data) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  return { invitePath: `/invitations/${token}` };
}
