'use server';
import { randomBytes } from 'node:crypto';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { createOfficeInvitation } from '@/features/invitations/services/office-invitation';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';

export type InvitationFormState = { error?: string; invitePath?: string; invitationId?: string };
export async function createOfficeInvitationAction(formData: FormData): Promise<InvitationFormState> {
  const { supabase } = await requireOnboardingComplete();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const result = await createOfficeInvitation({ create: async (input) => await supabase.rpc('create_office_invitation', {
    p_office_id: input.officeId, p_role: input.role, p_token: input.token, p_expires_at: input.expiresAt,
  }) }, Object.fromEntries(formData), token, expiresAt);
  return result.ok ? { invitePath: `/invitations/${token}`, invitationId: result.invitationId } : { error: workspaceErrorMessage(result.error) };
}

export async function revokeOfficeInvitationAction(invitationId: string): Promise<InvitationFormState> {
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('revoke_office_invitation', { p_invitation_id: invitationId });
  return error ? { error: workspaceErrorMessage('server_error') } : {};
}
