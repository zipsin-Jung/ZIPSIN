'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { completePartnerDocumentAction, preparePartnerDocumentAction } from '@/features/partners/actions';
import { validatePartnerFile, type DocumentKind } from '@/features/partners/domain';

/** 서류 한 장 올리기. 비공개 저장소에 본인만 올리고 본인만 본다. */
export function PartnerDocumentUpload({ applicationId, kind, label, done }: { applicationId: string; kind: DocumentKind; label: string; done: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function upload(file: File | undefined) {
    if (!file) return;
    const invalid = validatePartnerFile(file);
    if (invalid) { setMessage(invalid); return; }
    setPending(true); setMessage('');
    try {
      const prepared = await preparePartnerDocumentAction({ applicationId, kind, name: file.name, type: file.type, size: file.size });
      if (!prepared.ok) { setMessage(prepared.error); return; }
      const { error } = await createBrowserSupabaseClient().storage.from('partner-documents').upload(prepared.storagePath, file, { contentType: file.type, upsert: false });
      if (error) { setMessage('올리지 못했어요. 다시 시도해 주세요.'); return; }
      const finished = await completePartnerDocumentAction(prepared.documentId);
      if (!finished.ok) { setMessage('올린 파일을 확인하지 못했어요. 다시 시도해 주세요.'); return; }
      setMessage('올렸어요.');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-lg px-4 text-[15px] font-semibold ${done ? 'border border-[#DCDEE3] text-[#212124]' : 'bg-[#212124] text-white'} ${pending ? 'opacity-60' : ''}`}>
        {pending ? '올리는 중…' : done ? '다시 올리기' : '사진·PDF 올리기'}
        <input accept="image/jpeg,image/png,application/pdf" aria-label={`${label} 올리기`} className="sr-only" disabled={pending} onChange={(event) => upload(event.target.files?.[0])} type="file" />
      </label>
      <p aria-live="polite" className="mt-1 text-sm text-[#4D5159]">{message}</p>
    </div>
  );
}
