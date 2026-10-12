import 'server-only';
import { homeSchema, type HomeInput } from '@/features/homes/schemas/home';
import { toWorkspaceErrorCode, type WorkspaceErrorCode } from '@/features/workspace/domain/errors';

export type CreateHomeRepository = {
  create(input: HomeInput): Promise<{ data: string | null; error: unknown }>;
};
export type CreateHomeResult = { ok: true; homeId: string } | { ok: false; error: WorkspaceErrorCode };
export async function createHome(repository: CreateHomeRepository, input: unknown): Promise<CreateHomeResult> {
  const parsed = homeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };
  try {
    const { data, error } = await repository.create(parsed.data);
    if (error) return { ok: false, error: toWorkspaceErrorCode(error) };
    if (!data) return { ok: false, error: 'server_error' };
    return { ok: true, homeId: data };
  } catch { return { ok: false, error: 'server_error' }; }
}
