import Link from 'next/link';
import { roomTypeLabel, type ChatRoomType } from '@/features/chat/services/room-access';

export type ChatListItem = {
  id: string; roomType: ChatRoomType; title: string | null;
  lastMessage: string | null; lastMessageAt: string | null; unreadCount: number;
};

export function ChatList({ rooms }: { rooms: ChatListItem[] }) {
  if (!rooms.length) return <section className="app-panel rounded-[28px] px-6 py-14 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf6f3] text-2xl" aria-hidden>💬</div><h2 className="mt-5 text-2xl font-extrabold text-[#102a43]">아직 대화가 없습니다</h2><p className="mt-3 leading-7 text-[#607785]">집이나 사무소에서 대화를 시작하면<br className="sm:hidden" /> 여기에 안전하게 모입니다.</p></section>;
  return <ul className="grid gap-3">{rooms.map((room) => <li key={room.id}><Link href={`/chats/${room.id}`} className="app-panel flex min-h-24 items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-[#9bc7c0] sm:p-5"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eaf6f3] font-black text-[#0b695c]">{room.roomType === 'support' ? 'Z' : room.roomType === 'office_internal' ? 'O' : '집'}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="truncate text-[#102a43]">{room.title || roomTypeLabel(room.roomType)}</strong>{room.lastMessageAt && <time className="shrink-0 text-xs text-[#78909b]">{formatTime(room.lastMessageAt)}</time>}</span><span className="mt-1 flex items-center justify-between gap-3"><span className="truncate text-sm text-[#607785]">{room.lastMessage ?? '대화를 시작해 보세요.'}</span>{room.unreadCount > 0 && <span aria-label={`읽지 않은 메시지 ${room.unreadCount}개`} className="grid min-w-6 place-items-center rounded-full bg-[#0b695c] px-1.5 py-1 text-xs font-bold text-white">{room.unreadCount > 99 ? '99+' : room.unreadCount}</span>}</span></span></Link></li>)}</ul>;
}

function formatTime(value: string) { return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
