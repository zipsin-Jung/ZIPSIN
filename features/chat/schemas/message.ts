import { z } from 'zod';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/features/chat/domain/room';

export const chatMessageSchema = z.object({
  roomId: z.uuid(),
  body: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_LENGTH),
  idempotencyKey: z.uuid(),
});

export const chatReadSchema = z.object({
  roomId: z.uuid(),
  lastReadMessageId: z.coerce.number().int().positive(),
});
