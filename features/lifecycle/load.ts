import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StripPhoto } from '@/features/lifecycle/LifecyclePage';

/* v8 ignore start -- external Supabase boundary is covered by Preview verification. */
/** 고른 집의 최근 사진(기록 제목과 날짜). titlePrefix를 주면 그 제목으로 시작하는 기록만. */
export async function loadHomePhotoStrip(supabase: SupabaseClient, homeId: string, titlePrefix?: string, limit = 5): Promise<StripPhoto[]> {
  let records = supabase.from('records').select('id, title, occurred_at').eq('home_id', homeId).order('occurred_at', { ascending: false }).limit(60);
  if (titlePrefix) records = records.like('title', `${titlePrefix}%`);
  const { data: rows } = await records;
  if (!rows?.length) return [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const { data: photos } = await supabase.from('attachments').select('id, record_id, storage_path, media_type, created_at').in('record_id', rows.map((row) => row.id)).eq('status', 'ready').like('media_type', 'image/%').neq('media_type', 'image/heic').order('created_at', { ascending: false }).limit(limit);
  if (!photos?.length) return [];
  const { data: signed } = await supabase.storage.from('home-records').createSignedUrls(photos.map((photo) => photo.storage_path), 600);
  const urlByPath = new Map((signed ?? []).map((row) => [row.path, row.signedUrl]));
  return photos.map((photo) => ({
    id: photo.id,
    url: urlByPath.get(photo.storage_path) ?? null,
    date: new Date(photo.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }),
    title: byId.get(photo.record_id)?.title ?? '사진',
  }));
}

/** 나의 체크리스트 체크(이 집에 연결된 것 + 집 없이 한 것). 키는 'stage:item'. */
export async function loadMyChecks(supabase: SupabaseClient, userId: string, homeId: string | null): Promise<Set<string>> {
  const { data } = await supabase.from('checklist_checks').select('stage, item_key, home_id').eq('user_id', userId);
  return new Set((data ?? []).filter((row) => !row.home_id || row.home_id === homeId).map((row) => `${row.stage}:${row.item_key}`));
}

export async function loadInspectionStatus(supabase: SupabaseClient, homeId: string) {
  const { data } = await supabase.from('home_inspections').select('inspection_kind, status').eq('home_id', homeId);
  const of = (kind: string) => (data ?? []).find((row) => row.inspection_kind === kind)?.status ?? null;
  return { moveIn: of('move_in'), moveOut: of('move_out') };
}
/* v8 ignore stop */
