import { describe, expect, it, vi } from 'vitest';
import { saveContract } from '@/features/contracts/services/save-contract';

const input = {
  homeId: '00000000-0000-4000-8000-000000000001',
  contractKind: 'jeonse',
  startsOn: '2026-10-13',
  endsOn: '2027-10-12',
  idempotencyKey: '00000000-0000-4000-8000-000000000003',
};

describe('saveContract', () => {
  it('TEST-ZH-LIFE-003-C returns the saved contract id', async () => {
    const upsert = vi.fn().mockResolvedValue({ data: 'contract-1', error: null });
    await expect(saveContract({ upsert }, input)).resolves.toEqual({ ok: true, contractId: 'contract-1' });
    expect(upsert).toHaveBeenCalledWith(input);
  });

  it('hides database details behind a safe error code', async () => {
    const upsert = vi.fn().mockResolvedValue({ data: null, error: { message: 'private table detail' } });
    await expect(saveContract({ upsert }, input)).resolves.toEqual({ ok: false, error: 'server_error' });
  });
});
