import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { startPartnerApplicationAction } from '@/features/partners/actions';
import { STATUS_LABEL } from '@/features/partners/domain';

type Props = { searchParams?: Promise<{ error?: string; kind?: string }> };

const errors: Record<string, string> = {
  name: '사무소 이름을 2~60자로 적어 주세요.',
  phone: '휴대폰 본인 확인을 마친 계정만 등록할 수 있어요.',
  save: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
};

/** 집신 파트너 등록 (v2 시안 V2Partner, DEC-038·DEC-040). 아이디는 그대로, 사업자 서류 확인 뒤 승인. */
export default async function NewPartnerPage({ searchParams }: Props) {
  const query = (await searchParams) ?? {};
  const { supabase, user } = await requireOnboardingComplete();
  const { data: applications } = await supabase.from('partner_applications').select('id, partner_kind, business_name, status').eq('user_id', user.id).in('status', ['draft', 'submitted', 'approved', 'rejected']).order('created_at', { ascending: false });
  const choosingBroker = query.kind === 'broker';
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-3 md:py-8">
      <div className="flex items-center gap-1">
        <Link aria-label="마이로" className="-ml-2 grid size-11 place-items-center rounded-lg text-[#212124]" href={choosingBroker ? '/partners/new' : '/my'}><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <h1 className="flex-1 text-[20px] font-bold tracking-[-0.02em] text-[#212124]">{choosingBroker ? '공인중개사무소 등록' : '집신 파트너 등록'}</h1>
      </div>
      {query.error && <p className="mt-3 rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="alert">{errors[query.error] ?? errors.save}</p>}

      {applications && applications.length > 0 && !choosingBroker && (
        <section aria-label="내 신청" className="mt-4">
          {applications.map((application) => (
            <Link className="flex min-h-16 items-center gap-3 rounded-xl border border-[#EAEBEE] px-4" href={`/partners/${application.id}`} key={application.id}>
              <span className="min-w-0 flex-1"><strong className="block truncate text-base text-[#212124]">{application.business_name}</strong><span className="text-[15px] text-[#6B7079]">{STATUS_LABEL[application.status]}</span></span>
              <ChevronRight aria-hidden="true" className="size-5 text-[#6B7079]" />
            </Link>
          ))}
        </section>
      )}

      {choosingBroker ? (
        <form action={startPartnerApplicationAction} className="mt-5 grid gap-3">
          <input name="kind" type="hidden" value="broker" />
          <label className="text-[15px] font-semibold text-[#212124]" htmlFor="business-name">사무소 이름</label>
          <input className="min-h-14 rounded-xl border border-[#DCDEE3] px-4 text-base" id="business-name" maxLength={60} minLength={2} name="businessName" placeholder="예: 공릉공인중개사사무소" required />
          <p className="text-[15px] leading-6 text-[#4D5159]">다음 화면에서 사업자등록증 · 중개사무소 등록증 · 대표 공인중개사 자격증을 올려요.</p>
          <button className="app-primary min-h-14 rounded-xl text-[17px] font-bold text-white" type="submit">다음</button>
        </form>
      ) : (
        <>
          <p className="mt-3 text-[15px] leading-6 text-[#4D5159]">아이디는 그대로예요. 승인되면 위 이름(▾)에서 바꿔 쓸 수 있어요.</p>
          <h2 className="mt-5 text-[15px] font-bold text-[#6B7079]">사업자 파트너 · 서류 확인 뒤 승인</h2>
          <ul className="mt-1">
            <li className="border-b border-[#EAEBEE]">
              <Link className="flex min-h-[76px] items-center gap-3 py-2" href="/partners/new?kind=broker">
                <span className="min-w-0 flex-1"><strong className="block text-[17px] text-[#212124]">공인중개사무소</strong><span className="block text-[15px] text-[#6B7079]">사업자등록증 · 중개사무소 등록증 · 대표 공인중개사 자격증</span></span>
                <ChevronRight aria-hidden="true" className="size-5 text-[#6B7079]" />
              </Link>
            </li>
            {[['수리 · 인테리어 업체', '집신수리'], ['청소 업체', '집신청소']].map(([title, service]) => (
              <li className="flex min-h-[76px] items-center gap-3 border-b border-[#EAEBEE] py-2" key={title}>
                <span className="min-w-0 flex-1"><strong className="block text-[17px] text-[#6B7079]">{title}</strong><span className="block text-[15px] text-[#6B7079]">{service} 준비 중</span></span>
                <span className="rounded-md bg-[#F2F3F6] px-2 py-0.5 text-sm font-semibold text-[#4D5159]">준비 중</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-5 text-[15px] font-bold text-[#6B7079]">개인 파트너 · 사업자 없이</h2>
          <div className="flex min-h-[76px] items-center gap-3 border-b border-[#EAEBEE] py-2">
            <span className="min-w-0 flex-1"><strong className="block text-[17px] text-[#6B7079]">이모님 · 개인 기사님</strong><span className="block text-[15px] text-[#6B7079]">법률 확인이 끝나면 열려요.</span></span>
            <span className="rounded-md bg-[#F2F3F6] px-2 py-0.5 text-sm font-semibold text-[#4D5159]">준비 중</span>
          </div>
        </>
      )}
    </main>
  );
}
