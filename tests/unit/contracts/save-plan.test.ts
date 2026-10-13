import { describe, expect, it, vi } from 'vitest';
import { saveContractPlan } from '@/features/contracts/services/save-plan';

const input = {
  contractId: '00000000-0000-4000-8000-000000000002',
  planStatus: 'renewal_considering',
};

describe('saveContractPlan', () => {
  it('TEST-ZH-LIFE-003-D returns the subject-owned plan state id', async () => {
    const setOwnPlan = vi.fn().mockResolvedValue({ data: 'state-1', error: null });
    await expect(saveContractPlan({ setOwnPlan }, input)).resolves.toEqual({ ok: true, stateId: 'state-1' });
    expect(setOwnPlan).toHaveBeenCalledWith(input);
  });

  it('preserves an ended-relationship denial without exposing internals', async () => {
    const setOwnPlan = vi.fn().mockResolvedValue({ data: null, error: { message: 'relation_ended' } });
    await expect(saveContractPlan({ setOwnPlan }, input)).resolves.toEqual({ ok: false, error: 'relation_ended' });
  });
});
