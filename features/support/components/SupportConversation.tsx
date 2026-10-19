'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoom } from '@/features/chat/components/ChatRoom';
import { replySupportAction, setSupportMuteAction, setSupportStatusAction } from '@/features/support/actions/reply-support';
import type { ChatMessagePageItem } from '@/features/chat/domain/room';

type Attachment = { id: string; message_id: number; original_name: string; media_type: string };

export function SupportConversation({ roomId, currentUserId, status, representative, muted, messages, attachments }: { roomId: string; currentUserId: string; status: string; representative: boolean; muted: boolean; messages: ChatMessagePageItem[]; attachments: Attachment[] }) {
  return <div><section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"><strong>민감정보를 보내지 마세요.</strong><br />주민등록번호, 계좌 비밀번호, 인증번호, 계약서 원본은 채팅에 올리지 마세요.</section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-[#6B7079]">상태 · {status === 'resolved' ? '해결됨' : status === 'answered' ? '답변 완료' : '답변 대기'}</p><div className="flex gap-2">{representative && <form action={setSupportStatusAction}><input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="status" value={status === 'resolved' ? 'waiting' : 'resolved'} /><button className="rounded-xl border border-[#EAEBEE] px-3 py-2 text-sm font-bold text-[#6B7079]">{status === 'resolved' ? '다시 열기' : '해결 처리'}</button></form>}<MuteForm roomId={roomId} muted={muted} /></div></div><ChatRoom roomId={roomId} currentUserId={currentUserId} active initialMessages={messages} attachments={attachments} composer={representative ? <SupportReplyComposer roomId={roomId} /> : undefined} /></div>;
}

function SupportReplyComposer({ roomId }: { roomId: string }) {
  const router = useRouter(); const [body, setBody] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!body.trim()) return; setPending(true); const form = new FormData(); form.set('roomId', roomId); form.set('body', body); form.set('idempotencyKey', crypto.randomUUID()); try { const result = await replySupportAction(form); if (result.error) setError(result.error); else { setBody(''); setError(''); router.refresh(); } } finally { setPending(false); } }
  return <form onSubmit={submit} className="border-t border-[#EAEBEE] bg-white p-4"><label htmlFor="support-reply" className="sr-only">고객지원 답변</label><textarea id="support-reply" value={body} onChange={(event) => setBody(event.target.value)} className="min-h-20 w-full rounded-2xl border border-[#EAEBEE] p-3" placeholder="집신 고객지원 이름으로 답변합니다" maxLength={2000} /><button disabled={pending || !body.trim()} className="app-primary mt-2 min-h-11 rounded-xl px-5 font-bold text-white disabled:opacity-45">{pending ? '답변 중…' : '공식 답변 보내기'}</button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</form>;
}

function MuteForm({ roomId, muted }: { roomId: string; muted: boolean }) {
  return <form action={setSupportMuteAction}><input type="hidden" name="roomId" value={roomId} /><input type="hidden" name="muted" value={muted ? 'false' : 'true'} /><button className="rounded-xl border border-[#EAEBEE] px-3 py-2 text-sm font-bold text-[#6B7079]">알림 {muted ? '켜기' : '끄기'}</button></form>;
}
