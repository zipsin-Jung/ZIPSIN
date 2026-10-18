'use client';
import { useState } from 'react';

export function AttachmentLink({ attachmentId, name }: { attachmentId: string; name: string }) {
  const [error, setError] = useState('');
  async function open() {
    setError(''); const response = await fetch(`/api/attachments/${attachmentId}/url`, { cache: 'no-store' });
    if (!response.ok) { setError('파일을 열지 못했습니다.'); return; }
    const data = await response.json() as { url?: string }; if (!data.url) { setError('파일을 열지 못했습니다.'); return; }
    window.location.assign(data.url);
  }
  return <span><button type="button" onClick={open} className="text-sm font-bold text-[#0B6655] underline decoration-[#91c9bf] underline-offset-4">{name}</button>{error && <small className="ml-2 text-red-700">{error}</small>}</span>;
}
