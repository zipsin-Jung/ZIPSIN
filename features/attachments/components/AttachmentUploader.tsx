'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { completeAttachmentUploadAction, prepareAttachmentUploadAction } from '@/features/attachments/actions/upload';
import { validateAttachmentSelection } from '@/features/attachments/domain/validation';

export function AttachmentUploader({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState(''); const [pending, setPending] = useState(false);
  async function upload(files: FileList | null) {
    const selected = files ? Array.from(files) : []; const validation = validateAttachmentSelection(selected);
    if (!validation.ok) { setMessage(validation.error); return; }
    setPending(true); setMessage(''); let completed = 0;
    try {
      const supabase = createBrowserSupabaseClient();
      for (const file of selected) {
        const prepared = await prepareAttachmentUploadAction({ recordId, name: file.name, type: file.type, size: file.size });
        if (!prepared.ok) { setMessage(`${file.name}: ${prepared.error}`); continue; }
        const { error } = await supabase.storage.from('home-records').upload(prepared.storagePath, file, { contentType: file.type, upsert: false });
        if (error) { setMessage(`${file.name}: 업로드하지 못했습니다.`); continue; }
        const finished = await completeAttachmentUploadAction(prepared.attachmentId);
        if (!finished.ok) { setMessage(`${file.name}: ${finished.error}`); continue; }
        completed += 1;
      }
      if (completed === selected.length) setMessage(`${completed}개 파일을 안전하게 저장했습니다.`);
      else if (completed > 0) setMessage(`${completed}개는 저장했고, 나머지는 다시 시도해 주세요.`);
      if (completed > 0) router.refresh();
    } finally { setPending(false); }
  }
  return <div className="mt-4 border-t border-[#e1eaec] pt-4"><label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-[#b9d4d1] px-4 text-sm font-bold text-[#0b695c]"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/heic,application/pdf" multiple disabled={pending} onChange={(event) => upload(event.target.files)} />{pending ? '안전하게 저장 중…' : '사진·PDF 추가'}</label>{message && <p role="status" className="mt-2 text-sm text-[#59717f]">{message}</p>}</div>;
}
