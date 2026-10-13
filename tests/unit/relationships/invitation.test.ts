import { describe, expect, it } from 'vitest';
import {
  relationshipInvitationSchema,
  relationshipTokenSchema,
} from '@/features/relationships/schemas/invitation';

const homeId = '00000000-0000-4000-8000-000000000001';
const contractId = '00000000-0000-4000-8000-000000000002';

describe('relationship invitation input', () => {
  it.each(['landlord', 'tenant'])('accepts %s only for a current contract', (role) => {
    expect(relationshipInvitationSchema.safeParse({
      homeId,
      contractId,
      role,
      scope: 'current_contract',
    }).success).toBe(true);
    expect(relationshipInvitationSchema.safeParse({
      homeId,
      role,
      scope: 'current_contract',
    }).success).toBe(false);
  });

  it('accepts a repairer only with an explicit expiry', () => {
    expect(relationshipInvitationSchema.safeParse({
      homeId,
      role: 'repairer',
      scope: 'repair_event',
      relationshipExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    }).success).toBe(true);
    expect(relationshipInvitationSchema.safeParse({
      homeId,
      role: 'repairer',
      scope: 'repair_event',
    }).success).toBe(false);
  });

  it('rejects crossed role and scope combinations', () => {
    expect(relationshipInvitationSchema.safeParse({ homeId, contractId, role: 'tenant', scope: 'repair_event' }).success).toBe(false);
    expect(relationshipInvitationSchema.safeParse({ homeId, contractId, role: 'repairer', scope: 'current_contract' }).success).toBe(false);
  });

  it('accepts only an opaque invitation token', () => {
    expect(relationshipTokenSchema.safeParse({ token: 'a'.repeat(43) }).success).toBe(true);
    expect(relationshipTokenSchema.safeParse({ token: '../contract?id=1' }).success).toBe(false);
  });
});
