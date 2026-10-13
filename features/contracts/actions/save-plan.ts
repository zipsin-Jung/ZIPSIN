'use server';

import { revalidatePath } from 'next/cache';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { contractPlanSchema } from '@/features/contracts/schemas/contract';
import { saveContractPlan } from '@/features/contracts/services/save-plan';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';

export type ContractPlanState = { error?: string; saved?: boolean };

export async function saveContractPlanAction(formData: FormData): Promise<ContractPlanState> {
  const { supabase } = await requireOnboardingComplete();
  const parsed = contractPlanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: workspaceErrorMessage('invalid_input') };
  const result = await saveContractPlan({
    setOwnPlan: async (input) => {
      const { data, error } = await supabase.rpc('set_own_contract_plan', {
        p_contract_id: input.contractId,
        p_plan_status: input.planStatus,
      });
      return { data: data as string | null, error };
    },
  }, parsed.data);
  if (!result.ok) return { error: workspaceErrorMessage(result.error) };
  revalidatePath('/home');
  revalidatePath('/homes');
  return { saved: true };
}
