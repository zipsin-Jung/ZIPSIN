import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { createHomeAction } from '@/features/homes/actions/create-home';
import { createPersonalHomeAction } from '@/features/homes/actions/create-personal-home';
import { HomeForm } from '@/features/homes/components/HomeForm';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';

const personalErrors: Record<string, string> = {
  input: '주소를 5자 이상 적고, 사는 집인지 세 준 집인지 골라 주세요.',
  phone: '휴대폰 본인 확인을 마친 계정만 집을 추가할 수 있어요.',
  save: '집을 추가하지 못했어요. 잠시 후 다시 시도해 주세요.',
};

export default async function NewHomePage({ searchParams }: { searchParams: Promise<{ office?: string; mine?: string; error?: string }> }) {
  const { supabase, user } = await requireOnboardingComplete();
  const { office, mine, error: personalError } = await searchParams;
  if (mine === '1') return <PersonalHomeForm error={personalError ? personalErrors[personalError] ?? personalErrors.save : undefined} />;
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
        <Link aria-label="홈으로" className="-ml-2 grid size-11 place-items-center rounded-xl text-[#212124]" href="/home"><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#212124]">집 등록하기</h1>
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

/** 고객 모드 "+ 집 추가": 내가 직접 기록할 집. 초대하기 전까지 나만 봐요. */
function PersonalHomeForm({ error }: { error?: string }) {
  const field = 'min-h-14 w-full rounded-xl border border-[#DCDEE3] bg-white px-4 text-base';
  return (
    <main className="mx-auto max-w-xl px-4 py-4 sm:py-8">
      <div className="mb-4 flex items-center gap-1">
        <Link aria-label="홈으로" className="-ml-2 grid size-11 place-items-center rounded-xl text-[#212124]" href="/home"><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#212124]">집 추가</h1>
      </div>
      <p className="text-[15px] leading-6 text-[#4D5159]">내가 직접 기록할 집을 추가해요. 다른 사람을 초대하기 전까지는 나만 볼 수 있어요.</p>
      {error && <p className="mt-3 rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="alert">{error}</p>}
      <form action={createPersonalHomeAction} className="mt-5 grid gap-4">
        <input name="idempotencyKey" type="hidden" value={randomUUID()} />
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-[15px] font-semibold text-[#212124]">어떤 집인가요?</legend>
          <div className="grid grid-cols-2 gap-2">
            {[['tenant', '내가 사는 집', '전세·월세로 살아요'], ['landlord', '세 준 집', '집주인이에요']].map(([value, title, sub], index) => (
              <label className="flex min-h-[72px] cursor-pointer flex-col justify-center rounded-xl border border-[#DCDEE3] px-4 has-[:checked]:border-[#0B6655] has-[:checked]:bg-[#E3F0EC]" key={value}>
                <input className="sr-only" defaultChecked={index === 0} name="relation" required type="radio" value={value} />
                <strong className="text-base text-[#212124]">{title}</strong><span className="text-sm text-[#4D5159]">{sub}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-1.5 text-[15px] font-semibold text-[#212124]" htmlFor="address-line1">주소
          <input autoComplete="street-address" className={field} id="address-line1" maxLength={200} minLength={5} name="addressLine1" placeholder="예: 서울 노원구 공릉로 10" required />
        </label>
        <label className="grid gap-1.5 text-[15px] font-semibold text-[#212124]" htmlFor="address-detail">동·호수 (선택)
          <input className={field} id="address-detail" maxLength={120} name="addressDetail" placeholder="예: 102동 1203호" />
        </label>
        <label className="grid gap-1.5 text-[15px] font-semibold text-[#212124]" htmlFor="home-label">부르는 이름 (선택)
          <input className={field} id="home-label" maxLength={80} name="homeLabel" placeholder="예: 우리집, 공릉 원룸" />
        </label>
        <button className="app-primary min-h-14 rounded-xl text-[17px] font-bold text-white" type="submit">집 추가하기</button>
      </form>
    </main>
  );
}
