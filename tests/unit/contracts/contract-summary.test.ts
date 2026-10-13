import { describe, expect, it, vi } from 'vitest';
import { loadContractHomeSummary } from '@/features/contracts/services/contract-summary';

const home = { id: 'home-1', officeId: 'office-1', label: '집신아파트 1401호', addressLine1: '서울시 노원구 예시로 10', addressDetail: '1401호' };
const contract = { id: 'contract-1', kind: 'jeonse', startsOn: '2026-02-03', endsOn: '2027-02-02' };

function repository(overrides: Record<string, unknown> = {}) {
  return {
    getHome: vi.fn().mockResolvedValue({ data: home, error: null }),
    getActiveContract: vi.fn().mockResolvedValue({ data: contract, error: null }),
    getPartyPlans: vi.fn().mockResolvedValue({ data: [
      { role: 'landlord', planStatus: 'renewal_considering', isCurrentUser: false },
      { role: 'tenant', planStatus: 'undecided', isCurrentUser: true },
    ], error: null }),
    getRecords: vi.fn().mockResolvedValue({ data: [{ id: 'record-1', kind: 'document', title: '계약서', taskStatus: null, occurredAt: '2026-10-13T09:00:00Z' }], error: null }),
    canEditContract: vi.fn().mockResolvedValue({ data: false, error: null }),
    ...overrides,
  };
}

describe('loadContractHomeSummary', () => {
  it('TEST-ZH-LIFE-003-L / TEST-ZH-DATA-001 returns separate party plans and the current user relationship', async () => {
    const repo = repository();
    const result = await loadContractHomeSummary(repo, { homeId: 'home-1', userId: 'user-1', today: new Date('2026-10-12T15:00:00Z') });
    expect(result.ok).toBe(true);
    expect(repo.canEditContract).toHaveBeenCalledWith('office-1', 'user-1');
    if (result.ok) {
      expect(result.summary.contract?.id).toBe('contract-1');
      expect(result.summary.currentUserRelationship).toBe('tenant');
      expect(result.summary.ownPlanStatus).toBe('undecided');
      expect(result.summary.partyPlans).toEqual([
        { role: 'landlord', status: 'renewal_considering' },
        { role: 'tenant', status: 'undecided' },
      ]);
      expect(result.summary.hasContractDocument).toBe(true);
    }
  });

  it('TEST-ZH-DATA-002 separates a normal no-contract home from a database failure', async () => {
    const empty = await loadContractHomeSummary(repository({ getActiveContract: vi.fn().mockResolvedValue({ data: null, error: null }) }), { homeId: 'home-1', userId: 'user-1' });
    expect(empty).toMatchObject({ ok: true, status: 'no_contract' });

    const failed = await loadContractHomeSummary(repository({ getHome: vi.fn().mockResolvedValue({ data: null, error: { message: 'private detail' } }) }), { homeId: 'home-1', userId: 'user-1' });
    expect(failed).toEqual({ ok: false, error: 'load_failed' });
  });

  it('TEST-ZH-DATA-003 never loads contract-dependent rows when no active contract exists', async () => {
    const repo = repository({ getActiveContract: vi.fn().mockResolvedValue({ data: null, error: null }) });
    await loadContractHomeSummary(repo, { homeId: 'home-1', userId: 'user-1' });
    expect(repo.getPartyPlans).not.toHaveBeenCalled();
  });
});
