import type { SupabaseClient } from '@supabase/supabase-js';

/** 이 사람이 대표 공인중개사로 있는 사무소(지금 유효한 것 하나). 없으면 null. 집 등록 버튼을 보일지 정할 때만 쓴다. */
export async function principalOfficeId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('office_memberships').select('office_id')
    .eq('user_id', userId).eq('office_role', 'principal_broker').eq('status', 'active').is('ended_at', null)
    .lte('started_at', new Date().toISOString()).order('created_at').limit(1).maybeSingle();
  if (error || !data) return null;
  return data.office_id as string;
}

/** 이 사람이 지금 어느 사무소든 구성원인지. 기록 탭에서 '사무소 내부' 고르기를 보일지 정할 때 쓴다. */
export async function isOfficeMember(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('office_memberships').select('office_id')
    .eq('user_id', userId).eq('status', 'active').is('ended_at', null)
    .lte('started_at', new Date().toISOString()).limit(1).maybeSingle();
  return !error && Boolean(data);
}
