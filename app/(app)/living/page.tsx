import Link from 'next/link';
import { Bell, Camera, ChevronRight, FileText, Lightbulb, NotebookPen, Plus, Receipt, Wrench } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { loadSpaceHomes } from '@/features/workspace/services/space-homes';

type Props = { searchParams?: Promise<{ tab?: string; home?: string; sort?: string }> };

const TABS = [
  { id: 'photo', label: '사진/기록', icon: Camera, title: '사진/기록', lead: '집의 상태와 변화를 사진으로 기록해 주세요.' },
  { id: 'repair', label: '수리/하자', icon: Wrench, title: '수리/하자', lead: '고장과 하자, 수리 진행을 기록해요.' },
  { id: 'receipt', label: '영수증', icon: Receipt, title: '영수증', lead: '영수증까지 올린 수리예요.' },
  { id: 'document', label: '계약/서류', icon: FileText, title: '계약/서류', lead: '계약서와 서류를 모아 봐요.' },
  { id: 'note', label: '메모', icon: NotebookPen, title: '메모', lead: '통화 내용과 약속을 남겨요.' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const LEGEND: Array<{ id: TabId; label: string; color: string }> = [
  { id: 'photo', label: '사진', color: '#4D5159' },
  { id: 'repair', label: '수리/하자', color: '#0B6655' },
  { id: 'receipt', label: '영수증', color: '#6FA89A' },
  { id: 'document', label: '계약/서류', color: '#8B95A1' },
  { id: 'note', label: '메모', color: '#C9CDD2' },
];

function Donut({ counts, total }: { counts: Record<TabId, number>; total: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg aria-hidden="true" className="size-[120px] shrink-0" viewBox="0 0 110 110">
      <circle cx="55" cy="55" fill="none" r={r} stroke="#F2F3F6" strokeWidth="14" />
      {total > 0 && LEGEND.map((item) => {
        const length = (counts[item.id] / total) * c;
        const segment = <circle cx="55" cy="55" fill="none" key={item.id} r={r} stroke={item.color} strokeDasharray={`${Math.max(length - 1.5, 0)} ${c}`} strokeDashoffset={-offset} strokeWidth="14" transform="rotate(-90 55 55)" />;
        offset += length;
        return segment;
      })}
      <text fill="#212124" fontSize="22" fontWeight="700" textAnchor="middle" x="55" y="56">{total}</text>
      <text fill="#6B7079" fontSize="11" textAnchor="middle" x="55" y="72">전체</text>
    </svg>
  );
}

/** 거주 · 관리 (대표 Figma "거주.관리"). 보이는 기록은 RLS가 허락한 것만. 영수증 = 영수증까지 올린 수리. */
export default async function LivingPage({ searchParams }: Props) {
  const query = (await searchParams) ?? {};
  const tab = TABS.find((item) => item.id === query.tab) ?? TABS[0];
  const ascending = query.sort === 'old';
  const { supabase, user } = await requireOnboardingComplete();
  const space = await loadSpaceHomes(supabase, user.id, query.home);
  const homes = space.ok ? space.homes : [];
  const homeFilter = query.home && homes.some((home) => home.id === query.home) ? query.home : null;
  const homeIds = homeFilter ? [homeFilter] : homes.map((home) => home.id);
  const labelOf = new Map(homes.map((home) => [home.id, home.label]));

  const { data: rows } = homeIds.length
    ? await supabase.from('records').select('id, home_id, record_kind, repair_stage, title, occurred_at').in('home_id', homeIds).neq('record_kind', 'task').order('occurred_at', { ascending: false }).limit(500)
    : { data: [] as Array<{ id: string; home_id: string; record_kind: string; repair_stage: string | null; title: string; occurred_at: string }> };
  const all = rows ?? [];
  const kindOf = (row: (typeof all)[number]): TabId[] => {
    const kinds: TabId[] = [];
    if (row.record_kind === 'photo') kinds.push('photo');
    if (row.record_kind === 'repair') kinds.push('repair');
    if (row.record_kind === 'repair' && row.repair_stage === 'receipt_attached') kinds.push('receipt');
    if (row.record_kind === 'document') kinds.push('document');
    if (row.record_kind === 'note') kinds.push('note');
    return kinds;
  };
  const counts = Object.fromEntries(TABS.map((item) => [item.id, all.filter((row) => kindOf(row).includes(item.id)).length])) as Record<TabId, number>;
  const total = LEGEND.reduce((sum, item) => sum + counts[item.id], 0);
  const list = all.filter((row) => kindOf(row).includes(tab.id)).sort((a, b) => (ascending ? a.occurred_at.localeCompare(b.occurred_at) : b.occurred_at.localeCompare(a.occurred_at))).slice(0, 24);

  const { data: photos } = list.length
    ? await supabase.from('attachments').select('record_id, storage_path, media_type').in('record_id', list.map((row) => row.id)).eq('status', 'ready').like('media_type', 'image/%').neq('media_type', 'image/heic')
    : { data: [] as Array<{ record_id: string; storage_path: string; media_type: string }> };
  const firstPhoto = new Map<string, string>();
  for (const photo of photos ?? []) if (!firstPhoto.has(photo.record_id)) firstPhoto.set(photo.record_id, photo.storage_path);
  const { data: signed } = firstPhoto.size ? await supabase.storage.from('home-records').createSignedUrls([...firstPhoto.values()], 600) : { data: [] };
  const urlByPath = new Map((signed ?? []).map((row) => [row.path, row.signedUrl]));
  const { data: notices } = await supabase.from('notifications').select('id, detail, created_at, notification_kind').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);

  const href = (next: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = { tab: tab.id, home: homeFilter, sort: ascending ? 'old' : null, ...next };
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    return `/living?${params.toString()}`;
  };
  const day = (iso: string) => new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });

  return (
    <main className="mx-auto max-w-[1120px] px-4 pt-4 md:px-10 md:pt-8">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#212124] md:text-[30px]">거주 · 관리</h1>
          <p className="mt-1 text-[15px] text-[#4D5159]">집에서 생긴 모든 일, 사진과 기록으로 관리하세요.</p>
        </div>
      </div>

      <nav aria-label="기록 종류" className="-mx-4 mt-5 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex min-w-max gap-1 rounded-2xl border border-[#E4E6EA] bg-white p-1.5 md:grid md:min-w-0 md:grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <Link aria-current={id === tab.id ? 'page' : undefined} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-[15px] ${id === tab.id ? 'border border-[#212124] font-bold text-[#212124]' : 'font-semibold text-[#4D5159] hover:bg-[#F7F7F8]'}`} href={href({ tab: id })}>
                <Icon aria-hidden="true" className="size-5" strokeWidth={1.6} />{label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_260px]">
        <section aria-labelledby="living-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold text-[#212124] underline decoration-2 underline-offset-[6px]" id="living-title">{tab.title}</h2>
              <p className="mt-2 text-[15px] text-[#4D5159]">{tab.lead}</p>
            </div>
            {homes.length > 0 && <Link className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-[#212124] px-4 text-[15px] font-semibold text-[#212124]" href={tab.id === 'repair' ? '/records/new?kind=repair' : tab.id === 'note' ? '/records/new?kind=note' : '/records/new'}><Plus aria-hidden="true" className="size-4" />{tab.id === 'photo' ? '사진 추가' : '기록 추가'}</Link>}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {homes.length > 1 && (
              <>
                <Link aria-current={!homeFilter ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${!homeFilter ? 'bg-[#212124] text-white' : 'border border-[#DCDEE3] text-[#212124]'}`} href={href({ home: null })}>전체 집</Link>
                {homes.map((home) => <Link aria-current={homeFilter === home.id ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${homeFilter === home.id ? 'bg-[#212124] text-white' : 'border border-[#DCDEE3] text-[#212124]'}`} href={href({ home: home.id })} key={home.id}>{home.label}</Link>)}
              </>
            )}
            <span className="ml-auto flex gap-1">
              <Link aria-current={!ascending ? 'page' : undefined} className={`inline-flex min-h-11 items-center px-2 text-sm ${!ascending ? 'font-bold text-[#212124]' : 'text-[#6B7079]'}`} href={href({ sort: null })}>최신순</Link>
              <Link aria-current={ascending ? 'page' : undefined} className={`inline-flex min-h-11 items-center px-2 text-sm ${ascending ? 'font-bold text-[#212124]' : 'text-[#6B7079]'}`} href={href({ sort: 'old' })}>오래된순</Link>
            </span>
          </div>

          {list.length ? (
            <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {list.map((row) => {
                const path = firstPhoto.get(row.id);
                const url = path ? urlByPath.get(path) : null;
                const target = row.record_kind === 'repair' && row.repair_stage ? `/homes/${row.home_id}/repairs/${row.id}` : `/homes/${row.home_id}#record-${row.id}`;
                return (
                  <li key={row.id}>
                    <Link className="block overflow-hidden rounded-xl border border-[#EAEBEE] hover:border-[#9EA3AB]" href={target}>
                      <span className="relative block">
                        {url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img alt={row.title} className="aspect-[4/3] w-full object-cover" src={url} />
                          : <span className="grid aspect-[4/3] w-full place-items-center bg-[#F2F3F6] text-[#9EA3AB]"><tab.icon aria-hidden="true" className="size-8" strokeWidth={1.4} /></span>}
                        <span className="absolute bottom-1.5 left-1.5 max-w-[90%] truncate rounded bg-white/90 px-1.5 py-0.5 text-[12px] font-semibold text-[#212124]">{labelOf.get(row.home_id) ?? '집'}</span>
                      </span>
                      <span className="block px-2.5 pb-2.5 pt-2">
                        <span className="block text-sm text-[#6B7079]">{day(row.occurred_at)}</span>
                        <span className="block truncate text-[15px] font-semibold text-[#212124]">{row.title}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-[#EAEBEE] px-4 py-10 text-center text-[15px] text-[#6B7079]">{homes.length ? '아직 남긴 기록이 없어요.' : '집이 연결되면 기록을 남길 수 있어요.'}</p>
          )}
          {tab.id === 'photo' && list.length > 0 && <p className="mt-3 text-center text-sm text-[#6B7079]">사진은 기록한 날짜 기준으로 정렬돼요.</p>}
        </section>

        <aside aria-label="요약" className="grid content-start gap-4">
          <section aria-labelledby="living-stats" className="rounded-2xl border border-[#E4E6EA] bg-white p-5">
            <h2 className="text-[17px] font-bold text-[#212124]" id="living-stats">기록 현황</h2>
            <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
              <Donut counts={counts} total={total} />
              <ul className="grid w-full gap-1.5 text-sm">
                {LEGEND.map((item) => <li className="flex items-center gap-2 whitespace-nowrap text-[#4D5159]" key={item.id}><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: item.color }} />{item.label} <strong className="ml-auto pl-2 text-[#212124]">{counts[item.id]}</strong></li>)}
              </ul>
            </div>
          </section>
          <section aria-labelledby="living-notices" className="rounded-2xl border border-[#E4E6EA] bg-white p-5">
            <h2 className="flex items-center justify-between text-[17px] font-bold text-[#212124]" id="living-notices">최근 알림<Bell aria-hidden="true" className="size-5 text-[#6B7079]" /></h2>
            {notices?.length ? (
              <ul className="mt-2 grid gap-2">{notices.map((notice) => <li className="text-sm leading-5 text-[#4D5159]" key={notice.id}>· {notice.detail ?? '새 메시지가 왔어요'} <span className="text-[#9EA3AB]">({day(notice.created_at)})</span></li>)}</ul>
            ) : <p className="mt-2 text-sm text-[#6B7079]">아직 온 알림이 없어요.</p>}
            <Link className="mt-3 flex min-h-11 items-center justify-center gap-1 rounded-lg border border-[#DCDEE3] text-sm font-semibold text-[#212124]" href="/notifications">알림 더보기<ChevronRight aria-hidden="true" className="size-4" /></Link>
          </section>
          <section className="rounded-2xl bg-[#F2F3F6] p-5">
            <h2 className="flex items-center gap-2 text-[17px] font-bold text-[#212124]"><Lightbulb aria-hidden="true" className="size-5 text-[#4D5159]" />꿀팁</h2>
            <p className="mt-2 text-sm leading-6 text-[#4D5159]">문제가 생기면 바로 사진을 찍어 두세요. 날짜가 함께 남은 사진은 나중에 중요한 증거가 돼요.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
