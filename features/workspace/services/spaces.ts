import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { pickSpace, type Space, type SpaceOffice } from '@/features/workspace/domain/space';

export { SPACE_COOKIE } from '@/features/workspace/domain/space';

export type SpaceContext = {
  displayName: string;
  offices: SpaceOffice[];
  /** 내가 임대인·임차인으로 직접 연결된 집 (개인 공간에 보이는 집). */
  personalHomes: Array<{ homeId: string; relation: 'landlord' | 'tenant' }>;
};

/* v8 ignore start -- external Supabase boundary is covered by Preview verification. */
/** 위쪽 '이름 ▾'에 필요한 것: 내 이름, 내가 속한 사무소, 내가 직접 연결된 집. RLS가 허용한 행만 읽는다. */
export async function loadSpaceContext(supabase: SupabaseClient, userId: string): Promise<SpaceContext> {
  const now = new Date().toISOString();
  const [{ data: profile }, { data: memberships }, { data: homeMemberships }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('user_id', userId).maybeSingle(),
    supabase.from('office_memberships').select('office_id, office_role').eq('user_id', userId).eq('status', 'active').is('ended_at', null).lte('started_at', now),
    supabase.from('home_memberships').select('home_id, relationship_role').eq('user_id', userId).eq('status', 'active').in('relationship_role', ['landlord', 'tenant']),
  ]);
  const officeIds = (memberships ?? []).map((item) => item.office_id);
  const { data: offices } = officeIds.length ? await supabase.from('offices').select('id, name').in('id', officeIds) : { data: [] };
  return {
    displayName: profile?.display_name?.trim() || '내 집',
    offices: (offices ?? []).map((office) => ({
      id: office.id,
      name: office.name,
      canRegisterHome: (memberships ?? []).some((item) => item.office_id === office.id && item.office_role === 'principal_broker'),
    })),
    personalHomes: (homeMemberships ?? []).map((item) => ({ homeId: item.home_id, relation: item.relationship_role as 'landlord' | 'tenant' })),
  };
}

/** 집마다 가장 최근 사진 한 장(목록 썸네일). 서명 주소는 10분만 유효하다. */
export async function loadHomeCoverPhotos(supabase: SupabaseClient, homeIds: string[]): Promise<Map<string, string>> {
  const covers = new Map<string, string>();
  if (!homeIds.length) return covers;
  const { data: records } = await supabase.from('records').select('id, home_id').in('home_id', homeIds).order('occurred_at', { ascending: false }).limit(200);
  const recordHome = new Map((records ?? []).map((row) => [row.id, row.home_id]));
  if (!recordHome.size) return covers;
  const { data: photos } = await supabase.from('attachments').select('record_id, storage_path, media_type, created_at').in('record_id', [...recordHome.keys()]).eq('status', 'ready').like('media_type', 'image/%').neq('media_type', 'image/heic').order('created_at', { ascending: false });
  const pathByHome = new Map<string, string>();
  for (const photo of photos ?? []) {
    const homeId = recordHome.get(photo.record_id);
    if (homeId && !pathByHome.has(homeId)) pathByHome.set(homeId, photo.storage_path);
  }
  if (!pathByHome.size) return covers;
  const { data: signed, error } = await supabase.storage.from('home-records').createSignedUrls([...pathByHome.values()], 600);
  if (error) return covers;
  const urlByPath = new Map((signed ?? []).map((row) => [row.path, row.signedUrl]));
  for (const [homeId, path] of pathByHome) {
    const url = urlByPath.get(path);
    if (url) covers.set(homeId, url);
  }
  return covers;
}
/* v8 ignore stop */

export { pickSpace, type Space, type SpaceOffice };
