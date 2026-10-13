import { describe, expect, it, vi } from 'vitest';
import { createOfficeInvitation } from '@/features/invitations/services/office-invitation';

const input = { officeId: '00000000-0000-4000-8000-000000000001', role: 'assistant' };
const token = 'a'.repeat(43);
const expiresAt = '2026-10-15T00:00:00.000Z';

describe('createOfficeInvitation', () => {
  it('returns the created invitation ID for a valid staff role', async () => {
    const create = vi.fn().mockResolvedValue({ data: 'invitation-1', error: null });
    await expect(createOfficeInvitation({ create }, input, token, expiresAt)).resolves.toEqual({ ok: true, invitationId: 'invitation-1' });
    expect(create).toHaveBeenCalledWith({ ...input, token, expiresAt });
  });

  it('rejects invalid roles before calling the repository', async () => {
    const create = vi.fn();
    await expect(createOfficeInvitation({ create }, { ...input, role: 'principal_broker' }, token, expiresAt)).resolves.toEqual({ ok: false, error: 'invalid_input' });
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    [{ data: null, error: { message: 'permission_denied' } }, 'permission_denied'],
    [{ data: null, error: null }, 'server_error'],
  ] as const)('maps repository result %j without exposing details', async (repositoryResult, error) => {
    const create = vi.fn().mockResolvedValue(repositoryResult);
    await expect(createOfficeInvitation({ create }, input, token, expiresAt)).resolves.toEqual({ ok: false, error });
  });

  it('maps a thrown repository failure to a safe server error', async () => {
    const create = vi.fn().mockRejectedValue(new Error('private details'));
    await expect(createOfficeInvitation({ create }, input, token, expiresAt)).resolves.toEqual({ ok: false, error: 'server_error' });
  });
});
