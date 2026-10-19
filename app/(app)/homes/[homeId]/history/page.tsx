import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { archiveHomeItemAction, saveHomeItemAction } from '@/features/home-items/actions';
import { HOME_ITEM_CATEGORIES, categoryLabel, monthLabel, sortHomeItems } from '@/features/home-items/domain';

type Props = { params: Promise<{ homeId: string }>; searchParams?: Promise<{ error?: string; saved?: string }> };

/** 집 이력 (v2 시안 V2History): 보일러·도배처럼 집에 남는 품목과 날짜. 사람 이름·연락처는 남기지 않는다. */
export default async function HomeHistoryPage({ params, searchParams }: Props) {
  const { homeId } = await params;
  const query = (await searchParams) ?? {};
  if (!z.uuid().safeParse(homeId).success) return <Unavailable />;
  const { supabase } = await requireOnboardingComplete();
  const { data: home } = await supabase.from('homes').select('id, home_label, address_line1').eq('id', homeId).eq('status', 'active').maybeSingle();
  if (!home) return <Unavailable />;
  const [{ data: rows, error }, { data: canEdit }, { data: repairs }] = await Promise.all([
    supabase.from('home_items').select('id, category, name, installed_on, replaced_on, note').eq('home_id', homeId).eq('status', 'active'),
    supabase.rpc('can_edit_home_items', { p_home_id: homeId }),
    supabase.from('records').select('id, title, occurred_at').eq('home_id', homeId).eq('record_kind', 'repair').eq('repair_stage', 'receipt_attached').order('occurred_at', { ascending: false }).limit(20),
  ]);
  if (error) return <Unavailable />;
  const items = sortHomeItems((rows ?? []).map((row) => ({ id: row.id, category: row.category, name: row.name, installedOn: row.installed_on, replacedOn: row.replaced_on, note: row.note })));
  const label = home.home_label ?? home.address_line1;
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-3 md:py-8">
      <div className="flex items-center gap-1">
        <Link aria-label="집 화면으로" className="-ml-2 grid size-11 place-items-center rounded-lg text-[#212124]" href={`/homes/${homeId}`}><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <h1 className="flex-1 text-[20px] font-bold tracking-[-0.02em] text-[#212124]">집 이력</h1>
      </div>
      <p className="mt-1 text-[15px] text-[#6B7079]">{label}</p>
      <p className="mt-3 rounded-xl bg-[#F2F3F6] px-4 py-3 text-[15px] leading-6 text-[#4D5159]">보일러·도배처럼 집에 남는 정보예요. 사람 이름·연락처·대화는 남기지 않아요.</p>
      {query.error && <p className="mt-3 rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="alert">{query.error === 'invalid' ? '품목 이름과 날짜를 확인해 주세요. 교체일은 설치일보다 빠를 수 없어요.' : '저장하지 못했어요. 권한이 없거나 잠시 문제가 있어요.'}</p>}
      {query.saved && <p className="mt-3 rounded-xl bg-[#E3F0EC] px-4 py-3 text-[15px] font-semibold text-[#083E37]" role="status">저장했어요.</p>}

      {items.length > 0 && (
        <ul aria-label="품목 요약" className="mt-4 flex flex-wrap gap-2">
          {items.slice(0, 6).map((item) => (
            <li className="rounded-lg bg-[#F2F3F6] px-3 py-2 text-[15px]" key={item.id}><strong className="font-semibold text-[#212124]">{item.name}</strong> <span className="text-[#4D5159]">{monthLabel(item.replacedOn ?? item.installedOn) ?? '날짜 모름'}</span></li>
          ))}
        </ul>
      )}

      <section aria-labelledby="items-title" className="mt-5">
        <h2 className="text-[17px] font-bold text-[#212124]" id="items-title">품목 {items.length}개</h2>
        {items.length === 0 ? <p className="mt-2 text-[15px] text-[#6B7079]">아직 남긴 품목이 없어요.</p> : (
          <ul className="mt-1">
            {items.map((item) => (
              <li className="border-b border-[#EAEBEE] py-3" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <strong className="block text-[17px] text-[#212124]">{item.name} <span className="text-[15px] font-normal text-[#6B7079]">{categoryLabel(item.category)}</span></strong>
                    <span className="block text-[15px] text-[#4D5159]">설치 {monthLabel(item.installedOn) ?? '모름'}{item.replacedOn ? ` · 교체 ${monthLabel(item.replacedOn)}` : ''}</span>
                    {item.note && <span className="block text-[15px] text-[#6B7079]">{item.note}</span>}
                  </span>
                  {canEdit === true && (
                    <form action={archiveHomeItemAction}>
                      <input name="homeId" type="hidden" value={homeId} /><input name="itemId" type="hidden" value={item.id} />
                      <button className="min-h-11 shrink-0 px-2 text-sm font-semibold text-[#6B7079] underline underline-offset-4" type="submit">목록에서 내리기</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {repairs && repairs.length > 0 && (
        <section aria-labelledby="repairs-title" className="mt-6">
          <h2 className="text-[17px] font-bold text-[#212124]" id="repairs-title">끝난 수리</h2>
          <ul className="mt-1">
            {repairs.map((repair) => (
              <li className="flex min-h-12 items-center gap-3 border-b border-[#EAEBEE] text-[15px]" key={repair.id}>
                <span className="w-16 shrink-0 text-[#6B7079]">{monthLabel(repair.occurred_at)}</span>
                <span className="text-[#212124]">{repair.title} · 영수증 첨부</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canEdit === true && (
        <form action={saveHomeItemAction} className="mt-6 grid gap-3 rounded-2xl border border-[#EAEBEE] p-4">
          <h2 className="text-[17px] font-bold text-[#212124]">품목 남기기</h2>
          <input name="homeId" type="hidden" value={homeId} />
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">종류
              <select className="min-h-12 rounded-xl border border-[#DCDEE3] bg-white px-3 text-base font-normal" defaultValue="boiler" name="category">
                {HOME_ITEM_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">이름
              <input className="min-h-12 rounded-xl border border-[#DCDEE3] px-3 text-base font-normal" maxLength={40} name="name" placeholder="예: 거실 보일러" required />
            </label>
            <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">설치한 달
              <input className="min-h-12 rounded-xl border border-[#DCDEE3] px-3 text-base font-normal" name="installedOn" type="month" />
            </label>
            <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">교체한 달
              <input className="min-h-12 rounded-xl border border-[#DCDEE3] px-3 text-base font-normal" name="replacedOn" type="month" />
            </label>
          </div>
          <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">메모 (선택)
            <input className="min-h-12 rounded-xl border border-[#DCDEE3] px-3 text-base font-normal" maxLength={200} name="note" placeholder="예: 린나이, 보증 2년" />
          </label>
          <button className="app-primary min-h-14 rounded-xl text-[17px] font-bold text-white" type="submit">저장</button>
        </form>
      )}
    </main>
  );
}

function Unavailable() {
  return <main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-xl font-bold">볼 수 없는 집이에요</h1></main>;
}
