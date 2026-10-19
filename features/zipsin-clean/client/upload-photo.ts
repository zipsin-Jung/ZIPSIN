'use client';

import { preparePhoto } from '@/lib/zipsin-check/photo-store';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { completeCleanPhoto, prepareCleanPhoto } from '@/features/zipsin-clean/server/actions';

export type PhotoTarget = { kind: 'before' | 'after' | 'block' | 'record'; bookingId?: string; recordId?: string };

/**
 * 사진 올리기: 1600px JPEG로 다시 그려(위치정보 등 사진 정보 제거) → 권한 확인·경로 받기 → 저장소에 올리기 → 완료 표시.
 * 실패하면 사람이 읽을 수 있는 문장을 돌려준다.
 */
export async function uploadCleanPhotos(target: PhotoTarget, files: File[]): Promise<string | null> {
  const storage = createBrowserSupabaseClient().storage.from('clean-photos');
  for (const file of files) {
    let blob: Blob;
    try { blob = await preparePhoto(file); } catch (error) { return error instanceof Error ? error.message : '사진을 처리하지 못했어요.'; }
    const prepared = await prepareCleanPhoto(target.kind, { bookingId: target.bookingId, recordId: target.recordId });
    if (!prepared.ok) return prepared.error;
    const { error } = await storage.upload(prepared.value.path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) return '사진을 올리지 못했어요. 인터넷 연결을 확인하고 다시 해 주세요.';
    const done = await completeCleanPhoto(prepared.value.photoId);
    if (!done.ok) return done.error;
  }
  return null;
}
