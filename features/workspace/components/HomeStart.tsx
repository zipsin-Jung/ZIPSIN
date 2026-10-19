import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MyHome, type MyHomeEvent, type RecordCounts } from '@/features/workspace/components/MyHome';
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
  events = [],
  recordCounts = { photo: 0, document: 0, receipt: 0, note: 0, repair: 0 },
}: {
  /** 위쪽 '우리집 ▾'에서 고른 공간. 없으면 사무소가 있을 때 사무소로 본다. */
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
  events?: MyHomeEvent[];
  recordCounts?: RecordCounts;
}) {
  const office = offices[0];
  const kind = spaceKind ?? (office ? 'office' : 'me');
  const summary = counts ?? {
    totalHomes: recentHomes.length,
    expiringSoon: recentHomes.filter((home) => home.contractDay && home.contractDay.days >= 0 && home.contractDay.days <= EXPIRING_DAYS).length,
    openTasks: recentHomes.filter((home) => home.openTask).length,
  };

  // 사무소를 아직 만들지 않은 대표 공인중개사: 집을 추가하려면 사무소부터 (실제로 되는 유일한 길).
  if (!office && primaryRole === 'principal_broker' && !recentHomes.length) return <StartBroker createOfficeAction={createOfficeAction} error={officeError} />;
  if (office && justCreatedOffice) return <OfficeCreated office={office} />;

  const inOffice = kind === 'office' && office;
  const nextHome = nextTask ? recentHomes.find((home) => home.id === nextTask.homeId) : undefined;
  return (
    <MyHome
      addHomeOfficeId={inOffice && office.canRegisterHome ? office.id : null}
      counts={recordCounts}
      events={events}
      homes={recentHomes}
      listHref={inOffice ? `/homes?office=${office.id}` : '/homes'}
      officeStats={inOffice ? { expiringSoon: summary.expiringSoon, openTasks: summary.openTasks } : null}
      nextTask={nextTask ? { homeId: nextTask.homeId, title: nextTask.title, homeLabel: nextHome?.label } : null}
      title={inOffice ? office.name : '우리집'}
      totalHomes={summary.totalHomes}
    >
      {staffNotes && inOffice && <StaffBrief counts={summary} listHref={`/homes?office=${office.id}`} notes={staffNotes} officeName={office.name} />}
      {kind === 'me' && office && !recentHomes.length && (
        <p className="mb-4 rounded-xl bg-[#F2F3F6] px-4 py-3 text-[15px] text-[#4D5159]">사무소 집은 위쪽 <strong>우리집 ▾</strong>을 눌러 <a className="font-semibold text-[#0B6655] underline underline-offset-2" href={`/space?to=${office.id}`}>{office.name}</a>(으)로 바꾸면 보여요.</p>
      )}
      {unreadChatCount > 0 && (
        <Link className="mb-4 flex min-h-12 items-center gap-2 rounded-xl border border-[#EAEBEE] px-4 text-[15px] font-semibold text-[#212124]" href="/chats">새 대화 {unreadChatCount}개<ChevronRight aria-hidden="true" className="ml-auto size-5 text-[#6B7079]" /></Link>
      )}
    </MyHome>
  );
}
