import 'server-only';
import { contractSchema, type ContractInput } from '@/features/contracts/schemas/contract';
import { toWorkspaceErrorCode, type WorkspaceErrorCode } from '@/features/workspace/domain/errors';

export type SaveContractRepository = {
  upsert(input: ContractInput): Promise<{ data: string | null; error: unknown }>;
};

export type SaveContractResult =
  | { ok: true; contractId: string }
  | { ok: false; error: WorkspaceErrorCode };

export async function saveContract(repository: SaveContractRepository, input: unknown): Promise<SaveContractResult> {
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };
  try {
    const { data, error } = await repository.upsert(parsed.data);
    if (error) return { ok: false, error: toWorkspaceErrorCode(error) };
    if (!data) return { ok: false, error: 'server_error' };
    return { ok: true, contractId: data };
  } catch {
    return { ok: false, error: 'server_error' };
  }
}
