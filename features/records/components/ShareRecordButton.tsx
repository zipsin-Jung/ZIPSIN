'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';

/**
 * 카톡으로 기록 링크 보내기 (승인 제안 ③). 카카오 앱 키 없이 휴대폰 공유창을 연다(카카오톡을 고르면 카톡으로 간다).
 * 링크를 받아도 이 집에 연결된 사람만 열 수 있다. 권한은 DB(RLS)가 확인한다.
 */
export function ShareRecordButton({ path, text, label = '카톡으로 보내기' }: { path: string; text: string; label?: string }) {
  const [message, setMessage] = useState('');
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    setMessage('');
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: '집신 기록', text, url }); return; }
      catch (error) { if ((error as Error)?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); setMessage('링크를 복사했어요. 카톡 대화방에 붙여 넣어 주세요.'); }
    catch { setMessage('이 브라우저에서는 복사할 수 없어요. 주소창의 링크를 복사해 주세요.'); }
  }
  return (
    <span className="inline-flex flex-col">
      <button className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#DCDEE3] bg-white px-3 text-[15px] font-semibold text-[#212124]" onClick={share} type="button">
        <Share2 aria-hidden="true" className="size-4" />{label}
      </button>
      {message && <span className="mt-1 text-sm text-[#4D5159]" role="status">{message}</span>}
      <span className="sr-only">링크는 이 집에 연결된 사람만 열 수 있어요.</span>
    </span>
  );
}
