'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type HomeSummary = { id: string; label: string; address: string };

export function HomeDirectory({ homes }: { homes: HomeSummary[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'name'>('recent');
  const visible = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko-KR');
    const filtered = keyword ? homes.filter((home) => `${home.label} ${home.address}`.toLocaleLowerCase('ko-KR').includes(keyword)) : homes;
    return sort === 'name' ? [...filtered].sort((a, b) => a.label.localeCompare(b.label, 'ko-KR')) : filtered;
  }, [homes, query, sort]);

  return (
    <section className="mt-8">
      <div className="app-panel grid gap-3 rounded-[24px] p-4 md:grid-cols-[1fr_180px] md:p-5">
        <label className="grid gap-2 text-sm font-bold text-[#3E4B47]">집 검색
          <input aria-label="집 검색" className="min-h-12 rounded-xl border border-[#E1E6E3] bg-white px-4 text-base" onChange={(event) => setQuery(event.target.value)} placeholder="집 이름 또는 주소" type="search" value={query} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[#3E4B47]">정렬
          <select className="min-h-12 rounded-xl border border-[#E1E6E3] bg-white px-3" onChange={(event) => setSort(event.target.value as 'recent' | 'name')} value={sort}>
            <option value="recent">최근 등록순</option><option value="name">이름순</option>
          </select>
        </label>
      </div>
      {visible.length ? <ul className="mt-4 grid gap-4 lg:grid-cols-2">{visible.map((home) => (
        <li className="app-panel rounded-[24px] p-6" key={home.id}>
          <span className="text-xs font-bold text-[#0B6655]">비공개 집 기록</span>
          <h2 className="mt-3 text-xl font-extrabold text-[#16211E]">{home.label}</h2>
          <p className="mt-2 break-words text-[#5a7180]">{home.address}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link aria-label={`${home.label} 기록 열기`} className="font-bold text-[#0B6655]" href={`/homes/${home.id}`}>기록 열기 →</Link>
            <Link aria-label={`${home.label} 새 기록`} className="font-bold text-[#345d70]" href={`/homes/${home.id}/records/new`}>새 기록</Link>
          </div>
        </li>
      ))}</ul> : <div className="app-panel mt-4 rounded-[24px] p-10 text-center"><p className="font-bold text-[#3E4B47]">검색 결과가 없습니다.</p><p className="mt-2 text-sm text-[#5D6A65]">집 이름이나 주소를 다시 확인해 주세요.</p></div>}
    </section>
  );
}
