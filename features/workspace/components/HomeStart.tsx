import Link from 'next/link';

type PrimaryRole = 'principal_broker' | 'assistant' | 'landlord' | 'tenant';
type OfficeSummary = { id: string; name: string; canRegisterHome?: boolean };
type RecentHome = { id: string; label: string; address: string };
type NextTask = { id: string; homeId: string; title: string; dueAt: string | null };

function PlatformIntro({ officeName }: { officeName?: string }) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#082f49_0%,#075985_48%,#0f766e_100%)] px-6 py-9 text-white shadow-[0_28px_80px_-38px_rgba(8,47,73,.7)] sm:px-10 sm:py-12 lg:px-12">
      <div aria-hidden="true" className="absolute -right-24 -top-24 size-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <p className="relative text-sm font-extrabold tracking-[0.12em] text-cyan-100">{officeName ?? 'ZIPSIN HOME'}</p>
      <h1 className="relative mt-4 max-w-3xl text-[clamp(2.35rem,6vw,4.8rem)] font-black leading-[1.08] tracking-[-0.06em]">
        집의 모든 기록과 대화를<br />한곳에서 이어가세요
      </h1>
      <p className="relative mt-5 max-w-2xl text-base leading-7 text-sky-100 sm:text-lg">
        계약, 사진, 문서, 수리와 대화를 집 하나에 모읍니다. 사람이 바뀌어도 기록은 집신에 남습니다.
      </p>
      <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ['01', '집을 등록하고', '주소마다 비공개 기록 공간을 만듭니다.'],
          ['02', '기록을 남기고', '사진·문서·수리·할 일을 한 흐름으로 봅니다.'],
          ['03', '함께 이야기합니다', '필요한 사람만 초대해 집신 안에서 대화합니다.'],
        ].map(([number, title, description]) => (
          <article className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm" key={number}>
            <span className="text-xs font-black text-cyan-200">{number}</span>
            <h2 className="mt-2 text-lg font-extrabold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-sky-100">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomeStart({
  primaryRole,
  offices,
  createOfficeAction,
  recentHomes = [],
  unreadChatCount = 0,
  nextTask = null,
}: {
  primaryRole: PrimaryRole;
  offices: OfficeSummary[];
  createOfficeAction?: (formData: FormData) => void | Promise<void>;
  recentHomes?: RecentHome[];
  unreadChatCount?: number;
  nextTask?: NextTask | null;
}) {
  const office = offices[0];

  if (office) {
    const canManageOffice = office.canRegisterHome ?? primaryRole === 'principal_broker';
    return (
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <PlatformIntro officeName={office.name} />
        <section aria-label="지금 확인할 내용" className="mt-6 grid gap-4 md:grid-cols-3">
          <Link href={recentHomes[0] ? `/homes/${recentHomes[0].id}` : '/homes'} className="app-panel rounded-[28px] p-6 transition hover:-translate-y-1">
            <p className="text-sm font-extrabold text-[#087566]">최근 집</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#102a43]">{recentHomes[0]?.label ?? '아직 연결된 집이 없습니다'}</h2>
            <p className="mt-2 text-sm leading-6 text-[#607785]">{recentHomes[0]?.address ?? '집을 등록하거나 받은 초대를 수락해 주세요.'}</p>
          </Link>
          <Link href="/chats" aria-label={unreadChatCount ? `읽지 않은 메시지 ${unreadChatCount}개 확인` : '새 메시지 확인'} className="app-panel rounded-[28px] p-6 transition hover:-translate-y-1">
            <p className="text-sm font-extrabold text-[#087566]">새 메시지</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#102a43]">{unreadChatCount ? `${unreadChatCount}개를 확인해 주세요` : '새 메시지가 없습니다'}</h2>
            <p className="mt-2 text-sm leading-6 text-[#607785]">개인 연락처 대신 집신 안에서 대화를 이어갑니다.</p>
          </Link>
          <Link href={nextTask ? `/homes/${nextTask.homeId}` : '/tasks'} className="app-panel rounded-[28px] p-6 transition hover:-translate-y-1">
            <p className="text-sm font-extrabold text-[#087566]">다음 할 일</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#102a43]">{nextTask?.title ?? '지금 확인할 일이 없습니다'}</h2>
            <p className="mt-2 text-sm leading-6 text-[#607785]">{nextTask?.dueAt ? new Date(nextTask.dueAt).toLocaleDateString('ko-KR') : '새 기록과 일정을 집마다 이어서 관리하세요.'}</p>
          </Link>
        </section>
        <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <article className="app-panel rounded-[28px] p-6 sm:p-8">
            <p className="text-sm font-extrabold text-[#087566]">지금 시작할 일</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#102a43]">첫 집부터 기록을 시작하세요</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#59717f]">주소는 공개되지 않습니다. 초대받은 사람만 집의 기록과 대화를 확인합니다.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              {canManageOffice && <Link className="app-primary inline-flex min-h-12 items-center rounded-2xl px-5 text-sm font-extrabold text-white" href={`/homes/new?office=${office.id}`}>집 등록하기</Link>}
              <Link className="text-sm font-extrabold text-[#0b695c]" href={`/homes?office=${office.id}`}>집 목록 보기 →</Link>
            </div>
          </article>
          <article className="rounded-[28px] border border-[#dce7e4] bg-[#f7faf9] p-6 sm:p-8">
            <p className="text-sm font-extrabold text-[#41657a]">사무소 공간</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#102a43]">각자의 계정으로 함께 사용</h2>
            <p className="mt-3 leading-7 text-[#59717f]">대표 계정을 공유하지 않습니다. 구성원을 초대하면 같은 사무소 안에서 집과 기록을 함께 관리합니다.</p>
            {canManageOffice && <Link className="mt-6 inline-flex min-h-11 items-center text-sm font-extrabold text-[#345d70]" href="/office/members">구성원 관리 →</Link>}
          </article>
        </section>
      </main>
    );
  }

  if (primaryRole !== 'principal_broker') {
    const officeMember = primaryRole === 'assistant';
    return (
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <PlatformIntro />
        <section className="app-panel mt-6 rounded-[28px] p-7 sm:p-10">
          <p className="text-sm font-extrabold text-[#0b695c]">아직 연결된 집이 없습니다</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#102a43]">{officeMember ? '사무소 초대 링크를 확인해 주세요' : '집 초대 링크를 확인해 주세요'}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#59717f]">
            역할을 선택한 것만으로 사무소나 집 기록이 열리지는 않습니다. 받은 초대 링크를 열어 수락하면 허용된 집과 대화가 이 홈에 나타납니다.
          </p>
          {!officeMember && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607785]">주소를 검색해 다른 사람의 기록에 연결할 수 없습니다.</p>}
          <Link href="/chats" className="mt-6 inline-flex text-sm font-extrabold text-[#0b695c]">새 메시지가 없습니다</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <PlatformIntro />
      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_420px] lg:items-start">
        <article className="app-panel rounded-[28px] p-7 sm:p-9">
          <p className="text-sm font-extrabold text-[#0b695c]">시작 순서</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#102a43]">사무소 공간을 먼저 만드세요</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[#59717f]">사무소를 만들면 첫 집을 등록하고 구성원을 초대할 수 있습니다. 실제 기록은 그다음부터 집마다 쌓입니다.</p>
        </article>
        <form action={createOfficeAction} className="app-panel rounded-[28px] p-6 sm:p-8">
          <label className="text-sm font-bold text-slate-900" htmlFor="office-name">사무소 이름</label>
          <input className="mt-3 min-h-14 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/10" id="office-name" maxLength={100} minLength={2} name="name" placeholder="예: 집신 공인중개사무소" required />
          <p className="mt-3 text-sm leading-6 text-slate-500">지금 만드는 공간은 사무소 구성원만 사용하는 비공개 공간입니다.</p>
          <button className="app-primary mt-7 min-h-14 w-full rounded-2xl px-5 font-extrabold text-white" type="submit">사무소 만들기</button>
        </form>
      </section>
    </main>
  );
}
