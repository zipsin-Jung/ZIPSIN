import { describe, expect, it } from 'vitest';
import { officeInvitationSchema } from '@/features/invitations/schemas/invitation';

describe('officeInvitationSchema', () => {
  it('TEST-MEMBER-004 accepts only staff roles and a UUID office', () => {
    expect(officeInvitationSchema.safeParse({ officeId: crypto.randomUUID(), role: 'assistant' }).success).toBe(true);
    expect(officeInvitationSchema.safeParse({ officeId: crypto.randomUUID(), role: 'principal_broker' }).success).toBe(false);
    expect(officeInvitationSchema.safeParse({ officeId: 'office-1', role: 'assistant' }).success).toBe(false);
  });
});
