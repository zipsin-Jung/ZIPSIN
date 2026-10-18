import Link from 'next/link';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

export default async function SupportInboxPage() {
  const { supabase, user } = await requireOnboardingComplete();
  const { data: authorization } = await supabase.from('support_authorizations').select('id').eq('user_id', user.id).is('revoked_at', null).maybeSingle();
  if (!authorization) return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">고객지원 문의함에 접근할 수 없습니다.</p><Link href="/support" className="mt-5 inline-block font-bold text-[#0B6655]">고객지원으로</Link></main>;
  const { data: memberships } = await supabase.from('chat_room_memberships').select('room_id').eq('user_id', user.id).eq('status', 'active').is('ended_at', null);
  const ids = memberships?.map((membership) => membership.room_id) ?? [];
  const { data: rooms } = ids.length ? await supabase.from('chat_rooms').select('id, support_status, created_at').in('id', ids).eq('room_type', 'support').eq('status', 'active').order('created_at', { ascending: false }) : { data: [] };
  return <main className="mx-auto max-w-4xl px-5 py-14"><p className="text-sm font-bold text-[#0B6655]">대표 직속</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em]">고객지원 받은 문의</h1><p className="mt-3 text-[#5D6A65]">이 권한은 고객지원 방에만 적용되며 일반 사용자 대화는 볼 수 없습니다.</p><ul className="mt-8 grid gap-3">{(rooms ?? []).map((room) => <li key={room.id}><Link href={`/support?room=${room.id}`} className="app-panel flex items-center justify-between rounded-2xl p-5"><strong>고객 문의</strong><span className={`rounded-full px-3 py-1 text-xs font-bold ${room.support_status === 'waiting' ? 'bg-amber-100 text-amber-800' : room.support_status === 'resolved' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'}`}>{room.support_status === 'waiting' ? '답변 대기' : room.support_status === 'resolved' ? '해결됨' : '답변 완료'}</span></Link></li>)}{!rooms?.length && <li className="app-panel rounded-2xl p-8 text-center text-[#5D6A65]">아직 들어온 문의가 없습니다.</li>}</ul></main>;
}
