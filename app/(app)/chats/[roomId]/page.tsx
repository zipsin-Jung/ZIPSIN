import Link from 'next/link';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { ChatRoom } from '@/features/chat/components/ChatRoom';
import { getRecentMessages } from '@/features/chat/services/message';

export default async function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!z.uuid().safeParse(roomId).success) return <Unavailable />;
  const { supabase, user } = await requireOnboardingComplete();
  const { data: room } = await supabase.from('chat_rooms').select('id, title, room_type').eq('id', roomId).eq('status', 'active').maybeSingle();
  if (!room) return <Unavailable />;
  const messages = await getRecentMessages(supabase, roomId);
  const messageIds = messages.map((message) => message.id);
  const { data: attachments } = messageIds.length ? await supabase.from('chat_attachments').select('id, message_id, original_name, media_type').in('message_id', messageIds).eq('status', 'ready') : { data: [] };
  return <main className="px-0 py-0 sm:px-5 sm:py-8"><div className="mx-auto mb-3 flex max-w-4xl items-center justify-between px-4 sm:px-0"><Link href="/chats" className="font-bold text-[#0b695c]">← 채팅</Link><span className="max-w-[60%] truncate text-sm font-bold text-[#607785]">{room.title ?? '집신 대화'}</span></div><ChatRoom roomId={roomId} currentUserId={user.id} active initialMessages={messages} attachments={attachments ?? []} /></main>;
}

function Unavailable() { return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">이 대화에 접근할 수 없습니다.</p><Link href="/chats" className="mt-5 inline-block font-bold text-[#0b695c]">채팅 목록으로</Link></main>; }
