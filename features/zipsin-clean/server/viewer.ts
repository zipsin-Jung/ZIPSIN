import 'server-only';
import { cleanSessionDb } from '@/features/zipsin-clean/server/db';

export type CleanViewer = { userId: string; isOperator: boolean; partnerIds: string[]; phoneVerified: boolean } | null;

/** 지금 보는 사람. 로그인하지 않았으면 null. */
export async function getCleanViewer(): Promise<CleanViewer> {
  const db = await cleanSessionDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const [operator, members, profile] = await Promise.all([
    db.from('clean_operators').select('user_id').eq('user_id', user.id).maybeSingle(),
    db.from('clean_partner_members').select('partner_id').eq('user_id', user.id).eq('status', 'active'),
    db.from('profiles').select('phone_verified_at').eq('user_id', user.id).maybeSingle(),
  ]);
  return {
    userId: user.id,
    isOperator: Boolean(operator.data),
    partnerIds: (members.data ?? []).map((row: { partner_id: string }) => row.partner_id),
    phoneVerified: Boolean(profile.data?.phone_verified_at),
  };
}
