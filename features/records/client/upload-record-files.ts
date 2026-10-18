import type { PreparedPhoto } from '@/lib/media/prepare-photo';
import type { PrepareUploadState } from '@/features/attachments/actions/upload';

/**
 * 이미 만든 기록 하나에 사진을 한 장씩 올린다. 한 장이 실패해도 나머지는 계속 올리고,
 * 실패한 사진은 원본 파일을 돌려줘 그것만 다시 올릴 수 있게 한다.
 * 사진은 올리기 전에 prepare(위치정보 지우기·줄이기)를 거친다.
 */
export type UploadDeps = {
  prepare: (file: File) => Promise<PreparedPhoto>;
  prepareUpload: (input: { recordId: string; name: string; type: string; size: number }) => Promise<PrepareUploadState>;
  putObject: (storagePath: string, file: File) => Promise<{ error: unknown }>;
  complete: (attachmentId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};
export type UploadItem = { file: File; status: 'saved' | 'failed'; message?: string };

export async function uploadRecordFiles(recordId: string, files: File[], deps: UploadDeps, onSaved?: (savedCount: number) => void) {
  const items: UploadItem[] = [];
  let locationKept = 0;
  let saved = 0;
  for (const original of files) {
    try {
      const prepared = await deps.prepare(original);
      if (!prepared.locationRemoved) locationKept += 1;
      const file = prepared.file;
      const ready = await deps.prepareUpload({ recordId, name: file.name, type: file.type, size: file.size });
      if (!ready.ok) { items.push({ file: original, status: 'failed', message: ready.error }); continue; }
      const { error } = await deps.putObject(ready.storagePath, file);
      if (error) { items.push({ file: original, status: 'failed', message: '올리지 못했어요.' }); continue; }
      const done = await deps.complete(ready.attachmentId);
      if (!done.ok) { items.push({ file: original, status: 'failed', message: done.error }); continue; }
      items.push({ file: original, status: 'saved' });
      saved += 1;
      onSaved?.(saved);
    } catch {
      items.push({ file: original, status: 'failed', message: '올리지 못했어요.' });
    }
  }
  return { items, locationKept };
}
