import 'server-only';
import { contractPlanSchema, type ContractPlanInput } from '@/features/contracts/schemas/contract';
import { toWorkspaceErrorCode, type WorkspaceErrorCode } from '@/features/workspace/domain/errors';

export type SavePlanRepository = {
  setOwnPlan(input: ContractPlanInput): Promise<{ data: string | null; error: unknown }>;
};

export type SavePlanResult =
  | { ok: true; stateId: string }
  | { ok: false; error: WorkspaceErrorCode };

export async function saveContractPlan(repository: SavePlanRepository, input: unknown): Promise<SavePlanResult> {
  const parsed = contractPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };
  try {
    const { data, error } = await repository.setOwnPlan(parsed.data);
    if (error) return { ok: false, error: toWorkspaceErrorCode(error) };
    if (!data) return { ok: false, error: 'server_error' };
    return { ok: true, stateId: data };
  } catch {
    return { ok: false, error: 'server_error' };
  }
}
