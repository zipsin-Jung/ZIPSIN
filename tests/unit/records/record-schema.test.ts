import { describe, expect, it } from 'vitest';
import { recordSchema } from '@/features/records/schemas/record';

describe('recordSchema', () => {
  const base = { homeId: crypto.randomUUID(), officeId: crypto.randomUUID(), contractId: '', space: 'office_internal', kind: 'note', title: '누수 확인', body: '욕실 천장', idempotencyKey: crypto.randomUUID() };
  it('TEST-REC-002 accepts a valid office note', () => expect(recordSchema.safeParse(base).success).toBe(true));
  it('TEST-REC-003 rejects a current-contract record without a contract', () => expect(recordSchema.safeParse({ ...base, space: 'current_contract', officeId: '' }).success).toBe(false));
  it('TEST-REC-004 rejects unsupported kinds and blank titles', () => {
    expect(recordSchema.safeParse({ ...base, kind: 'chat' }).success).toBe(false);
    expect(recordSchema.safeParse({ ...base, title: ' ' }).success).toBe(false);
  });
});
