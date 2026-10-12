'use server';
import { redirect } from 'next/navigation';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { invitationTokenSchema } from '@/features/invitations/schemas/invitation';
import { toWorkspaceErrorCode } from '@/features/workspace/domain/errors';

export async function acceptOfficeInvitationAction(formData: FormData): Promise<void> {
  const { supabase } = await requireOnboardingComplete();
  const parsed = invitationTokenSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/home');
  const { error } = await supabase.rpc('accept_office_invitation', { p_token: parsed.data.token });
  if (error) redirect(`/invitations/${parsed.data.token}?error=${toWorkspaceErrorCode(error)}`);
  redirect('/home');
}
