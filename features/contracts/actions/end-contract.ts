'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

export type EndActionState = { error?: string; done?: boolean };

/** 계약을 끝내면 그 계약의 임대인·임차인 접근과 남은 초대가 함께 끝납니다. 기록은 지우지 않습니다. */
export async function endContractAction(_previous: EndActionState, formData: FormData): Promise<EndActionState> {
  const parsed = z.object({ contractId: z.uuid(), homeId: z.uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: workspaceErrorMessage('invalid_input') };
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('end_active_contract', { p_contract_id: parsed.data.contractId });
  if (error) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  revalidatePath(`/homes/${parsed.data.homeId}`);
  revalidatePath(`/homes/${parsed.data.homeId}/people`);
  revalidatePath('/home');
  return { done: true };
}
