import Link from 'next/link';
import { Check, ChevronRight, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { Mascot } from '@/components/Brand';

/**
 * 로그인 후 첫 화면 (2026-10-18 승인 시안 · 제안 디자인 '큰 글씨' 기준).
 * - 금색은 '지금 내가 할 일' 하나에만 쓴다.
 * - 실제 데이터가 없으면 숫자를 지어내지 않고 빈 화면 안내(캐릭터)를 보여 준다.
 */
type PrimaryRole = 'principal_broker' | 'associate_broker' | 'assistant' | 'landlord' | 'tenant';
type OfficeSummary = { id: string; name: string; canRegisterHome?: boolean };
type ContractDay = { label: string; days: number } | null;
type HomeTask = { id: string; title: string; dueAt: string | null } | null;
type RecentHome = { id: string; label: string; address: string; contractDay?: ContractDay; openTask?: HomeTask; photoUrl?: string | null; relation?: string };
type NextTask = { id: string; homeId: string; title: string; dueAt: string | null };
export type HomeSummaryCounts = { totalHomes: number; expiringSoon: number; openTasks: number };
export type StaffBriefNote = { id: string; homeId: string; title: string };

/** 새 직원 첫 화면 (승인 제안 ④-가). 초대를 막 수락한 직원에게만 보인다. 메모는 RLS로 이미 볼 수 있는 사무소 기록만 쓴다. */
function StaffBrief({ officeName, counts, notes, listHref }: { officeName: string; counts: HomeSummaryCounts; notes: StaffBriefNote[]; listHref: string }) {
  return (
    <section aria-labelledby="staff-brief-title" className="mb-4 rounded-[20px] border border-[#EAEBEE] bg-white p-5">
      <p className="text-[15px] text-[#4D5159]">{officeName}에 오신 걸 환영해요</p>
      <h1 className="mt-1 text-[22px] font-bold leading-snug tracking-[-0.02em]" id="staff-brief-title">5분이면 이 사무소 일을 이어받을 수 있어요</h1>
      <ol className="mt-4 grid gap-2">
        <li><Link className="flex min-h-16 items-center gap-3 rounded-xl bg-[#F2F3F6] px-4" href={listHref}><strong className="text-lg text-[#0B6655]">1</strong><span><strong className="block text-base">사무소 집 {counts.totalHomes}채</strong><span className="text-[15px] text-[#4D5159]">{counts.expiringSoon ? `만기 임박 ${counts.expiringSoon}채부터 보세요` : '최근 기록부터 보세요'}</span></span></Link></li>
        <li><Link className="flex min-h-16 items-center gap-3 rounded-xl bg-[#F2F3F6] px-4" href="/tasks"><strong className="text-lg text-[#0B6655]">2</strong><span><strong className="block text-base">할 일 있는 집 {counts.openTasks}채</strong><span className="text-[15px] text-[#4D5159]">누가 어디까지 했는지 이어서 보세요</span></span></Link></li>
        <li className="rounded-xl bg-[#F2F3F6] px-4 py-3">
          <span className="flex items-center gap-3"><strong className="text-lg text-[#0B6655]">3</strong><strong className="text-base">꼭 알아야 할 메모 {notes.length ? `${notes.length}개` : ''}</strong></span>
          {notes.length ? (
            <ul className="mt-2 grid gap-1 pl-7">
              {notes.map((note) => <li key={note.id}><Link className="text-[15px] text-[#212124] underline-offset-2 hover:underline" href={`/homes/${note.homeId}`}>{note.title}</Link></li>)}
            </ul>
          ) : <p className="mt-1 pl-7 text-[15px] text-[#4D5159]">아직 남겨진 메모가 없어요.</p>}
          <p className="mt-2 pl-7 text-sm text-[#6B7079]">담당이 바뀌어도 메모는 집에 남아요.</p>
        </li>
      </ol>
    </section>
  );
}

const EXPIRING_DAYS = 90;

function EmptyCard({ eyebrow, title, children }: { eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[#EAEBEE] bg-white p-6 text-center sm:p-10">
      <Mascot className="mx-auto !mb-3 !w-[120px]" pose="hello" />
      {eyebrow && <p className="text-[15px] font-semibold text-[#0B6655]">{eyebrow}</p>}
      <h1 className="mt-1 text-[24px] font-bold leading-snug tracking-[-0.02em] text-[#212124]">{title}</h1>
      <div className="mx-auto mt-3 max-w-md text-base leading-7 text-[#4D5159]">{children}</div>
    </section>
  );
}

function StartBroker({ createOfficeAction, error }: { createOfficeAction?: (formData: FormData) => void | Promise<void>; error?: string }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <div className="text-center">
        <Mascot className="mx-auto !mb-3 !w-[120px]" pose="hello" />
        <h1 className="text-[24px] font-bold leading-snug tracking-[-0.02em]">두 단계만 하면 시작돼요</h1>
        <p className="mt-1 text-base text-[#4D5159]">3분 정도 걸려요.</p>
      </div>
      <ol className="mt-6 grid gap-3">
        <li className="rounded-[20px] border-2 border-[#0B6655] bg-white p-5">
          <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#0B6655] text-[15px] font-bold text-white">1</span><strong className="text-lg">사무소 만들기</strong></div>
          <p className="mt-2 text-base leading-7 text-[#4D5159]">사무소 이름만 적으면 돼요. 직원은 나중에 초대해도 돼요.</p>
          <form action={createOfficeAction} className="mt-4 grid gap-2">
            <label className="text-[15px] font-semibold" htmlFor="office-name">사무소 이름</label>
            <input aria-describedby={error ? 'office-error' : undefined} aria-invalid={Boolean(error)} className="min-h-14 w-full rounded-xl border border-[#DCDEE3] bg-white px-4 text-base outline-none placeholder:text-[#6B7079] focus:border-[#0B6655] focus:ring-4 focus:ring-[#0B6655]/10" id="office-name" maxLength={100} minLength={2} name="name" placeholder="예: 공릉공인중개사사무소" required />
            {error && <p className="text-[15px] text-red-700" id="office-error" role="alert">{error}</p>}
            <p className="text-sm text-[#6B7079]">사무소 구성원만 보는 비공개 공간이에요.</p>
            <button className="app-primary mt-2 min-h-14 w-full rounded-xl px-5 text-[17px] font-bold text-white" type="submit">사무소 만들기</button>
          </form>
        </li>
        <li className="rounded-[20px] border border-[#EAEBEE] bg-white p-5 opacity-70">
          <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full border-2 border-[#DCDEE3] text-[15px] font-bold text-[#6B7079]">2</span><strong className="text-lg">첫 집 등록하기</strong></div>
          <p className="mt-2 text-base leading-7 text-[#4D5159]">주소와 호수만 적으면 돼요. 사무소를 만들면 열려요.</p>
        </li>
      </ol>
      <div className="mt-4 rounded-2xl bg-[#F2F3F6] p-4">
        <strong className="text-base">직원으로 들어오셨나요?</strong>
        <p className="mt-1 text-[15px] leading-6 text-[#4D5159]">대표님이 보낸 초대 문자의 링크를 누르면 바로 사무소 집 목록이 보여요.</p>
      </div>
    </main>
  );
}

function OfficeCreated({ office }: { office: OfficeSummary }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <section className="rounded-[20px] border border-[#EAEBEE] bg-white p-6 text-center sm:p-10">
        <Mascot className="mx-auto !mb-3 !w-[120px]" pose="happy" />
        <p className="text-[15px] font-semibold text-[#0B6655]">{office.name}</p>
        <h1 className="mt-1 text-[24px] font-bold tracking-[-0.02em]">사무소를 만들었어요</h1>
        <p className="mt-2 text-base text-[#4D5159]">이제 첫 집을 등록해요. 주소와 호수만 적으면 돼요.</p>
        <div className="mt-6 grid gap-2">
          {(office.canRegisterHome ?? true) && <Link className="app-primary flex min-h-14 items-center justify-center rounded-xl text-[17px] font-bold text-white" href={`/homes/new?office=${office.id}`}>첫 집 등록하기 (2/2)</Link>}
          <Link className="flex min-h-12 items-center justify-center rounded-xl border border-[#DCDEE3] bg-white text-base font-semibold text-[#212124]" href="/office/members">직원 먼저 초대하기</Link>
        </div>
      </section>
    </main>
  );
}

function HomeThumb({ home }: { home: RecentHome }) {
  if (home.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={`${home.label} 최근 사진`} className="size-[76px] shrink-0 rounded-xl object-cover" src={home.photoUrl} />;
  }
  return (
    <span className="grid size-[76px] shrink-0 place-items-center rounded-xl bg-[#F2F3F6] text-[#6B7079]">
      <span className="flex flex-col items-center gap-0.5"><ImageIcon aria-hidden="true" className="size-5" /><span className="text-sm">사진 없음</span></span>
    </span>
  );
}

/**
 * 모두 같은 홈 (v2 시안 V2Home, DEC-038). 개인·사무소 모두 이 화면이고 위쪽 '이름 ▾'로 공간만 바꾼다.
 * - 금색은 '지금 할 일' 카드 하나에만.
 * - 숫자는 실제 집 목록에서만 센다.
 */
function CommonHome({ homes, office, spaceKind, counts, unreadChatCount, nextTask, staffNotes }: {
  staffNotes?: StaffBriefNote[] | null;
  homes: RecentHome[];
  office?: OfficeSummary;
  spaceKind: 'me' | 'office';
  counts: HomeSummaryCounts;
  unreadChatCount: number;
  nextTask?: NextTask | null;
}) {
  const inOffice = spaceKind === 'office' && office;
  const canRegisterHome = inOffice ? office.canRegisterHome ?? false : false;
  const listHref = inOffice ? `/homes?office=${office.id}` : '/homes';
  const nextHome = nextTask ? homes.find((home) => home.id === nextTask.homeId) : undefined;
  const stats = inOffice ? [
    { label: '사무소 집', value: `${counts.totalHomes}채`, href: listHref },
    { label: `${EXPIRING_DAYS}일 내 만기`, value: `${counts.expiringSoon}채`, href: `${listHref}&filter=expiring` },
    { label: '할 일 있는 집', value: `${counts.openTasks}채`, href: '/tasks' },
  ] : [];
  return (
    <main className="mx-auto max-w-xl px-4 pb-6 pt-4 md:max-w-3xl md:py-8">
      {staffNotes && office && <StaffBrief counts={counts} listHref={listHref} notes={staffNotes} officeName={office.name} />}

      {nextTask && (
        <Link className="flex min-h-[84px] items-center gap-3 rounded-2xl bg-[#FBF3E6] px-4 py-3 text-[#5B3A00]" href={`/homes/${nextTask.homeId}`}>
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#C98A2E] text-white"><Check className="size-6" strokeWidth={2.4} /></span>
          <span className="min-w-0 flex-1">
            <strong className="block text-[15px] text-[#8A5A10]">지금 할 일</strong>
            <span className="block text-[17px] font-bold leading-snug text-[#212124]">{nextTask.title}</span>
            {nextHome && <span className="block truncate text-sm text-[#6B5530]">{nextHome.label}</span>}
          </span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
        </Link>
      )}

      {stats.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2" aria-label="요약">
          {stats.map((stat) => (
            <Link className="flex min-h-[68px] flex-col justify-center rounded-xl bg-[#F2F3F6] px-3" href={stat.href} key={stat.label}>
              <span className="text-sm text-[#4D5159]">{stat.label}</span>
              <strong className="text-[20px] font-bold text-[#212124]">{stat.value}</strong>
            </Link>
          ))}
        </div>
      )}

      <section aria-labelledby="home-list-title" className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#212124]" id="home-list-title">
            {inOffice ? '사무소 집' : '내 집'} <span className="text-[17px] font-semibold text-[#6B7079]">{counts.totalHomes}채</span>
          </h1>
          <div className="flex items-center gap-4">
            {canRegisterHome && office && <Link className="text-[15px] font-semibold text-[#0B6655]" href={`/homes/new?office=${office.id}`}>집 등록하기</Link>}
            {counts.totalHomes > homes.length && <Link className="text-[15px] font-semibold text-[#4D5159]" href={listHref}>전체 보기</Link>}
          </div>
        </div>
        <ul className="mt-1">
          {homes.map((home) => (
            <li className="border-b border-[#EAEBEE] last:border-b-0" key={home.id}>
              <Link className="flex min-h-[100px] items-center gap-3 py-3" href={`/homes/${home.id}`}>
                <HomeThumb home={home} />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[17px] text-[#212124]">{home.label}</strong>
                  <span className="block truncate text-[15px] text-[#6B7079]">{home.relation ? `${home.relation} · ${home.address}` : home.address}</span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {home.contractDay && <span className={`rounded-md px-2 py-0.5 text-sm font-semibold ${home.contractDay.days >= 0 && home.contractDay.days <= EXPIRING_DAYS ? 'bg-[#E3F0EC] text-[#083E37]' : 'bg-[#F2F3F6] text-[#4D5159]'}`}>만기 {home.contractDay.label}</span>}
                    {home.openTask && <span className="max-w-full truncate rounded-md bg-[#F2F3F6] px-2 py-0.5 text-sm font-semibold text-[#4D5159]">{home.openTask.title}</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {unreadChatCount > 0 && (
        <Link aria-label={`읽지 않은 메시지 ${unreadChatCount}개 확인`} className="mt-3 flex min-h-14 items-center gap-3 rounded-xl border border-[#EAEBEE] px-4" href="/chats">
          <MessageCircle aria-hidden="true" className="size-6 text-[#0B6655]" />
          <span className="flex-1 text-base font-semibold text-[#212124]">새 대화 {unreadChatCount}개</span>
          <ChevronRight aria-hidden="true" className="size-5 text-[#6B7079]" />
        </Link>
      )}

      {!inOffice && <PartnerEntry />}
    </main>
  );
}

/** 홈 맨 아래: 일로도 쓰는 사람은 여기서 파트너 등록(DEC-038). */
function PartnerEntry() {
  return (
    <Link className="mt-6 flex min-h-[72px] items-center gap-3 rounded-2xl bg-[#F2F3F6] px-4" href="/partners/new">
      <span className="min-w-0 flex-1">
        <strong className="block text-base text-[#212124]">일로도 쓰고 있나요?</strong>
        <span className="block text-[15px] text-[#4D5159]">공인중개사 · 수리 · 청소 — 집신 파트너 등록</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 text-[#6B7079]" />
    </Link>
  );
}

export function HomeStart({
  primaryRole,
  offices,
  createOfficeAction,
  recentHomes = [],
  unreadChatCount = 0,
  nextTask = null,
  counts,
  justCreatedOffice = false,
  officeError,
  staffNotes = null,
  spaceKind,
}: {
  /** 위쪽 '이름 ▾'에서 고른 공간. 없으면 사무소가 있을 때 사무소로 본다(이전 동작). */
  spaceKind?: 'me' | 'office';
  staffNotes?: StaffBriefNote[] | null;
  primaryRole: PrimaryRole | null;
  offices: OfficeSummary[];
  createOfficeAction?: (formData: FormData) => void | Promise<void>;
  recentHomes?: RecentHome[];
  unreadChatCount?: number;
  nextTask?: NextTask | null;
  counts?: HomeSummaryCounts;
  justCreatedOffice?: boolean;
  officeError?: string;
}) {
  const office = offices[0];
  const isOfficeRole = primaryRole === 'principal_broker' || primaryRole === 'associate_broker' || primaryRole === 'assistant';
  const summary = counts ?? {
    totalHomes: recentHomes.length,
    expiringSoon: recentHomes.filter((home) => home.contractDay && home.contractDay.days >= 0 && home.contractDay.days <= EXPIRING_DAYS).length,
    openTasks: recentHomes.filter((home) => home.openTask).length,
  };

  const kind = spaceKind ?? (office ? 'office' : 'me');
  if (recentHomes.length >= 1) return <CommonHome staffNotes={staffNotes} counts={summary} homes={recentHomes} nextTask={nextTask} office={office} spaceKind={kind} unreadChatCount={unreadChatCount} />;

  // 개인 공간인데 직접 연결된 집이 없고 사무소에는 속해 있으면: 사무소로 바꾸는 길만 보여 준다.
  if (kind === 'me' && office) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <EmptyCard title="직접 연결된 집이 아직 없어요">
          <p>임대인·임차인으로 초대받은 집이 여기에 보여요. 사무소 집은 위쪽 이름을 눌러 사무소로 바꾸면 보여요.</p>
        </EmptyCard>
        <a className="app-primary mt-3 flex min-h-14 items-center justify-center rounded-xl text-[17px] font-bold text-white" href={`/space?to=${office.id}`}>{office.name}로 바꾸기</a>
        <PartnerEntry />
      </main>
    );
  }

  if (office && justCreatedOffice) return <OfficeCreated office={office} />;

  if (office) {
    const canRegisterHome = office.canRegisterHome ?? primaryRole === 'principal_broker';
    return (
      <main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <EmptyCard eyebrow={office.name} title="아직 등록된 집이 없습니다">
          <p>집이 등록되거나 초대가 연결되면 만기와 할 일을 여기서 바로 볼 수 있어요.</p>
        </EmptyCard>
        <div className="mt-3 grid gap-2">
          {canRegisterHome && <Link className="app-primary flex min-h-14 items-center justify-center rounded-xl text-[17px] font-bold text-white" href={`/homes/new?office=${office.id}`}>집 등록하기</Link>}
          {canRegisterHome && <Link className="flex min-h-12 items-center justify-center rounded-xl border border-[#DCDEE3] bg-white text-base font-semibold" href="/office/members">직원 초대하기</Link>}
          {unreadChatCount > 0 && <Link className="flex min-h-12 items-center justify-center text-base font-semibold text-[#0B6655]" href="/chats">새 대화 {unreadChatCount}개 보기</Link>}
        </div>
      </main>
    );
  }

  if (primaryRole !== 'principal_broker') {
    const officeMember = isOfficeRole;
    return (
      <main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <EmptyCard eyebrow="아직 연결된 집이 없습니다" title={officeMember ? '사무소 초대 링크를 확인해 주세요' : '집 초대 링크를 확인해 주세요'}>
          <p>역할을 선택한 것만으로 사무소나 집 기록이 열리지는 않습니다. 받은 초대 링크를 열어 수락하면 허용된 집과 대화가 이 홈에 나타납니다.</p>
          {!officeMember && <p className="mt-2 text-[15px] text-[#6B7079]">주소를 검색해 다른 사람의 기록에 연결할 수 없습니다.</p>}
        </EmptyCard>
        {unreadChatCount > 0 && <Link className="mt-3 flex min-h-12 items-center justify-center text-base font-semibold text-[#0B6655]" href="/chats">새 대화 {unreadChatCount}개 보기</Link>}
        <PartnerEntry />
      </main>
    );
  }

  return <StartBroker createOfficeAction={createOfficeAction} error={officeError} />;
}
