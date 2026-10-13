import Link from 'next/link';

type PrimaryRole = 'principal_broker' | 'associate_broker' | 'assistant' | 'landlord' | 'tenant';
type OfficeSummary = { id: string; name: string; canRegisterHome?: boolean };
type ContractDay = { label: string; days: number } | null;
type HomeTask = { id: string; title: string; dueAt: string | null } | null;
type RecentHome = { id: string; label: string; address: string; contractDay?: ContractDay; openTask?: HomeTask };
type NextTask = { id: string; homeId: string; title: string; dueAt: string | null };

function SingleHome({ home, unreadChatCount }: { home: RecentHome; unreadChatCount: number }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-[#d8e3e0] bg-white shadow-[0_24px_70px_rgba(20,54,57,.08)]">
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-extrabold text-[#0b695c]">내 집에서 이어지는 기록</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-[#102a43] sm:text-5xl">{home.label}</h1>
            <p className="mt-3 text-sm leading-6 text-[#607785]">{home.address}</p>
          </div>
          <div className="rounded-2xl bg-[#edf7f4] px-6 py-5 lg:min-w-48">
            <p className="text-sm font-bold text-[#476772]">계약 만기</p>
            <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-[#0b695c]">{home.contractDay?.label ?? '날짜 확인'}</p>
          </div>
        </div>
        <div className="border-t border-[#e3ebe8] bg-[#fbfcfc] p-6 sm:p-9">
          <p className="text-sm font-extrabold text-[#0b695c]">지금 할 일</p>
          <p className="mt-2 text-xl font-black text-[#102a43]">{home.openTask?.title ?? '집의 다음 기록을 확인해 보세요'}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link aria-label={`${home.label} 열기`} className="app-primary inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-white" href={`/homes/${home.id}`}>집 기록 열기</Link>
            <Link aria-label={unreadChatCount ? `읽지 않은 메시지 ${unreadChatCount}개 확인` : '집 대화 보기'} className="app-panel inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-[#244657]" href="/chats">{unreadChatCount ? `새 집 대화 ${unreadChatCount}개` : '집 대화 보기'}</Link>
          </div>
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
          <p className="text-sm font-extrabold text-[#0b695c]">{office?.name ?? '내가 확인할 집'}</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-[#102a43] sm:text-5xl">오늘 확인할 집</h1>
          <p className="mt-3 text-[#607785]">만기가 가깝거나 아직 끝내지 못한 일을 먼저 보여드려요.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link aria-label={unreadChatCount ? `읽지 않은 메시지 ${unreadChatCount}개 확인` : '집 대화 보기'} className="app-panel inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-[#244657]" href="/chats">{unreadChatCount ? `집 대화 ${unreadChatCount}` : '집 대화'}</Link>
          {canRegisterHome && office && <Link className="app-primary inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-white" href={`/homes/new?office=${office.id}`}>집 등록하기</Link>}
        </div>
      </header>

      <section aria-label="우선 확인할 집" className="mt-8 grid gap-4 lg:grid-cols-2">
        {homes.map((home) => (
          <Link className="app-panel group rounded-[24px] p-6 transition hover:-translate-y-0.5 hover:border-[#9bc7c0]" href={`/homes/${home.id}`} key={home.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#607785]">{home.address}</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#102a43]">{home.label}</h2>
              </div>
              {home.contractDay && <span className="shrink-0 rounded-full bg-[#edf7f4] px-3 py-2 text-sm font-black text-[#0b695c]">{home.contractDay.label}</span>}
            </div>
            <div className="mt-5 border-t border-[#e3ebe8] pt-4">
              <p className="text-xs font-extrabold text-[#0b695c]">다음 확인</p>
              <p className="mt-1 font-bold text-[#244657]">{home.openTask?.title ?? (home.contractDay ? '만기 계획과 기록 확인' : '최근 기록 확인')}</p>
            </div>
          </Link>
        ))}
      </section>
      <div className="mt-6"><Link className="text-sm font-extrabold text-[#0b695c]" href={office ? `/homes?office=${office.id}` : '/homes'}>전체 집 보기 →</Link></div>
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
          <p className="text-sm font-extrabold text-[#0b695c]">{office.name}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#102a43]">아직 등록된 집이 없습니다</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[#59717f]">집이 등록되거나 초대가 연결되면 만기와 할 일을 이곳에서 바로 확인할 수 있습니다.</p>
          <div className="mt-6 flex flex-wrap gap-4">
            {canRegisterHome && <Link className="app-primary inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-extrabold text-white" href={`/homes/new?office=${office.id}`}>집 등록하기</Link>}
            <Link className="inline-flex min-h-12 items-center text-sm font-extrabold text-[#0b695c]" href="/chats">새 메시지가 없습니다</Link>
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
          <p className="text-sm font-extrabold text-[#0b695c]">아직 연결된 집이 없습니다</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#102a43]">{officeMember ? '사무소 초대 링크를 확인해 주세요' : '집 초대 링크를 확인해 주세요'}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#59717f]">역할을 선택한 것만으로 사무소나 집 기록이 열리지는 않습니다. 받은 초대 링크를 열어 수락하면 허용된 집과 대화가 이 홈에 나타납니다.</p>
          {!officeMember && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607785]">주소를 검색해 다른 사람의 기록에 연결할 수 없습니다.</p>}
          <Link href="/chats" className="mt-6 inline-flex text-sm font-extrabold text-[#0b695c]">새 메시지가 없습니다</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div className="pt-4">
          <p className="text-sm font-extrabold text-[#0b695c]">집신 업무 시작</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#102a43]">사무소 공간을 먼저 만드세요</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[#59717f]">사무소를 만든 뒤 첫 집을 등록하고 구성원을 초대할 수 있습니다. 각자는 자기 계정으로 사용합니다.</p>
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
