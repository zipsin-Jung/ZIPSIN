'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

const assignSchema = z.object({ officeId: z.uuid(), homeId: z.uuid(), userId: z.uuid() });
export async function assignOfficeMemberAction(formData: FormData): Promise<void> {
  const { supabase } = await requireOnboardingComplete();
  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(workspaceErrorMessage('invalid_input'));
  const { error } = await supabase.rpc('assign_office_member_to_home', {
    p_office_id: parsed.data.officeId, p_home_id: parsed.data.homeId, p_user_id: parsed.data.userId,
  });
  if (error) throw new Error(workspaceErrorMessage(toWorkspaceErrorCode(error)));
  revalidatePath(`/homes/${parsed.data.homeId}/assignees`);
}

export async function endOfficeAssignmentAction(formData: FormData): Promise<void> {
  const { supabase } = await requireOnboardingComplete();
  const assignmentId = z.uuid().safeParse(formData.get('assignmentId'));
  const homeId = z.uuid().safeParse(formData.get('homeId'));
  if (!assignmentId.success || !homeId.success) throw new Error(workspaceErrorMessage('invalid_input'));
  const { error } = await supabase.rpc('end_office_home_assignment', { p_assignment_id: assignmentId.data });
  if (error) throw new Error(workspaceErrorMessage(toWorkspaceErrorCode(error)));
  revalidatePath(`/homes/${homeId.data}/assignees`);
}
