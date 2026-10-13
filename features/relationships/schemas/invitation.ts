import { z } from 'zod';

const base = {
  homeId: z.uuid(),
  contractId: z.uuid().optional(),
};

export const relationshipInvitationSchema = z.discriminatedUnion('scope', [
  z.object({
    ...base,
    contractId: z.uuid(),
    role: z.enum(['landlord', 'tenant']),
    scope: z.literal('current_contract'),
    relationshipExpiresAt: z.never().optional(),
  }),
  z.object({
    ...base,
    role: z.literal('repairer'),
    scope: z.literal('repair_event'),
    relationshipExpiresAt: z.iso.datetime(),
  }),
]);

export const relationshipTokenSchema = z.object({
  token: z.string().min(32).max(256).regex(/^[A-Za-z0-9_-]+$/),
});

export type RelationshipInvitationInput = z.infer<typeof relationshipInvitationSchema>;
