import Link from 'next/link';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { PeoplePanel } from '@/features/relationships/components/PeoplePanel';

export default async function HomePeoplePage({ params }: { params: Promise<{ homeId: string }> }) {
  const { homeId } = await params;
  if (!z.uuid().safeParse(homeId).success) return <Unavailable />;
  const { supabase } = await requireOnboardingComplete();
  const { data: home } = await supabase.from('homes').select('id, home_label, address_line1').eq('id', homeId).eq('status', 'active').maybeSingle();
  if (!home) return <Unavailable />;
  const [{ data: contracts }, { data: people }] = await Promise.all([
    supabase.from('contracts').select('id, contract_kind').eq('home_id', homeId).eq('status', 'active'),
    supabase.from('home_memberships').select('id, relationship_role, access_scope, expires_at').eq('home_id', homeId).eq('status', 'active').is('ended_at', null),
  ]);
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16"><Link href={`/homes/${homeId}`} className="text-sm font-bold text-[#0B6655]">← 집 기록으로</Link><p className="mt-7 text-sm font-bold text-[#0B6655]">현재 관계만 안전하게</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#16211E]">{home.home_label ?? home.address_line1} · 사람</h1><div className="mt-8"><PeoplePanel homeId={homeId} contracts={contracts ?? []} people={people ?? []} /></div></main>;
}

function Unavailable() { return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">이 집의 관계자를 확인할 수 없습니다.</p><Link href="/homes" className="mt-5 inline-block font-bold text-[#0B6655]">집 목록으로</Link></main>; }
