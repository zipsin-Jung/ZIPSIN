import 'server-only';
import { officeInvitationSchema } from '@/features/invitations/schemas/invitation';
import { toWorkspaceErrorCode, type WorkspaceErrorCode } from '@/features/workspace/domain/errors';

export type InvitationResult = { ok: true; invitationId: string } | { ok: false; error: WorkspaceErrorCode };
export async function createOfficeInvitation(
  repository: { create(input: { officeId: string; role: string; token: string; expiresAt: string }): Promise<{ data: string | null; error: unknown }> },
  input: unknown,
  token: string,
  expiresAt: string,
): Promise<InvitationResult> {
  const parsed = officeInvitationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };
  try {
    const { data, error } = await repository.create({ ...parsed.data, token, expiresAt });
    if (error) return { ok: false, error: toWorkspaceErrorCode(error) };
    return data ? { ok: true, invitationId: data } : { ok: false, error: 'server_error' };
  } catch { return { ok: false, error: 'server_error' }; }
}
