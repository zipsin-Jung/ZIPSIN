import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { RecordForm } from '@/features/records/components/RecordForm';

export default async function NewRecordPage({ params }: { params: Promise<{ homeId: string }> }) {
  const { homeId } = await params; if (!z.uuid().safeParse(homeId).success) return <Denied />;
  const { supabase } = await requireOnboardingComplete();
  const { data: home } = await supabase.from('homes').select('id, office_id, home_label, address_line1').eq('id', homeId).eq('status', 'active').maybeSingle();
  if (!home?.office_id) return <Denied />;
  return <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16"><Link href={`/homes/${homeId}`} className="text-sm font-bold text-[#0b695c]">← 집 기록으로</Link><p className="mt-7 text-sm font-bold text-[#0b695c]">{home.home_label ?? home.address_line1}</p><h1 className="mb-8 mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#102a43]">새 기록 남기기</h1><RecordForm homeId={homeId} officeId={home.office_id} idempotencyKey={randomUUID()} /></main>;
}
function Denied() { return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">이 집에 기록을 남길 수 없습니다.</p></main>; }
