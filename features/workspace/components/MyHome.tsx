import Link from 'next/link';
import { CalendarDays, Camera, Check, ChevronRight, ClipboardCheck, FileText, Home, NotebookPen, Plus, Receipt, Search, Wrench } from 'lucide-react';

/**
 * 내 집 첫 화면 (대표 Figma "My Home", 2026-10-19).
 * - 실제로 동작하는 버튼만 누를 수 있다. 아직 없는 기능은 '준비 중'으로만 보인다.
 * - 숫자는 실제 기록에서만 센다. 금색은 '지금 할 일' 하나에만.
 */
export type MyHomeHome = { id: string; label: string; address: string; relation?: string; photoUrl?: string | null; contractDay?: { label: string; days: number } | null; openTask?: { id: string; title: string } | null };
export type MyHomeEvent = { id: string; homeId: string; date: string; title: string; homeLabel: string };
export type RecordCounts = { photo: number; document: number; receipt: number; note: number; repair: number };

type Props = {
  title?: string;
  homes: MyHomeHome[];
  totalHomes: number;
  /** 집 추가가 실제로 되는 사람(대표 공인중개사)만 사무소 id가 있다. */
  addHomeOfficeId?: string | null;
  events: MyHomeEvent[];
  counts: RecordCounts;
  nextTask?: { homeId: string; title: string; homeLabel?: string } | null;
  listHref?: string;
  /** 파트너(사무소) 모드면 '집을 알아보고 있어요/계약했어요' 대신 사무소 요약을 보여 준다. */
  officeStats?: { expiringSoon: number; openTasks: number } | null;
  children?: React.ReactNode;
};

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-2xl border border-[#E4E6EA] bg-white ${className}`}>{children}</section>;
}

function CardHead({ id, title, href }: { id: string; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5">
      <h2 className="text-[17px] font-bold text-[#212124]" id={id}>{title}</h2>
      {href && <Link className="inline-flex min-h-11 items-center gap-0.5 text-sm font-semibold text-[#4D5159]" href={href}>전체 보기<ChevronRight aria-hidden="true" className="size-4" /></Link>}
    </div>
  );
}

function Empty({ icon: Icon, title, body, action }: { icon: typeof Home; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="m-4 mt-3 flex flex-col items-center rounded-xl border border-[#EAEBEE] px-4 py-7 text-center">
      <Icon aria-hidden="true" className="size-8 text-[#6B7079]" strokeWidth={1.5} />
      <p className="mt-2 text-[15px] font-semibold text-[#212124]">{title}</p>
      <p className="mt-0.5 text-sm text-[#6B7079]">{body}</p>
      {action}
    </div>
  );
}

const outlineButton = 'mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#212124] px-5 text-[15px] font-semibold text-[#212124] hover:bg-[#F7F7F8]';
const disabledButton = 'mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#DCDEE3] px-5 text-[15px] font-semibold text-[#9EA3AB]';

const dayLabel = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short' });
};

