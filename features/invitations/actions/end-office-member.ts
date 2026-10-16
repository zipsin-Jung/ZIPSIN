'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import type { EndActionState } from '@/features/contracts/actions/end-contract';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

/** 퇴사한 구성원의 사무소 접근을 끝냅니다. 사무소 업무 기록은 남습니다. */
export async function endOfficeMemberAction(_previous: EndActionState, formData: FormData): Promise<EndActionState> {
  const parsed = z.object({ membershipId: z.uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('end_office_membership', { p_membership_id: parsed.data.membershipId });
  if (error) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  revalidatePath('/office/members');
  return { done: true };
}
