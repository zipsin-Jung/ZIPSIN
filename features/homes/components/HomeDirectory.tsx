'use client';

import Link from 'next/link';
import { Image as ImageIcon, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export type HomeFilter = 'all' | 'expiring' | 'task';
type HomeSummary = {
  id: string;
  label: string;
  address: string;
  contractDay?: { label: string; days: number } | null;
  openTaskTitle?: string | null;
};

const EXPIRING_DAYS = 90;
const isExpiring = (home: HomeSummary) => Boolean(home.contractDay && home.contractDay.days >= 0 && home.contractDay.days <= EXPIRING_DAYS);

export function HomeDirectory({ homes, initialFilter = 'all' }: { homes: HomeSummary[]; initialFilter?: HomeFilter }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HomeFilter>(initialFilter);
  const [sort, setSort] = useState<'recent' | 'name'>('recent');
  const chips: Array<{ id: HomeFilter; label: string; count: number }> = [
    { id: 'all', label: '전체', count: homes.length },
    { id: 'expiring', label: `${EXPIRING_DAYS}일 내 만기`, count: homes.filter(isExpiring).length },
    { id: 'task', label: '할 일 있음', count: homes.filter((home) => home.openTaskTitle).length },
  ];
  const visible = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko-KR');
    let list = keyword ? homes.filter((home) => `${home.label} ${home.address}`.toLocaleLowerCase('ko-KR').includes(keyword)) : homes;
    if (filter === 'expiring') list = list.filter(isExpiring).sort((a, b) => (a.contractDay?.days ?? 0) - (b.contractDay?.days ?? 0));
    if (filter === 'task') list = list.filter((home) => home.openTaskTitle);
    return sort === 'name' ? [...list].sort((a, b) => a.label.localeCompare(b.label, 'ko-KR')) : list;
  }, [homes, query, filter, sort]);

  return (
    <section className="mt-4">
      <div className="grid gap-2 md:grid-cols-[1fr_180px]">
        <label className="relative block">
          <span className="sr-only">집 검색</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#5D6A65]" />
          <input aria-label="집 검색" className="min-h-12 w-full rounded-xl border border-[#C9D1CD] bg-white pl-11 pr-4 text-base" onChange={(event) => setQuery(event.target.value)} placeholder="집 이름이나 주소로 찾기" type="search" value={query} />
        </label>
        <label className="flex items-center gap-2 text-[15px] text-[#3E4B47]">
          <span className="shrink-0">정렬</span>
          <select className="min-h-12 w-full rounded-xl border border-[#C9D1CD] bg-white px-3 text-base" onChange={(event) => setSort(event.target.value as 'recent' | 'name')} value={sort}>
            <option value="recent">최근 등록순</option><option value="name">이름순</option>
          </select>
        </label>
      </div>
      <div aria-label="집 고르기" className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group">
        {chips.map((chip) => (
          <button
            aria-pressed={filter === chip.id}
            className={`min-h-11 shrink-0 rounded-full px-4 text-[15px] ${filter === chip.id ? 'border border-[#0B6655] bg-[#0B6655] font-semibold text-white' : 'border border-[#C9D1CD] bg-white text-[#16211E]'}`}
            key={chip.id}
            onClick={() => setFilter(chip.id)}
            type="button"
          >
            {chip.label} {chip.count}
          </button>
        ))}
      </div>
      {visible.length ? (
        <ul className="mt-3 grid gap-2.5 lg:grid-cols-2">
          {visible.map((home) => (
            <li className="flex items-center gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-3" key={home.id}>
              <Link aria-label={`${home.label} 기록 열기`} className="flex min-w-0 flex-1 items-center gap-3" href={`/homes/${home.id}`}>
                <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-[#EEF1EF] text-[#5D6A65]"><ImageIcon aria-hidden="true" className="size-5" /><span className="text-xs">사진 없음</span></span>
                <span className="min-w-0">
                  <h2 className="truncate text-[17px] font-bold text-[#16211E]">{home.label}</h2>
                  <span className="block truncate text-[15px] text-[#3E4B47]">{home.address}</span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {home.contractDay && <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${isExpiring(home) ? 'bg-[#E3F0EC] text-[#083E37]' : 'bg-[#F1F3F2] text-[#3E4B47]'}`}>만기 {home.contractDay.label}</span>}
                    {home.openTaskTitle && <span className="max-w-[12rem] truncate rounded-full bg-[#F1F3F2] px-2.5 py-0.5 text-sm text-[#3E4B47]">할 일 · {home.openTaskTitle}</span>}
                  </span>
                </span>
              </Link>
              <Link aria-label={`${home.label} 새 기록`} className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#C9D1CD] text-[#0B6655]" href={`/homes/${home.id}/records/new`}>
                <Plus aria-hidden="true" className="size-5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-2xl border border-[#E1E6E3] bg-white p-8 text-center">
          <p className="text-base font-bold text-[#16211E]">{query ? '검색 결과가 없습니다.' : '이 조건에 맞는 집이 없어요.'}</p>
          <p className="mt-1 text-[15px] text-[#5D6A65]">{query ? '집 이름이나 주소를 다시 확인해 주세요.' : '전체를 눌러 모든 집을 볼 수 있어요.'}</p>
        </div>
      )}
    </section>
  );
}
