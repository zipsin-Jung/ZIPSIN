import Link from 'next/link';
import { FileText, Image as ImageIcon, MessageCircle } from 'lucide-react';

type PrimaryRole = 'principal_broker' | 'associate_broker' | 'assistant' | 'landlord' | 'tenant';
type OfficeSummary = { id: string; name: string; canRegisterHome?: boolean };
type ContractDay = { label: string; days: number } | null;
type HomeTask = { id: string; title: string; dueAt: string | null } | null;
type RecentHome = { id: string; label: string; address: string; contractDay?: ContractDay; openTask?: HomeTask };
type NextTask = { id: string; homeId: string; title: string; dueAt: string | null };

function SingleHome({ home, unreadChatCount }: { home: RecentHome; unreadChatCount: number }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <section className="overflow-hidden rounded-[30px] border border-[#d8e3e0] bg-white shadow-[0_24px_70px_rgba(20,54,57,.08)]">
        <div className="grid lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-6 sm:p-9 lg:p-11">
            <p className="text-sm font-extrabold text-[#0B6655]">내 집에서 이어지는 기록</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-[#16211E] sm:text-5xl">{home.label}</h1>
            <p className="mt-3 text-sm leading-6 text-[#5D6A65]">{home.address}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#E3F0EC] px-5 py-5"><p className="text-sm font-bold text-[#476772]">계약 만기</p><p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#0B6655]">{home.contractDay?.label ?? '날짜 확인'}</p></div>
              <div className="rounded-2xl border border-[#dfe8e6] px-5 py-5"><p className="text-sm font-bold text-[#476772]">지금 할 일</p><p className="mt-1 font-black leading-6 text-[#16211E]">{home.openTask?.title ?? '집의 다음 기록을 확인해 보세요'}</p></div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link aria-label={`${home.label} 열기`} className="app-primary inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-white" href={`/homes/${home.id}`}>집 기록 열기</Link>
              <Link aria-label={unreadChatCount ? `읽지 않은 메시지 ${unreadChatCount}개 확인` : '집 대화 보기'} className="app-panel inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-[#3E4B47]" href="/chats">{unreadChatCount ? `새 집 대화 ${unreadChatCount}개` : '집 대화 보기'}</Link>
            </div>
          </div>
          <div className="min-h-72 bg-[linear-gradient(145deg,#e9f2ef,#d9e7e2)] p-6 sm:p-8">
            <div className="flex h-full min-h-60 flex-col justify-between rounded-[24px] border border-white/70 bg-white/75 p-6 backdrop-blur">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0B6655] shadow-sm"><ImageIcon aria-hidden="true" size={25} /></div>
              <div><p className="text-sm font-extrabold text-[#0B6655]">최근 사진과 문서</p><p className="mt-2 text-xl font-black text-[#16211E]">아직 등록된 사진이 없습니다</p><p className="mt-2 text-sm leading-6 text-[#5D6A65]">실제 집 사진을 등록하면 이 집의 기록에서 안전하게 확인할 수 있습니다.</p></div>
            </div>
          </div>
        </div>
        <div className="grid border-t border-[#e3ebe8] bg-[#fbfcfc] sm:grid-cols-3">
          <Link href={`/homes/${home.id}`} className="flex min-h-24 items-center gap-4 border-b border-[#e3ebe8] px-6 sm:border-b-0 sm:border-r"><ImageIcon size={20} className="text-[#0B6655]" /><span><strong className="block text-sm text-[#16211E]">사진 기록</strong><small className="mt-1 block text-[#5D6A65]">집에서 확인</small></span></Link>
          <Link href={`/homes/${home.id}`} className="flex min-h-24 items-center gap-4 border-b border-[#e3ebe8] px-6 sm:border-b-0 sm:border-r"><FileText size={20} className="text-[#0B6655]" /><span><strong className="block text-sm text-[#16211E]">계약·문서</strong><small className="mt-1 block text-[#5D6A65]">최근 자료 확인</small></span></Link>
          <Link href="/chats" className="flex min-h-24 items-center gap-4 px-6"><MessageCircle size={20} className="text-[#0B6655]" /><span><strong className="block text-sm text-[#16211E]">집 대화</strong><small className="mt-1 block text-[#5D6A65]">{unreadChatCount ? `새 대화 ${unreadChatCount}개` : '새 메시지 없음'}</small></span></Link>
        </div>
      </section>
    </main>
  );
}

