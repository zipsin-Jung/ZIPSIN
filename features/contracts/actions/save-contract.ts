'use server';

import { revalidatePath } from 'next/cache';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { contractSchema } from '@/features/contracts/schemas/contract';
import { saveContract } from '@/features/contracts/services/save-contract';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';

export type ContractFormState = { error?: string; fieldErrors?: Record<string, string>; saved?: boolean };

export async function saveContractAction(formData: FormData): Promise<ContractFormState> {
  const { supabase } = await requireOnboardingComplete();
  const raw = Object.fromEntries(formData);
  const parsed = contractSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])) };
  const result = await saveContract({
    upsert: async (input) => {
      const { data, error } = await supabase.rpc('upsert_active_contract_for_home', {
        p_home_id: input.homeId,
        p_contract_kind: input.contractKind,
        p_starts_on: input.startsOn || null,
        p_ends_on: input.endsOn || null,
        p_idempotency_key: input.idempotencyKey,
      });
      return { data: data as string | null, error };
    },
  }, parsed.data);
  if (!result.ok) return { error: workspaceErrorMessage(result.error) };
  revalidatePath(`/homes/${parsed.data.homeId}`);
  revalidatePath('/home');
  return { saved: true };
}
