import Link from 'next/link';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { ChatRoom } from '@/features/chat/components/ChatRoom';
import { getRecentMessages } from '@/features/chat/services/message';
import { blockDirectUserAction } from '@/features/chat/actions/block-user';

export default async function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!z.uuid().safeParse(roomId).success) return <Unavailable />;
  const { supabase, user } = await requireOnboardingComplete();
  const { data: room } = await supabase.from('chat_rooms').select('id, title, room_type').eq('id', roomId).eq('status', 'active').maybeSingle();
  if (!room) return <Unavailable />;
  const messages = await getRecentMessages(supabase, roomId);
  const messageIds = messages.map((message) => message.id);
  const { data: attachments } = messageIds.length ? await supabase.from('chat_attachments').select('id, message_id, original_name, media_type').in('message_id', messageIds).eq('status', 'ready') : { data: [] };
  const { data: directMembers } = room.room_type === 'direct' ? await supabase.from('chat_room_memberships').select('user_id').eq('room_id', roomId).eq('status', 'active').is('ended_at', null) : { data: [] };
  const otherUserId = directMembers?.find((member) => member.user_id !== user.id)?.user_id;
  return <main className="px-0 py-0 sm:px-5 sm:py-8"><div className="mx-auto mb-3 flex max-w-4xl items-center justify-between gap-3 px-4 sm:px-0"><Link href="/chats" className="font-bold text-[#0b695c]">← 채팅</Link><div className="flex items-center gap-3"><span className="max-w-40 truncate text-sm font-bold text-[#607785]">{room.title ?? '집신 대화'}</span>{otherUserId && <form action={blockDirectUserAction}><input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="otherUserId" value={otherUserId} /><button className="text-xs font-bold text-red-700">차단</button></form>}</div></div><ChatRoom roomId={roomId} currentUserId={user.id} active initialMessages={messages} attachments={attachments ?? []} /></main>;
}

function Unavailable() { return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">이 대화에 접근할 수 없습니다.</p><Link href="/chats" className="mt-5 inline-block font-bold text-[#0b695c]">채팅 목록으로</Link></main>; }
