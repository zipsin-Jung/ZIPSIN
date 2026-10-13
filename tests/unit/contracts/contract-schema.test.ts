import { describe, expect, it } from 'vitest';
import { contractSchema, contractPlanSchema } from '@/features/contracts/schemas/contract';

const homeId = '00000000-0000-4000-8000-000000000001';
const contractId = '00000000-0000-4000-8000-000000000002';
const idempotencyKey = '00000000-0000-4000-8000-000000000003';

describe('contract lifecycle schemas', () => {
  it('TEST-ZH-LIFE-003-A rejects an end date before the start date', () => {
    const result = contractSchema.safeParse({ homeId, contractKind: 'jeonse', startsOn: '2027-02-02', endsOn: '2027-02-01', idempotencyKey });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['endsOn']);
  });

  it('accepts verified dates and allows an omitted date', () => {
    expect(contractSchema.safeParse({ homeId, contractKind: 'monthly_rent', startsOn: '2026-10-13', endsOn: '2027-10-12', idempotencyKey }).success).toBe(true);
    expect(contractSchema.safeParse({ homeId, contractKind: 'other', startsOn: '', endsOn: '', idempotencyKey }).success).toBe(true);
  });

  it('TEST-ZH-LIFE-003-B rejects unknown plan states', () => {
    expect(contractPlanSchema.safeParse({ contractId, planStatus: 'notice_sent' }).success).toBe(false);
    expect(contractPlanSchema.safeParse({ contractId, planStatus: 'move_out_preparing' }).success).toBe(true);
  });
});