function MultiHome({ homes, office, unreadChatCount }: { homes: RecentHome[]; office?: OfficeSummary; unreadChatCount: number }) {
  const canRegisterHome = office?.canRegisterHome ?? false;
  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#0B6655]">{office?.name ?? '내가 확인할 집'}</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-[#16211E] sm:text-5xl">오늘 확인할 집</h1>
          <p className="mt-3 text-[#5D6A65]">만기가 가깝거나 아직 끝내지 못한 일을 먼저 보여드려요.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link aria-label={unreadChatCount ? `읽지 않은 메시지 ${unreadChatCount}개 확인` : '집 대화 보기'} className="app-panel inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-[#3E4B47]" href="/chats">{unreadChatCount ? `집 대화 ${unreadChatCount}` : '집 대화'}</Link>
          {canRegisterHome && office && <Link className="app-primary inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-white" href={`/homes/new?office=${office.id}`}>집 등록하기</Link>}
        </div>
      </header>

      <section aria-label="우선 확인할 집" className="mt-8 grid gap-4 lg:grid-cols-2">
        {homes.map((home) => (
          <Link className="app-panel group overflow-hidden rounded-[24px] transition hover:-translate-y-0.5 hover:border-[#9bc7c0]" href={`/homes/${home.id}`} key={home.id}>
            <div className="grid grid-cols-[88px_1fr] gap-4 p-5 sm:grid-cols-[104px_1fr]">
              <div className="flex min-h-24 flex-col items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#e9f2ef,#d8e5e1)] text-[#50716c]"><ImageIcon aria-hidden="true" size={22} /><span className="mt-2 text-xs font-bold">사진 없음</span></div>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-sm font-bold text-[#5D6A65]">{home.address}</p><h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#16211E]">{home.label}</h2></div>
                  {home.contractDay && <span className="shrink-0 rounded-full bg-[#E3F0EC] px-3 py-2 text-sm font-black text-[#0B6655]">{home.contractDay.label}</span>}
                </div>
                <div className="mt-4 border-t border-[#e3ebe8] pt-3"><p className="text-xs font-extrabold text-[#0B6655]">다음 확인</p><p className="mt-1 font-bold text-[#3E4B47]">{home.openTask?.title ?? (home.contractDay ? '만기 계획과 기록 확인' : '최근 기록 확인')}</p></div>
              </div>
            </div>
          </Link>
        ))}
      </section>
      <div className="mt-6"><Link className="text-sm font-extrabold text-[#0B6655]" href={office ? `/homes?office=${office.id}` : '/homes'}>전체 집 보기 →</Link></div>
    </main>
  );
}

export function HomeStart({
  primaryRole,
  offices,
  createOfficeAction,
  recentHomes = [],
  unreadChatCount = 0,
}: {
  primaryRole: PrimaryRole | null;
  offices: OfficeSummary[];
  createOfficeAction?: (formData: FormData) => void | Promise<void>;
  recentHomes?: RecentHome[];
  unreadChatCount?: number;
  nextTask?: NextTask | null;
}) {
  const office = offices[0];

  if (recentHomes.length === 1) return <SingleHome home={recentHomes[0]} unreadChatCount={unreadChatCount} />;
  if (recentHomes.length > 1) return <MultiHome homes={recentHomes} office={office} unreadChatCount={unreadChatCount} />;

  if (office) {
    const canRegisterHome = office.canRegisterHome ?? primaryRole === 'principal_broker';
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="app-panel rounded-[28px] p-7 sm:p-10">
          <p className="text-sm font-extrabold text-[#0B6655]">{office.name}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#16211E]">아직 등록된 집이 없습니다</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[#5D6A65]">집이 등록되거나 초대가 연결되면 만기와 할 일을 이곳에서 바로 확인할 수 있습니다.</p>
          <div className="mt-6 flex flex-wrap gap-4">
            {canRegisterHome && <Link className="app-primary inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-white" href={`/homes/new?office=${office.id}`}>집 등록하기</Link>}
            <Link className="inline-flex min-h-12 items-center text-sm font-extrabold text-[#0B6655]" href="/chats">새 메시지가 없습니다</Link>
          </div>
        </section>
      </main>
    );
  }

  if (primaryRole !== 'principal_broker') {
    const officeMember = primaryRole === 'assistant' || primaryRole === 'associate_broker';
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="app-panel rounded-[28px] p-7 sm:p-10">
          <p className="text-sm font-extrabold text-[#0B6655]">아직 연결된 집이 없습니다</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#16211E]">{officeMember ? '사무소 초대 링크를 확인해 주세요' : '집 초대 링크를 확인해 주세요'}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5D6A65]">역할을 선택한 것만으로 사무소나 집 기록이 열리지는 않습니다. 받은 초대 링크를 열어 수락하면 허용된 집과 대화가 이 홈에 나타납니다.</p>
          {!officeMember && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5D6A65]">주소를 검색해 다른 사람의 기록에 연결할 수 없습니다.</p>}
          <Link href="/chats" className="mt-6 inline-flex text-sm font-extrabold text-[#0B6655]">새 메시지가 없습니다</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div className="pt-4">
          <p className="text-sm font-extrabold text-[#0B6655]">집신 업무 시작</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#16211E]">사무소 공간을 먼저 만드세요</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[#5D6A65]">사무소를 만든 뒤 첫 집을 등록하고 구성원을 초대할 수 있습니다. 각자는 자기 계정으로 사용합니다.</p>
        </div>
        <form action={createOfficeAction} className="app-panel rounded-[28px] p-6 sm:p-8">
          <label className="text-sm font-bold text-slate-900" htmlFor="office-name">사무소 이름</label>
          <input className="mt-3 min-h-14 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/10" id="office-name" maxLength={100} minLength={2} name="name" placeholder="예: 집신 공인중개사무소" required />
          <p className="mt-3 text-sm leading-6 text-slate-500">사무소 구성원만 사용하는 비공개 공간입니다.</p>
          <button className="app-primary mt-7 min-h-14 w-full rounded-2xl px-5 font-extrabold text-white" type="submit">사무소 만들기</button>
        </form>
      </section>
    </main>
  );
}
