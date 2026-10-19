'use client';

import { MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRoomStream } from '@/features/chat/hooks/use-room-stream';
import { MessageComposer } from '@/features/chat/components/MessageComposer';
import type { ChatMessagePageItem } from '@/features/chat/domain/room';
import { reportMessageAction } from '@/features/chat/actions/report-message';

type Attachment = { id: string; message_id: number; original_name: string; media_type: string };

export function ChatRoom({ roomId, currentUserId, active, initialMessages, attachments, composer }: { roomId: string; currentUserId: string; active: boolean; initialMessages: ChatMessagePageItem[]; attachments: Attachment[]; composer?: ReactNode }) {
  const { messages, connection } = useRoomStream(roomId, initialMessages);
  const byMessage = new Map<number, Attachment[]>();
  for (const attachment of attachments) byMessage.set(attachment.message_id, [...(byMessage.get(attachment.message_id) ?? []), attachment]);
  return <section className="app-panel mx-auto flex min-h-[calc(100dvh-150px)] max-w-4xl flex-col overflow-hidden rounded-none sm:min-h-[680px] sm:rounded-[28px]"><div className="flex items-center justify-between border-b border-[#EAEBEE] px-4 py-3 sm:px-6"><div><strong className="text-[#212124]">대화</strong><p className="mt-0.5 text-xs text-[#6B7079]">{connection === 'connected' ? '연결됨' : connection === 'offline' ? '오프라인' : '다시 연결 중…'}</p></div></div><div aria-live="polite" className="flex flex-1 flex-col-reverse gap-3 overflow-y-auto bg-[#f4f8f7] p-4 sm:p-6">{messages.length ? messages.map((message) => { const official = message.sender_kind === 'support'; const mine = !official && message.sender_user_id === currentUserId; return <article key={message.id} className={`max-w-[85%] ${mine ? 'self-end' : 'self-start'}`}><p className={`mb-1 text-xs font-bold ${mine ? 'text-right' : ''}`}>{official ? '집신 고객지원 ✓' : mine ? '나' : '참여자'}</p><div className={`rounded-2xl px-4 py-3 leading-6 shadow-sm ${mine ? 'rounded-tr-md bg-[#0B6655] text-white' : official ? 'rounded-tl-md border border-[#a8d3cc] bg-[#E3F0EC] text-[#4D5159]' : 'rounded-tl-md bg-white text-[#183746]'}`}><p className="whitespace-pre-wrap break-words">{message.body}</p>{(byMessage.get(message.id) ?? []).map((attachment) => <AttachmentButton key={attachment.id} attachment={attachment} />)}</div>{!mine && !official && <form action={reportMessageAction} className="mt-1"><input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="messageId" value={message.id} /><input type="hidden" name="reason" value="other" /><button className="text-xs text-[#6B7079] underline-offset-2 hover:underline">신고</button></form>}</article>; }) : <div className="m-auto text-center text-[#6B7079]"><MessageCircle aria-hidden className="mx-auto size-8 text-[#0B6655]" /><p className="mt-3 font-semibold">첫 메시지를 남겨 보세요.</p></div>}</div>{active ? (composer ?? <MessageComposer roomId={roomId} online={connection !== 'offline'} />) : <div className="border-t border-[#EAEBEE] bg-white p-5 text-center font-semibold text-[#6B7079]">이 대화의 참여 권한이 종료되었습니다.</div>}</section>;
}

function AttachmentButton({ attachment }: { attachment: Attachment }) {
  async function open() { const response = await fetch(`/api/chat-attachments/${attachment.id}/url`); if (!response.ok) return; const data = await response.json() as { url?: string }; if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer'); }
  return <button type="button" onClick={open} className="mt-3 block max-w-full truncate rounded-xl border border-current/20 px-3 py-2 text-sm font-bold underline-offset-2 hover:underline">{attachment.media_type === 'application/pdf' ? 'PDF' : '사진'} · {attachment.original_name}</button>;
}
