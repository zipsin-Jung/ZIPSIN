import { z } from 'zod';

export const officeInvitationSchema = z.object({
  officeId: z.uuid(),
  role: z.enum(['associate_broker', 'assistant']),
});

export const invitationTokenSchema = z.object({ token: z.string().min(32).max(256).regex(/^[A-Za-z0-9_-]+$/) });
export type OfficeInvitationInput = z.infer<typeof officeInvitationSchema>;
