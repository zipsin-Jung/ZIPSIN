'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessageAction } from '@/features/chat/actions/send-message';
import { ChatAttachmentUploader, uploadChatAttachments } from '@/features/chat/components/ChatAttachmentUploader';

export function MessageComposer({ roomId, online = true }: { roomId: string; online?: boolean }) {
  const router = useRouter();
  const storageKey = `zipsin-chat-draft:${roomId}`;
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { setBody(localStorage.getItem(storageKey) ?? ''); }, [storageKey]);
  useEffect(() => { if (body) localStorage.setItem(storageKey, body); else localStorage.removeItem(storageKey); }, [body, storageKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online || !body.trim() || pending) return;
    setPending(true); setNotice('전송 중…');
    const form = new FormData();
    form.set('roomId', roomId); form.set('body', body); form.set('idempotencyKey', crypto.randomUUID());
    try {
      const result = await sendMessageAction(form);
      if (result.error || !result.messageId) { setNotice(result.error ?? '전송하지 못했습니다. 다시 시도해 주세요.'); return; }
      if (files.length) {
        const upload = await uploadChatAttachments(roomId, result.messageId, files);
        setNotice(upload.failed ? `${upload.completed}개는 올렸고 ${upload.failed}개는 다시 시도해 주세요.` : '전송했습니다.');
      } else setNotice('전송했습니다.');
      setBody(''); setFiles([]); router.refresh();
    } finally { setPending(false); }
  }

  return <form onSubmit={submit} className="border-t border-[#EAEBEE] bg-white p-3 sm:p-4"><label htmlFor="chat-message" className="sr-only">메시지</label><textarea id="chat-message" aria-label="메시지" value={body} onChange={(event) => setBody(event.target.value)} rows={2} maxLength={2000} placeholder="메시지를 입력하세요" className="min-h-14 w-full resize-none rounded-2xl border border-[#EAEBEE] px-4 py-3 outline-none focus:border-[#0B6655] focus:ring-4 focus:ring-[#0B6655]/10" disabled={pending} /><div className="mt-2 flex items-end justify-between gap-3"><div><ChatAttachmentUploader files={files} pending={pending} onChange={setFiles} /><p className="mt-2 text-xs text-[#6B7079]">집 기록에 자동 저장되지 않아요</p></div><button type="submit" disabled={!online || pending || !body.trim()} className="app-primary min-h-11 shrink-0 rounded-xl px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{pending ? '보내는 중…' : '메시지 보내기'}</button></div>{!online && <p role="status" className="mt-2 text-sm font-semibold text-amber-700">인터넷 연결을 확인해 주세요. 작성 중인 내용은 이 기기에 보관됩니다.</p>}{notice && <p role="status" className="mt-2 text-sm text-[#6B7079]">{notice}</p>}</form>;
}