export function MyHome({ title = '우리집', homes, totalHomes, addHomeOfficeId, events, counts, nextTask, listHref = '/homes', officeStats = null, children }: Props) {
  const addHref = addHomeOfficeId ? `/homes/new?office=${addHomeOfficeId}` : null;
  const firstHome = homes[0];
  const contractHref = addHref ?? (firstHome ? `/homes/${firstHome.id}` : null);
  const tiles = [
    { label: '사진', unit: '장', value: counts.photo, icon: Camera },
    { label: '계약서', unit: '건', value: counts.document, icon: FileText },
    { label: '영수증', unit: '건', value: counts.receipt, icon: Receipt },
    { label: '메모', unit: '건', value: counts.note, icon: NotebookPen },
    { label: '수리', unit: '건', value: counts.repair, icon: Wrench },
  ];
  return (
    <main className="mx-auto max-w-[1120px] px-4 pt-4 md:px-10 md:pt-6">
      <h1 className="sr-only">{title}</h1>
      {children}

      <div className="flex items-center justify-between gap-3">
        {nextTask ? (
          <Link className="flex min-h-[64px] flex-1 items-center gap-3 rounded-2xl bg-[#FBF3E6] px-4 py-3" href={`/homes/${nextTask.homeId}`}>
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#C98A2E] text-white"><Check className="size-5" strokeWidth={2.4} /></span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm text-[#8A5A10]">지금 할 일</strong>
              <span className="block truncate text-base font-bold text-[#212124]">{nextTask.title}{nextTask.homeLabel ? ` · ${nextTask.homeLabel}` : ''}</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-5 text-[#5B3A00]" />
          </Link>
        ) : <span />}
        {addHref && (
          <Link className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[#212124] bg-white px-4 text-[15px] font-semibold text-[#212124]" href={addHref}>
            <Plus aria-hidden="true" className="size-4" />집 추가
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {officeStats ? (
          <ul aria-label="사무소 요약" className="grid grid-cols-3 gap-3 md:col-span-2">
            {[
              { label: '사무소 집', value: `${totalHomes}채`, href: listHref },
              { label: '90일 내 만기', value: `${officeStats.expiringSoon}채`, href: `${listHref}${listHref.includes('?') ? '&' : '?'}filter=expiring` },
              { label: '할 일 있는 집', value: `${officeStats.openTasks}채`, href: '/tasks' },
            ].map((stat) => (
              <li key={stat.label}>
                <Link className="flex min-h-[88px] flex-col justify-center rounded-2xl border border-[#E4E6EA] bg-white px-4 hover:bg-[#F7F7F8]" href={stat.href}>
                  <span className="text-sm text-[#4D5159]">{stat.label}</span>
                  <strong className="text-[24px] font-bold text-[#212124]">{stat.value}</strong>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <>
        <Card className="flex flex-col items-center px-6 py-8 text-center">
          <span aria-hidden="true" className="grid size-20 place-items-center rounded-full bg-[#F2F3F6] text-[#4D5159]"><Search className="size-10" strokeWidth={1.4} /></span>
          <h2 className="mt-4 text-[19px] font-bold text-[#212124]">집을 알아보고 있어요</h2>
          <p className="mt-1 text-[15px] leading-6 text-[#4D5159]">관심 있는 집을 등록하고<br />비교해보세요.</p>
          <span aria-disabled="true" className={disabledButton}>집 찾기 시작하기<span className="rounded bg-[#F2F3F6] px-1.5 py-0.5 text-[12px] text-[#6B7079]">준비 중</span></span>
        </Card>
        <Card className="flex flex-col items-center px-6 py-8 text-center">
          <span aria-hidden="true" className="grid size-20 place-items-center rounded-full bg-[#F2F3F6] text-[#4D5159]"><ClipboardCheck className="size-10" strokeWidth={1.4} /></span>
          <h2 className="mt-4 text-[19px] font-bold text-[#212124]">계약했어요</h2>
          <p className="mt-1 text-[15px] leading-6 text-[#4D5159]">계약 정보를 등록하고<br />입주 체크리스트를 시작하세요.</p>
          {contractHref
            ? <Link className={outlineButton} href={contractHref}>계약 등록하기</Link>
            : <span className="mt-4 text-sm leading-6 text-[#6B7079]">중개사무소에서 보낸 초대 링크를 열면<br />계약한 집이 여기에 연결돼요.</span>}
        </Card>

          </>
        )}

        <Card>
          <CardHead href={totalHomes ? listHref : undefined} id="my-home-list" title="내 집 목록" />
          {homes.length ? (
            <ul aria-labelledby="my-home-list" className="px-5 pb-3">
              {homes.slice(0, 4).map((home) => (
                <li className="border-b border-[#EAEBEE] last:border-b-0" key={home.id}>
                  <Link className="flex min-h-[76px] items-center gap-3 py-3" href={`/homes/${home.id}`}>
                    {home.photoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img alt={`${home.label} 최근 사진`} className="size-14 shrink-0 rounded-lg object-cover" src={home.photoUrl} />
                      : <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-lg bg-[#F2F3F6] text-[#9EA3AB]"><Home className="size-6" strokeWidth={1.5} /></span>}
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-base text-[#212124]">{home.label}</strong>
                      <span className="block truncate text-sm text-[#6B7079]">{home.relation ? `${home.relation} · ${home.address}` : home.address}</span>
                    </span>
                    {home.contractDay && <span className="shrink-0 rounded-md bg-[#F2F3F6] px-2 py-0.5 text-sm font-semibold text-[#4D5159]">만기 {home.contractDay.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              action={addHref ? <Link className={outlineButton} href={addHref}>집 추가하기</Link> : undefined}
              body={addHref ? '집을 추가하고 모든 정보를 한눈에 관리하세요.' : '초대를 수락하면 그 집이 여기에 보여요.'}
              icon={Home}
              title="등록된 집이 없어요."
            />
          )}
        </Card>

        <Card>
          <CardHead id="my-home-events" title="이번 달 일정" />
          {events.length ? (
            <ul aria-labelledby="my-home-events" className="px-5 pb-3">
              {events.slice(0, 4).map((event) => (
                <li className="border-b border-[#EAEBEE] last:border-b-0" key={event.id}>
                  <Link className="flex min-h-14 items-center gap-3 py-2" href={`/homes/${event.homeId}`}>
                    <span className="w-[76px] shrink-0 text-sm font-semibold text-[#0B6655]">{dayLabel(event.date)}</span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-[15px] text-[#212124]">{event.title}</strong><span className="block truncate text-sm text-[#6B7079]">{event.homeLabel}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty body="할 일 마감일과 계약 만기일이 여기에 모여요." icon={CalendarDays} title="예정된 일정이 없어요." />
          )}
        </Card>

        <Card className="md:col-span-2">
          <CardHead href="/records" id="my-home-records" title="최근 기록" />
          <ul aria-labelledby="my-home-records" className="grid grid-cols-5 gap-2 p-4 pt-3 md:gap-4 md:p-5 md:pt-4">
            {tiles.map(({ label, unit, value, icon: Icon }) => (
              <li key={label}>
                <Link className="flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-[#EAEBEE] px-1 hover:bg-[#F7F7F8]" href="/records">
                  <Icon aria-hidden="true" className="size-7 text-[#4D5159]" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-[#212124]">{label}</span>
                  <span className="text-sm text-[#6B7079]">{value}{unit}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
