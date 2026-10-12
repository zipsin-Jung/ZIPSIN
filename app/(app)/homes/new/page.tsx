import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { createHomeAction } from '@/features/homes/actions/create-home';
import { HomeForm } from '@/features/homes/components/HomeForm';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';

export default async function NewHomePage({ searchParams }: { searchParams: Promise<{ office?: string }> }) {
  const { supabase, user } = await requireOnboardingComplete();
  const { office } = await searchParams;
  if (office && !z.uuid().safeParse(office).success) return <Unavailable />;
  let query = supabase.from('office_memberships').select('office_id, office_role')
    .eq('user_id', user.id).eq('status', 'active').is('ended_at', null).lte('started_at', new Date().toISOString());
  if (office) query = query.eq('office_id', office);
  const { data: membership, error } = await query.order('created_at').limit(1).maybeSingle();
  if (error) return <Unavailable failed />;
  if (!membership || membership.office_role !== 'principal_broker') return <Unavailable />;
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <Link href="/home" className="text-sm font-bold text-[#0b695c]">← 홈으로</Link>
      <div className="mb-8 mt-8">
        <p className="text-sm font-bold text-[#0b695c]">집 기록 시작</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#102a43] sm:text-5xl">집 등록하기</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#526b7a]">주소는 집을 구분하는 기준입니다. 등록한 즉시 사진·문서·일정을 이어갈 비공개 공간이 생깁니다.</p>
      </div>
      <HomeForm officeId={membership.office_id} idempotencyKey={randomUUID()} action={createHomeAction} />
    </main>
  );
}

function Unavailable({ failed = false }: { failed?: boolean }) {
  return <main className="mx-auto max-w-2xl px-5 py-16"><p role="alert">{workspaceErrorMessage(failed ? 'server_error' : 'permission_denied')}</p><Link href="/home" className="mt-5 inline-block font-semibold text-emerald-900">업무 홈으로</Link></main>;
}
