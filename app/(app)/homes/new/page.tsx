import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
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
  if (!membership || membership.office_role !== 'principal_broker') return <Unavailable permission />;
  return (
    <main className="mx-auto max-w-xl px-4 py-4 sm:py-8">
      <div className="mb-4 flex items-center gap-1">
        <Link aria-label="홈으로" className="-ml-2 grid size-11 place-items-center rounded-xl text-[#16211E]" href="/home"><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#16211E]">집 등록하기</h1>
      </div>
      <HomeForm officeId={membership.office_id} idempotencyKey={randomUUID()} action={createHomeAction} />
    </main>
  );
}

function Unavailable({ failed = false, permission = false }: { failed?: boolean; permission?: boolean }) {
  const message = permission
    ? '이 계정으로는 집을 등록할 수 없습니다. 사무소 대표에게 권한을 확인해 주세요.'
    : workspaceErrorMessage(failed ? 'server_error' : 'permission_denied');
  return <main className="mx-auto max-w-2xl px-5 py-16"><p role="alert">{message}</p><Link href="/home" className="mt-5 inline-block font-semibold text-[#0B6655]">업무 홈으로</Link></main>;
}
