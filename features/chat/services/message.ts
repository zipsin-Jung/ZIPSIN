import type { SupabaseClient } from '@supabase/supabase-js';
import { CHAT_PAGE_SIZE, type ChatMessagePageItem } from '@/features/chat/domain/room';
import type { Database } from '@/types/database';

export function mergeMessagePages<T extends { id: number }>(...pages: T[][]): T[] {
  return [...new Map(pages.flat().map((message) => [message.id, message])).values()]
    .sort((left, right) => right.id - left.id);
}

export async function getRecentMessages(
  supabase: SupabaseClient<Database>,
  roomId: string,
  beforeMessageId?: number,
): Promise<ChatMessagePageItem[]> {
  let query = supabase
    .from('chat_messages')
    .select('id, room_id, sender_user_id, body, created_at')
    .eq('room_id', roomId)
    .order('id', { ascending: false })
    .limit(CHAT_PAGE_SIZE);
  if (beforeMessageId) query = query.lt('id', beforeMessageId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
