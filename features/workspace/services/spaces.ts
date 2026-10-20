import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { pickSpace, type Space, type SpaceOffice } from '@/features/workspace/domain/space';

export { SPACE_COOKIE } from '@/features/workspace/domain/space';

export type SpaceContext = {
  displayName: string;
  offices: SpaceOffice[];
  /** 내가 임대인·임차인으로 직접 연결된 집 (개인 공간에 보이는 집). */
  personalHomes: Array<{ homeId: string; relation: 'landlord' | 'tenant' }>;
  /** 개인 기록 공간(고객이 직접 추가한 집이 들어가는 곳). 없으면 null. */
  personalOfficeId: string | null;
};

/* v8 ignore start -- external Supabase boundary is covered by Preview verification. */
/**
 * 위쪽 '우리집 ▾'·모드 전환에 필요한 것: 내 이름, 내가 속한 사무소(개인 기록 공간 제외), 내가 직접 연결된 집.
 * 요청 한 번 안에서는 한 번만 읽는다(React cache). 사무소 이름은 구성원 표에 붙여 한 번에 읽는다.
 * office_kind 칸(202610200001)이 아직 없는 DB에서도 동작하도록, 실패하면 그 칸 없이 다시 읽는다.
 */
export const loadSpaceContext = cache(async (supabase: SupabaseClient, userId: string): Promise<SpaceContext> => {
  const now = new Date().toISOString();
  const memberships = (select: string) => supabase.from('office_memberships').select(select).eq('user_id', userId).eq('status', 'active').is('ended_at', null).lte('started_at', now);
  const [{ data: profile }, withKind, { data: homeMemberships }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('user_id', userId).maybeSingle(),
    memberships('office_id, office_role, offices(id, name, office_kind)'),
    supabase.from('home_memberships').select('home_id, relationship_role').eq('user_id', userId).eq('status', 'active').in('relationship_role', ['landlord', 'tenant']),
  ]);
  const rows = (withKind.error ? (await memberships('office_id, office_role, offices(id, name)')).data : withKind.data) as unknown as Array<{ office_id: string; office_role: string; offices: { id: string; name: string; office_kind?: string } | null }> | null;
  const personal = (rows ?? []).find((row) => row.offices?.office_kind === 'personal');
  return {
    displayName: profile?.display_name?.trim() || '내 집',
    offices: (rows ?? []).filter((row) => row.offices && row.offices.office_kind !== 'personal').map((row) => ({
      id: row.offices!.id,
      name: row.offices!.name,
      canRegisterHome: row.office_role === 'principal_broker',
    })),
    personalOfficeId: personal?.office_id ?? null,
    personalHomes: (homeMemberships ?? []).map((item) => ({ homeId: item.home_id, relation: item.relationship_role as 'landlord' | 'tenant' })),
  };
});

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
