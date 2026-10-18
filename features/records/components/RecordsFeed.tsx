'use client';

import Link from 'next/link';
import { FileText, Image as ImageIcon, Wrench } from 'lucide-react';
import { useState } from 'react';

export type FeedRecord = {
  id: string;
  homeId: string;
  homeName: string;
  space: 'office_internal' | 'current_contract' | 'shared_history';
  kind: string;
  title: string;
  occurredAt: string;
  files: number;
};

export const spaceLabels: Record<FeedRecord['space'], string> = {
  office_internal: '사무소 내부',
  current_contract: '이번 계약 공유',
  shared_history: '집 이력',
};

const dayKey = (iso: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
export function dayLabel(iso: string, now = new Date()): string {
  const key = dayKey(iso);
  if (key === dayKey(now.toISOString())) return '오늘';
  if (key === dayKey(new Date(now.getTime() - 86_400_000).toISOString())) return '어제';
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(new Date(iso));
}

export function RecordsFeed({ records, now }: { records: FeedRecord[]; now?: Date }) {
  const [filter, setFilter] = useState<'all' | FeedRecord['space']>('all');
  const chips: Array<{ id: 'all' | FeedRecord['space']; label: string }> = [{ id: 'all', label: '전체' }, ...(Object.keys(spaceLabels) as FeedRecord['space'][]).map((id) => ({ id, label: spaceLabels[id] }))];
  const visible = filter === 'all' ? records : records.filter((record) => record.space === filter);
  const days: Array<{ day: string; items: FeedRecord[] }> = [];
  for (const record of visible) {
    const day = dayLabel(record.occurredAt, now);
    const group = days.find((item) => item.day === day);
    if (group) group.items.push(record); else days.push({ day, items: [record] });
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-4 sm:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#16211E]">기록</h1>
        <Link className="flex min-h-11 items-center text-[15px] font-semibold text-[#0B6655]" href="/homes">모든 집</Link>
      </div>
      <div aria-label="누가 보는 기록인지 고르기" className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group">
        {chips.map((chip) => (
          <button aria-pressed={filter === chip.id} className={`min-h-11 shrink-0 rounded-full px-4 text-[15px] ${filter === chip.id ? 'border border-[#0B6655] bg-[#0B6655] font-semibold text-white' : 'border border-[#C9D1CD] bg-white text-[#16211E]'}`} key={chip.id} onClick={() => setFilter(chip.id)} type="button">{chip.label}</button>
        ))}
      </div>
      {days.length ? days.map((group) => (
        <section className="mt-5" key={group.day}>
          <h2 className="mb-2 text-[15px] font-bold text-[#3E4B47]">{group.day}</h2>
          <ul className="grid gap-2">
            {group.items.map((record) => {
              const Icon = record.kind === 'repair' ? Wrench : record.files ? ImageIcon : FileText;
              return (
                <li key={record.id}>
                  <Link className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-3 hover:border-[#0B6655]" href={`/homes/${record.homeId}`}>
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#EEF1EF] text-[#3E4B47]"><Icon aria-hidden="true" className="size-5" /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-[#3E4B47]">{record.homeName} · {spaceLabels[record.space]}</span>
                      <strong className="block truncate text-base text-[#16211E]">{record.title}{record.files ? ` · 파일 ${record.files}개` : ''}</strong>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )) : (
        <div className="mt-6 rounded-[20px] border border-[#E1E6E3] bg-white p-8 text-center">
          <p className="text-base font-bold">{filter === 'all' ? '아직 남긴 기록이 없어요.' : `${spaceLabels[filter]} 기록이 없어요.`}</p>
          <p className="mt-1 text-[15px] text-[#5D6A65]">아래 + 버튼으로 첫 사진이나 메모를 남겨 보세요.</p>
        </div>
      )}
    </main>
  );
}
