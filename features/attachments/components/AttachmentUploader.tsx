'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { completeAttachmentUploadAction, prepareAttachmentUploadAction } from '@/features/attachments/actions/upload';
import { validateAttachmentSelection } from '@/features/attachments/domain/validation';

type UploadResult = { file: File; status: 'saved' | 'failed'; message: string };

export function AttachmentUploader({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<UploadResult[]>([]);
  const [pending, setPending] = useState(false);

  async function upload(selected: File[]) {
    const validation = validateAttachmentSelection(selected);
    if (!validation.ok) { setMessage(validation.error); return; }
    setPending(true); setMessage('');
    const nextResults: UploadResult[] = [];
    try {
      const supabase = createBrowserSupabaseClient();
      for (const file of selected) {
        const prepared = await prepareAttachmentUploadAction({ recordId, name: file.name, type: file.type, size: file.size });
        if (!prepared.ok) { nextResults.push({ file, status: 'failed', message: prepared.error }); continue; }
        const { error } = await supabase.storage.from('home-records').upload(prepared.storagePath, file, { contentType: file.type, upsert: false });
        if (error) { nextResults.push({ file, status: 'failed', message: '업로드하지 못했습니다.' }); continue; }
        const finished = await completeAttachmentUploadAction(prepared.attachmentId);
        if (!finished.ok) { nextResults.push({ file, status: 'failed', message: finished.error }); continue; }
        nextResults.push({ file, status: 'saved', message: '저장 완료' });
      }
      setResults((current) => {
        const retriedNames = new Set(selected.map((file) => file.name));
        return [...current.filter((result) => !retriedNames.has(result.file.name)), ...nextResults];
      });
      const completed = nextResults.filter((result) => result.status === 'saved').length;
      if (completed === selected.length) setMessage(`${completed}개 파일을 안전하게 저장했습니다.`);
      else if (completed > 0) setMessage(`${completed}개는 저장했고, 실패한 파일만 다시 시도할 수 있어요.`);
      else setMessage('파일을 저장하지 못했어요. 실패한 파일만 다시 시도해 주세요.');
      if (completed > 0) router.refresh();
    } finally { setPending(false); }
  }
  const failed = results.filter((result) => result.status === 'failed');
  return <div className="mt-4 border-t border-[#e1eaec] pt-4"><label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-[#b9d4d1] px-4 text-sm font-bold text-[#0b695c]"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/heic,application/pdf" multiple disabled={pending} onChange={(event) => upload(Array.from(event.target.files ?? []))} />{pending ? '안전하게 저장 중…' : '사진·PDF 추가'}</label>
    {results.length > 0 && <ul className="mt-3 grid gap-2">{results.map((result, index) => { const descriptionId = `attachment-result-${index}`; return <li key={`${result.file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#f5f8f8] px-3 py-2 text-sm"><span aria-describedby={descriptionId}>{result.file.name}</span><span id={descriptionId} className={result.status === 'saved' ? 'font-bold text-[#0b695c]' : 'font-bold text-red-700'}>{result.status === 'saved' ? '저장 완료' : '저장 실패'}</span></li>; })}</ul>}
    {failed.length > 0 && <button type="button" disabled={pending} onClick={() => upload(failed.map((result) => result.file))} className="mt-3 min-h-11 rounded-xl border border-[#b9d4d1] px-4 text-sm font-bold text-[#0b695c]">실패한 파일 {failed.length}개 다시 시도</button>}
    {message && <p role="status" className="mt-2 text-sm text-[#59717f]">{message}</p>}
  </div>;
}
