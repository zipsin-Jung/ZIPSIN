'use client';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { completeChatAttachmentAction, failChatAttachmentAction, prepareChatAttachmentAction } from '@/features/chat/actions/upload-attachment';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/heic', 'application/pdf']);

export function ChatAttachmentUploader({ files, pending, onChange }: { files: File[]; pending: boolean; onChange: (files: File[]) => void }) {
  function select(list: FileList | null) {
    const next = list ? Array.from(list).slice(0, 10) : [];
    onChange(next.filter((file) => allowedTypes.has(file.type) && file.size > 0 && file.size <= 20 * 1024 * 1024));
  }
  return <div><label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-[#b9d4d1] px-3 text-sm font-bold text-[#0b695c]"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/heic,application/pdf" multiple disabled={pending} onChange={(event) => select(event.target.files)} />사진·PDF</label>{files.length > 0 && <p className="mt-2 max-w-56 truncate text-xs text-[#607785]">{files.length}개 선택 · {files.map((file) => file.name).join(', ')}</p>}</div>;
}

export async function uploadChatAttachments(roomId: string, messageId: number, files: File[]) {
  const supabase = createBrowserSupabaseClient();
  let completed = 0;
  for (const file of files) {
    const prepared = await prepareChatAttachmentAction({ roomId, messageId, name: file.name, type: file.type, size: file.size });
    if (!prepared.ok) continue;
    const { error } = await supabase.storage.from('chat-attachments').upload(prepared.storagePath, file, { contentType: file.type, upsert: false });
    if (error) { await failChatAttachmentAction(prepared.attachmentId); continue; }
    const result = await completeChatAttachmentAction(prepared.attachmentId);
    if (!result.ok) {
      await supabase.storage.from('chat-attachments').remove([prepared.storagePath]);
      await failChatAttachmentAction(prepared.attachmentId);
      continue;
    }
    completed += 1;
  }
  return { completed, failed: files.length - completed };
}
