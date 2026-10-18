import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, X } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { principalOfficeId } from '@/features/workspace/services/principal-office';

/** 아래 메뉴 '+'(기록하기): 어느 집인지 먼저 고른다. 집이 하나면 바로 그 집 기록하기로 간다. */
export default async function PickHomeForRecordPage() {
  const { supabase, user } = await requireOnboardingComplete();
  const { data: homes, error } = await supabase.from('homes').select('id, home_label, address_line1, address_detail').eq('status', 'active').order('updated_at', { ascending: false });
  if (error) return <main className="mx-auto max-w-xl px-5 py-16"><p role="alert">집 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p></main>;
  if (homes?.length === 1) redirect(`/homes/${homes[0].id}/records/new`);
  // 집이 없을 때: 집을 등록할 수 있는 사람(대표 공인중개사)에게만 '집 등록'을 안내한다. 나머지는 초대를 기다린다.
  const registerOffice = homes?.length ? null : await principalOfficeId(supabase, user.id);
  return (
    <main className="mx-auto max-w-xl px-4 py-4 sm:py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#16211E]">기록하기</h1>
        <Link aria-label="닫기" className="grid size-11 place-items-center rounded-xl text-[#16211E]" href="/home"><X aria-hidden="true" className="size-6" /></Link>
      </div>
      <h2 className="mb-2 text-base font-bold text-[#16211E]">어느 집인가요?</h2>
      {homes?.length ? (
        <ul className="grid gap-2">
          {homes.map((home) => (
            <li key={home.id}>
              <Link className="flex min-h-16 items-center gap-3 rounded-xl border border-[#E1E6E3] bg-white px-4 hover:border-[#0B6655]" href={`/homes/${home.id}/records/new`}>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[17px]">{home.home_label ?? home.address_line1}</strong>
                  <span className="block truncate text-[15px] text-[#3E4B47]">{home.address_line1}{home.address_detail ? ` · ${home.address_detail}` : ''}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-5 text-[#5D6A65]" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[20px] border border-[#E1E6E3] bg-white p-8 text-center">
          <p className="text-base font-bold">아직 기록할 집이 없어요.</p>
          {registerOffice ? (
            <>
              <p className="mt-1 text-[15px] text-[#5D6A65]">집을 먼저 등록하면 바로 기록할 수 있어요.</p>
              <Link className="app-primary mt-4 inline-flex min-h-12 items-center rounded-xl px-5 font-bold text-white" href={`/homes/new?office=${registerOffice}`}>집 등록하기</Link>
            </>
          ) : (
            <>
              <p className="mt-1 text-[15px] text-[#5D6A65]">받은 초대 링크를 수락하면 그 집이 여기에 보여요.</p>
              <Link className="mt-4 inline-flex min-h-12 items-center font-semibold text-[#0B6655]" href="/home">홈으로</Link>
            </>
          )}
        </div>
      )}
    </main>
  );
}
