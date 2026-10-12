import Link from 'next/link';

type PrimaryRole = 'principal_broker' | 'assistant' | 'landlord' | 'tenant';
type OfficeSummary = { id: string; name: string; canRegisterHome?: boolean };

export function HomeStart({
  primaryRole,
  offices,
  createOfficeAction,
}: {
  primaryRole: PrimaryRole;
  offices: OfficeSummary[];
  createOfficeAction?: (formData: FormData) => void | Promise<void>;
}) {
  const office = offices[0];

  if (office) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#092f3e] via-[#0a4f55] to-[#08715e] px-7 py-10 text-white shadow-[0_30px_80px_rgba(7,52,64,.2)] sm:px-10 sm:py-14">
          <div className="absolute -right-20 -top-28 size-80 rounded-full bg-[#67d9bf]/20 blur-3xl" aria-hidden="true" />
          <p className="relative text-sm font-bold text-[#9ee8d7]">오늘의 작업 공간</p>
          <h1 className="relative mt-3 text-4xl font-extrabold tracking-[-0.05em] sm:text-6xl">{office.name}</h1>
          <p className="relative mt-5 max-w-2xl text-base leading-7 text-[#d7eeeb] sm:text-lg">필요한 사진을 다시 찾지 마세요. 오늘 관리할 집과 다음 일이 집신에서 이어집니다.</p>
        </section>
        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <article className="app-panel rounded-[28px] p-7 sm:p-8">
            <span className="text-sm font-bold text-[#0b695c]">집 기록</span>
            <h2 className="mt-3 text-2xl font-extrabold text-[#102a43]">{office.canRegisterHome ?? primaryRole === 'principal_broker' ? '첫 집 등록하기' : '담당 집 확인하기'}</h2>
            <p className="mt-3 leading-7 text-[#59717f]">주소를 공개하는 것이 아닙니다. 권한이 있는 사람만 확인하는 집의 비공개 기록 공간입니다.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">{(office.canRegisterHome ?? primaryRole === 'principal_broker') && <Link href={`/homes/new?office=${office.id}`} className="app-primary rounded-2xl px-5 py-4 text-sm font-bold text-white transition">첫 집 등록하기</Link>}
            <Link href={`/homes?office=${office.id}`} className="text-sm font-bold text-[#0b695c]">집 목록 보기 →</Link></div>
          </article>
          <article className="app-panel rounded-[28px] p-7 sm:p-8">
            <span className="text-sm font-bold text-[#41657a]">함께 일하는 방법</span>
            <h2 className="mt-3 text-2xl font-extrabold text-[#102a43]">구성원 초대하기</h2>
            <p className="mt-3 leading-7 text-[#59717f]">대표 계정을 공유하지 않고, 각자의 계정에 역할과 담당 집만 연결합니다.</p>
            {(office.canRegisterHome ?? primaryRole === 'principal_broker') ? <Link href="/office/members" className="mt-7 inline-flex rounded-full bg-[#edf3f7] px-4 py-2 text-sm font-bold text-[#345d70]">구성원 관리 →</Link> : <span className="mt-7 inline-flex rounded-full bg-[#edf3f7] px-4 py-2 text-sm font-bold text-[#496273]">집마다 담당자 연결</span>}
          </article>
        </section>
      </main>
    );
  }

  if (primaryRole !== 'principal_broker') {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
        <section className="app-panel rounded-[32px] p-8 sm:p-12"><p className="text-sm font-bold text-[#0b695c]">아직 연결된 공간이 없습니다</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#102a43] sm:text-5xl">사무소 초대를 확인해 주세요</h1>
        <p className="mt-5 text-lg leading-8 text-[#59717f]">대표가 보낸 초대를 수락하면 담당 집과 필요한 기록만 안전하게 볼 수 있습니다.</p></section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:py-16 lg:grid-cols-[1fr_440px] lg:items-center">
      <section>
        <p className="text-sm font-bold text-[#0b695c]">한 번의 설정으로 시작합니다</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-[-0.055em] text-[#102a43] sm:text-6xl">사무소의 기록을<br />집마다 이어주세요</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[#59717f]">직원 개인 휴대전화에 흩어진 사진과 업무가 끊기지 않도록, 사무소와 집을 안전하게 연결합니다.</p>
        <ol className="mt-9 space-y-4 text-slate-700">
          <li><strong className="mr-3 text-emerald-900">01</strong>사무소 만들기</li>
          <li><strong className="mr-3 text-emerald-900">02</strong>첫 집 등록하기</li>
          <li><strong className="mr-3 text-emerald-900">03</strong>담당자와 관계자 초대하기</li>
        </ol>
      </section>
      <form action={createOfficeAction} className="app-panel rounded-[28px] p-6 sm:p-8">
        <label className="text-sm font-semibold text-slate-900" htmlFor="office-name">사무소 이름</label>
        <input className="mt-3 min-h-14 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/10" id="office-name" maxLength={100} minLength={2} name="name" placeholder="예: 집신 공인중개사무소" required />
        <p className="mt-3 text-sm leading-6 text-slate-500">사업자 인증은 다음 단계에서 진행합니다. 지금은 비공개 업무 공간만 만듭니다.</p>
        <button className="app-primary mt-7 min-h-14 w-full rounded-2xl px-5 font-bold text-white transition focus:outline-none focus:ring-4 focus:ring-[#087566]/20" type="submit">사무소 만들기</button>
      </form>
    </main>
  );
}
