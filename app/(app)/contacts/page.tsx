import Link from 'next/link';
import { Phone, Plus, Trash2, UserRound } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { addContactAction, deleteContactAction } from '@/features/contacts/actions';
import { CONTACT_CATEGORIES, categoryLabel } from '@/features/contacts/domain';
import { loadSpaceHomes } from '@/features/workspace/services/space-homes';

type Props = { searchParams?: Promise<{ home?: string; error?: string; saved?: string }> };

const errors: Record<string, string> = { input: '이름을 적고 종류를 골라 주세요.', phone: '전화번호를 다시 확인해 주세요.', save: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' };

/** 주소록: 계약한 부동산, 임대인, 기사님, 이사업체 등 집 관련 연락처. 나만 본다. */
export default async function ContactsPage({ searchParams }: Props) {
  const query = (await searchParams) ?? {};
  const { supabase, user } = await requireOnboardingComplete();
  const space = await loadSpaceHomes(supabase, user.id);
  const homes = space.ok ? space.homes : [];
  const { data, error } = await supabase.from('home_contacts').select('id, home_id, category, name, phone, memo').eq('user_id', user.id).order('created_at', { ascending: false });
  const contacts = data ?? [];
  const homeFilter = query.home && homes.some((home) => home.id === query.home) ? query.home : null;
  const shown = homeFilter ? contacts.filter((contact) => contact.home_id === homeFilter) : contacts;
  const labelOf = new Map(homes.map((home) => [home.id, home.label]));
  const field = 'min-h-12 w-full rounded-xl border border-[#DCDEE3] bg-white px-3 text-base font-normal';
  return (
    <main className="mx-auto max-w-[1120px] px-4 pt-4 md:px-10 md:pt-8">
      <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#212124] md:text-[30px]">주소록</h1>
      <p className="mt-1 text-[15px] text-[#4D5159]">계약한 부동산, 임대인, 기사님, 이사업체 연락처를 집별로 모아 둬요. 나만 볼 수 있어요.</p>
      {query.error && <p className="mt-3 rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="alert">{errors[query.error] ?? errors.save}</p>}
      {query.saved && <p className="mt-3 rounded-xl bg-[#E3F0EC] px-4 py-3 text-[15px] font-semibold text-[#083E37]" role="status">저장했어요.</p>}
      {error && <p className="mt-3 rounded-xl bg-[#F2F3F6] px-4 py-3 text-[15px] text-[#4D5159]" role="status">주소록을 불러오지 못했어요. 업데이트가 적용되면 쓸 수 있어요.</p>}

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="contact-list">
          <h2 className="sr-only" id="contact-list">연락처 목록</h2>
          {homes.length > 0 && (
            <nav aria-label="집 고르기" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <ul className="flex min-w-max gap-2">
                <li><Link aria-current={!homeFilter ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] ${!homeFilter ? 'bg-[#212124] font-semibold text-white' : 'border border-[#DCDEE3] text-[#212124]'}`} href="/contacts">전체 {contacts.length}</Link></li>
                {homes.map((home) => <li key={home.id}><Link aria-current={homeFilter === home.id ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] ${homeFilter === home.id ? 'bg-[#212124] font-semibold text-white' : 'border border-[#DCDEE3] text-[#212124]'}`} href={`/contacts?home=${home.id}`}>{home.label}</Link></li>)}
              </ul>
            </nav>
          )}
          {shown.length ? (
            <ul className="mt-3">
              {shown.map((contact) => (
                <li className="flex items-center gap-3 border-b border-[#EAEBEE] py-3" key={contact.id}>
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F2F3F6] text-[#4D5159]"><UserRound className="size-5" strokeWidth={1.6} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-base text-[#212124]">{contact.name} <span className="text-sm font-semibold text-[#0B6655]">{categoryLabel(contact.category)}</span></strong>
                    <span className="block truncate text-sm text-[#6B7079]">{[contact.home_id ? labelOf.get(contact.home_id) ?? '집' : '집 없음', contact.memo].filter(Boolean).join(' · ')}</span>
                  </span>
                  {contact.phone && <a aria-label={`${contact.name}에게 전화 ${contact.phone}`} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[#DCDEE3] px-3 text-[15px] font-semibold text-[#212124]" href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}><Phone aria-hidden="true" className="size-4" /><span className="hidden sm:inline">{contact.phone}</span><span className="sm:hidden">전화</span></a>}
                  <form action={deleteContactAction}>
                    <input name="id" type="hidden" value={contact.id} />
                    <button aria-label={`${contact.name} 지우기`} className="grid size-11 place-items-center rounded-lg text-[#9EA3AB] hover:text-[#8C1D18]" type="submit"><Trash2 aria-hidden="true" className="size-5" /></button>
                  </form>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 rounded-xl border border-[#EAEBEE] px-4 py-10 text-center text-[15px] text-[#6B7079]">아직 저장한 연락처가 없어요.</p>}
        </section>

        <form action={addContactAction} className="grid content-start gap-3 rounded-2xl border border-[#E4E6EA] bg-white p-5">
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-[#212124]"><Plus aria-hidden="true" className="size-5" />연락처 추가</h2>
          <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">종류
            <select className={field} defaultValue="agent" name="category">{CONTACT_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>
          </label>
          <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">이름
            <input className={field} maxLength={40} name="name" placeholder="예: 공릉공인중개사, 김 기사님" required />
          </label>
          <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">전화번호 (선택)
            <input autoComplete="off" className={field} inputMode="tel" maxLength={30} name="phone" placeholder="010-0000-0000" />
          </label>
          <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">어느 집
            <select className={field} defaultValue={homeFilter ?? homes[0]?.id ?? ''} name="homeId">
              <option value="">집 없이 저장</option>
              {homes.map((home) => <option key={home.id} value={home.id}>{home.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-[15px] font-semibold text-[#212124]">메모 (선택)
            <input className={field} maxLength={200} name="memo" placeholder="예: 보일러 담당, 평일 오전만 통화" />
          </label>
          <button className="app-primary min-h-12 rounded-xl text-base font-bold text-white" type="submit">저장</button>
          <p className="text-sm text-[#6B7079]">상대방에게 알리거나 공유하지 않아요.</p>
        </form>
      </div>
    </main>
  );
}
