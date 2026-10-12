type PrimaryRole = 'principal_broker' | 'assistant' | 'landlord' | 'tenant';
type OfficeSummary = { id: string; name: string };

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
        <p className="text-sm font-semibold text-emerald-800">내 작업 공간</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">{office.name}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">사진과 문서부터 찾지 마세요. 오늘 관리할 집과 다음 일을 여기에서 이어갑니다.</p>
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7">
            <span className="text-sm font-semibold text-emerald-800">첫 번째 순서</span>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">첫 집 등록하기</h2>
            <p className="mt-3 leading-7 text-slate-600">주소를 공개하는 것이 아니라, 이 사무소가 맡은 집의 비공개 기록 공간을 만듭니다.</p>
            <span className="mt-7 inline-block text-sm font-semibold text-emerald-900">다음 개발 단계</span>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-7">
            <span className="text-sm font-semibold text-slate-500">함께 일한다면</span>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">구성원 초대하기</h2>
            <p className="mt-3 leading-7 text-slate-600">대표 계정을 공유하지 않고, 각자의 계정에 역할과 담당 집을 나눠 줍니다.</p>
            <span className="mt-7 inline-block text-sm font-semibold text-slate-500">집 등록 후 연결</span>
          </article>
        </section>
      </main>
    );
  }

  if (primaryRole !== 'principal_broker') {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
        <p className="text-sm font-semibold text-emerald-800">아직 연결된 공간이 없습니다</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">사무소 초대를 확인해 주세요</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">대표가 보낸 초대를 수락하면 담당 집과 필요한 기록만 안전하게 볼 수 있습니다.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:py-16 lg:grid-cols-[1fr_440px] lg:items-center">
      <section>
        <p className="text-sm font-semibold text-emerald-800">처음 한 번만 설정하면 됩니다</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl">사무소의 첫 기록 공간을 만드세요</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">직원 개인 휴대전화에 흩어진 사진과 업무가 사라지지 않도록, 집을 등록하기 전에 사무소 공간부터 연결합니다.</p>
        <ol className="mt-9 space-y-4 text-slate-700">
          <li><strong className="mr-3 text-emerald-900">01</strong>사무소 만들기</li>
          <li><strong className="mr-3 text-emerald-900">02</strong>첫 집 등록하기</li>
          <li><strong className="mr-3 text-emerald-900">03</strong>담당자와 관계자 초대하기</li>
        </ol>
      </section>
      <form action={createOfficeAction} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <label className="text-sm font-semibold text-slate-900" htmlFor="office-name">사무소 이름</label>
        <input className="mt-3 min-h-14 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/10" id="office-name" maxLength={100} minLength={2} name="name" placeholder="예: 집신 공인중개사무소" required />
        <p className="mt-3 text-sm leading-6 text-slate-500">사업자 인증은 다음 단계에서 진행합니다. 지금은 비공개 업무 공간만 만듭니다.</p>
        <button className="mt-7 min-h-14 w-full rounded-xl bg-emerald-900 px-5 font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-900/20" type="submit">사무소 만들기</button>
      </form>
    </main>
  );
}
