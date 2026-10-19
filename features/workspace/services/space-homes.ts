import 'server-only';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SPACE_COOKIE, pickSpace, type Space } from '@/features/workspace/domain/space';
import { loadHomeDashboardFromSupabase, type DashboardHome } from '@/features/workspace/services/home-dashboard';
import { loadSpaceContext } from '@/features/workspace/services/spaces';

export type SpaceHome = DashboardHome & { relation: 'tenant' | 'landlord' | null };

/* v8 ignore start -- external Supabase boundary is covered by Preview verification. */
/** 지금 고른 공간(우리집 ▾)의 집 목록과, 주소창 ?home= 으로 고른 집. 볼 수 있는지는 RLS가 이미 정했다. */
export async function loadSpaceHomes(supabase: SupabaseClient, userId: string, homeParam?: string) {
  const [dashboard, context] = await Promise.all([loadHomeDashboardFromSupabase(supabase, userId), loadSpaceContext(supabase, userId)]);
  const space: Space = pickSpace((await cookies()).get(SPACE_COOKIE)?.value, context.offices, context.personalHomes.length);
  if (!dashboard.ok) return { ok: false as const };
  const relation = new Map(context.personalHomes.map((item) => [item.homeId, item.relation]));
  const homes: SpaceHome[] = dashboard.homes
    .filter((home) => (space.kind === 'me' ? relation.has(home.id) : home.officeId === space.office.id))
    .map((home) => ({ ...home, relation: relation.get(home.id) ?? null }));
  const selected = homes.find((home) => home.id === homeParam) ?? homes[0] ?? null;
  return { ok: true as const, space, homes, selected, isOffice: space.kind === 'office', canAddHome: space.kind === 'office' && space.office.canRegisterHome ? space.office.id : null };
}
/* v8 ignore stop */
