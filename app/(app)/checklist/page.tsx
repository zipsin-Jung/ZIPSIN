import Link from 'next/link';
import { ArrowRight, Download, CalendarClock, ClipboardList, Hammer, Home, Lightbulb, PackageOpen, PenLine, Sofa } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { ChecklistItems } from '@/features/checklist/components/ChecklistItems';
import { STAGES, type StageId } from '@/features/checklist/domain';
import { loadSpaceHomes } from '@/features/workspace/services/space-homes';

type Props = { searchParams?: Promise<{ stage?: string; home?: string }> };

const icons: Record<StageId, typeof Home> = {
  before_contract: ClipboardList, contract_day: PenLine, before_move_in: Hammer, after_move_in: Home, living: Sofa, before_expiry: CalendarClock, move_out: PackageOpen,
};

/** 체크리스트 (대표 Figma "체크리스트"). 체크한 항목은 바로 저장되고 나만 본다. */
export default async function ChecklistPage({ searchParams }: Props) {
  const query = (await searchParams) ?? {};
  const stage = STAGES.find((candidate) => candidate.id === query.stage) ?? STAGES[0];
  const nextStage = STAGES[STAGES.indexOf(stage) + 1];
  const { supabase, user } = await requireOnboardingComplete();
  const space = await loadSpaceHomes(supabase, user.id, query.home);
  // 계약 전에는 집이 없을 수 있어서 '집 없이'로 저장한다. 계약 당일부터는 고른 집에 연결한다.
  const home = stage.id === 'before_contract' || !space.ok ? null : space.selected;
  let checkedQuery = supabase.from('checklist_checks').select('item_key').eq('user_id', user.id).eq('stage', stage.id);
  checkedQuery = home ? checkedQuery.eq('home_id', home.id) : checkedQuery.is('home_id', null);
  const { data: checked } = await checkedQuery;
  const href = (stageId: string) => `/checklist?stage=${stageId}${home ? `&home=${home.id}` : ''}`;
  return (
    <main className="mx-auto max-w-[1120px] px-4 pt-4 md:px-10 md:pt-8">
      <div className="flex items-start gap-3">
        <ClipboardList aria-hidden="true" className="mt-1 size-9 text-[#212124]" strokeWidth={1.4} />
        <div className="flex-1">
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[#212124] md:text-[28px]">체크리스트</h1>
          <p className="text-[15px] text-[#4D5159]">놓치기 쉬운 항목을 한눈에 확인하세요.</p>
        </div>
        <p className="hidden rounded-lg bg-[#F2F3F6] px-4 py-3 text-sm leading-5 text-[#4D5159] md:block">체크한 항목은<br />자동 저장돼요.</p>
      </div>

      <nav aria-label="단계" className="-mx-4 mt-5 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex min-w-max gap-1 rounded-2xl border border-[#E4E6EA] bg-white p-1.5 md:grid md:min-w-0 md:grid-cols-7">
          {STAGES.map((item) => {
            const Icon = icons[item.id];
            const current = item.id === stage.id;
            return (
              <li key={item.id}>
                <Link aria-current={current ? 'page' : undefined} className={`flex min-h-[72px] w-[84px] flex-col items-center justify-center gap-1 rounded-xl text-sm md:w-auto ${current ? 'border border-[#212124] bg-white font-bold text-[#212124]' : 'font-semibold text-[#4D5159] hover:bg-[#F7F7F8]'}`} href={href(item.id)}>
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />{item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="stage-title" className="mt-4 rounded-2xl border border-[#E4E6EA] bg-white p-5 md:p-7">
        <h2 className="text-[20px] font-bold text-[#212124] underline decoration-[#212124] decoration-2 underline-offset-[6px]" id="stage-title">{stage.title}</h2>
        <p className="mt-2 text-[15px] text-[#4D5159]">{stage.lead}</p>
        {stage.id !== 'before_contract' && space.ok && (
          <p className="mt-2 text-sm text-[#6B7079]">{home ? <>집: <strong className="text-[#212124]">{home.label}</strong>{space.homes.length > 1 && <> · {space.homes.filter((item) => item.id !== home.id).map((item) => <Link className="ml-1 font-semibold text-[#0B6655] underline underline-offset-2" href={`/checklist?stage=${stage.id}&home=${item.id}`} key={item.id}>{item.label}</Link>)}</>}</> : '집이 연결되기 전이라 나만 보는 체크로 저장돼요.'}</p>
        )}
        <div className="mt-4"><ChecklistItems homeId={home?.id ?? null} initialChecked={(checked ?? []).map((row) => row.item_key)} key={`${stage.id}-${home?.id ?? 'none'}`} stage={stage} /></div>
      </section>

      <p className="mt-4 flex items-center gap-3 rounded-2xl border border-[#E4E6EA] bg-white px-5 py-4 text-[15px] leading-6 text-[#4D5159]">
        <Lightbulb aria-hidden="true" className="size-6 shrink-0 text-[#4D5159]" strokeWidth={1.6} />
        기록은 분쟁을 예방하고 내 권리를 지키는 증거가 돼요. 사진과 메모를 함께 남겨 두세요.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <span aria-disabled="true" className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-[#DCDEE3] text-base font-semibold text-[#9EA3AB]"><Download aria-hidden="true" className="size-5" />PDF 저장<span className="rounded bg-[#F2F3F6] px-1.5 py-0.5 text-[12px] text-[#6B7079]">준비 중</span></span>
        {nextStage
          ? <Link className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-[#212124] text-base font-semibold text-[#212124]" href={href(nextStage.id)}>다음 단계로 이동 · {nextStage.label}<ArrowRight aria-hidden="true" className="size-5" /></Link>
          : <Link className="flex min-h-14 items-center justify-center rounded-xl border border-[#212124] text-base font-semibold text-[#212124]" href="/home">내 집으로</Link>}
      </div>
    </main>
  );
}
