'use server';

import { redirect } from 'next/navigation';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { relationshipTokenSchema } from '@/features/relationships/schemas/invitation';
import { toWorkspaceErrorCode } from '@/features/workspace/domain/errors';

export async function acceptRelationshipInvitationAction(formData: FormData): Promise<void> {
  const parsed = relationshipTokenSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/home');
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('accept_relationship_invitation', { p_token: parsed.data.token });
  if (error) redirect(`/invitations/${parsed.data.token}?kind=relationship&error=${toWorkspaceErrorCode(error)}`);
  redirect('/home');
}
