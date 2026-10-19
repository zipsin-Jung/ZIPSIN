import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { ChatList, type ChatListItem } from '@/features/chat/components/ChatList';
import type { ChatRoomType } from '@/features/chat/services/room-access';

export default async function ChatsPage() {
  const { supabase, user } = await requireOnboardingComplete();
  const { data: memberships } = await supabase.from('chat_room_memberships').select('room_id').eq('user_id', user.id).eq('status', 'active').is('ended_at', null);
  const roomIds = memberships?.map((membership) => membership.room_id) ?? [];
  if (!roomIds.length) return <Page rooms={[]} />;
  const [{ data: rooms }, { data: messages }, { data: notifications }] = await Promise.all([
    supabase.from('chat_rooms').select('id, room_type, title, created_at').in('id', roomIds).eq('status', 'active'),
    supabase.from('chat_messages').select('id, room_id, body, created_at').in('room_id', roomIds).order('id', { ascending: false }),
    supabase.from('notifications').select('room_id').in('room_id', roomIds).is('read_at', null),
  ]);
  const latest = new Map<string, { body: string; created_at: string }>();
  for (const message of messages ?? []) if (!latest.has(message.room_id)) latest.set(message.room_id, message);
  const unread = new Map<string, number>();
  for (const notice of notifications ?? []) unread.set(notice.room_id, (unread.get(notice.room_id) ?? 0) + 1);
  const items: ChatListItem[] = (rooms ?? []).map((room) => ({ id: room.id, roomType: room.room_type as ChatRoomType, title: room.title, lastMessage: latest.get(room.id)?.body ?? null, lastMessageAt: latest.get(room.id)?.created_at ?? null, unreadCount: unread.get(room.id) ?? 0 })).sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
  return <Page rooms={items} />;
}

function Page({ rooms }: { rooms: ChatListItem[] }) { return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-14"><p className="text-sm font-bold text-[#0B6655]">집신 안에서 안전하게</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-[#212124]">채팅</h1><p className="mt-3 text-[#6B7079]">개인 연락처 대신 집과 업무의 대화를 이어가세요.</p><div className="mt-8"><ChatList rooms={rooms} /></div></main>; }
