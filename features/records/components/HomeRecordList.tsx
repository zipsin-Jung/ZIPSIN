'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AttachmentLink } from '@/features/attachments/components/AttachmentLink';
import { AttachmentUploader } from '@/features/attachments/components/AttachmentUploader';
import { ShareRecordButton } from '@/features/records/components/ShareRecordButton';
import { spaceLabels, type FeedRecord } from '@/features/records/components/RecordsFeed';

export type HomeRecordItem = {
  id: string;
  kind: string;
  space: FeedRecord['space'];
  title: string;
  occurredAt: string;
  attachments: Array<{ id: string; name: string }>;
};

const kindLabels: Record<string, string> = { note: '메모', photo: '사진', document: '문서', repair: '수리', schedule: '일정', task: '할 일' };

export function HomeRecordList({ homeId, homeName, records }: { homeId: string; homeName: string; records: HomeRecordItem[] }) {
  const [filter, setFilter] = useState<'all' | FeedRecord['space']>('all');
  const chips: Array<{ id: 'all' | FeedRecord['space']; label: string }> = [{ id: 'all', label: '전체' }, ...(Object.keys(spaceLabels) as FeedRecord['space'][]).map((id) => ({ id, label: spaceLabels[id] }))];
  const visible = filter === 'all' ? records : records.filter((record) => record.space === filter);
  if (!records.length) {
    return (
      <div className="rounded-[20px] border border-[#E1E6E3] bg-white p-8 text-center">
        <p className="text-lg font-bold text-[#16211E]">아직 남긴 기록이 없습니다.</p>
        <p className="mt-2 text-[15px] text-[#5D6A65]">첫 사진이나 메모를 남기면 이 집의 시간순 기록이 시작됩니다.</p>
        <Link href={`/homes/${homeId}/records/new`} className="app-primary mt-5 inline-flex min-h-12 items-center rounded-xl px-5 text-base font-bold text-white">첫 기록 남기기</Link>
      </div>
    );
  }
  return (
    <div>
      <div aria-label="누가 보는 기록인지 고르기" className="flex gap-2 overflow-x-auto pb-1" role="group">
        {chips.map((chip) => (
          <button aria-pressed={filter === chip.id} className={`min-h-11 shrink-0 rounded-full px-4 text-[15px] ${filter === chip.id ? 'border border-[#0B6655] bg-[#0B6655] font-semibold text-white' : 'border border-[#C9D1CD] bg-white text-[#16211E]'}`} key={chip.id} onClick={() => setFilter(chip.id)} type="button">{chip.label}</button>
        ))}
      </div>
      {visible.length ? (
        <ol className="mt-3 grid gap-2.5">
          {visible.map((record) => (
            <li className="scroll-mt-24 rounded-2xl border border-[#E1E6E3] bg-white p-4" id={`record-${record.id}`} key={record.id}>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#3E4B47]">
                <span className="rounded-full bg-[#F1F3F2] px-2.5 py-0.5 font-semibold">{spaceLabels[record.space]}</span>
                <span>{kindLabels[record.kind] ?? '기록'}</span>
                <time dateTime={record.occurredAt}>{new Date(record.occurredAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</time>
              </div>
              <h3 className="mt-2 text-[17px] font-bold text-[#16211E]">{record.title}</h3>
              {record.attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{record.attachments.map((attachment) => <AttachmentLink attachmentId={attachment.id} key={attachment.id} name={attachment.name} />)}</div>}
              <div className="mt-3 flex flex-wrap items-start gap-2">
                <ShareRecordButton path={`/homes/${homeId}#record-${record.id}`} text={`[집신] ${homeName} · ${record.title}`} />
              </div>
              <AttachmentUploader recordId={record.id} />
            </li>
          ))}
        </ol>
      ) : <p className="mt-4 rounded-2xl border border-[#E1E6E3] bg-white p-6 text-center text-base text-[#3E4B47]">{filter !== 'all' && `${spaceLabels[filter]} 기록이 없어요.`}</p>}
    </div>
  );
}
