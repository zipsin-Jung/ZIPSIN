'use client';

import { useState } from 'react';
import { BadgeCheck, NotebookPen, Plus } from 'lucide-react';
import { PhotoStrip } from '@/features/zipsin-clean/components/PhotoStrip';
import { DEMO_MY_RECORDS, MEMO_MAX, type CleanPhoto, type CleanRecord } from '@/features/zipsin-clean/domain/demo';
import { won } from '@/features/zipsin-clean/domain/pricing';

/**
 * 손님 마이페이지(체험): 내가 받은 청소 기록. 집신에서 예약한 기록 + 예전 청소를 직접 남긴 기록.
 * 체험이라 입력·사진은 화면에만 있고 저장되지 않는다.
 */
const SERVICES = ['입주·이사 청소', '생활 정리 청소', '특수 청소', '기타'];
const EMPTY = { month: '', partner: '', service: SERVICES[0], area: '', price: '', memo: '' };

export function CleanMyPage({ extra = [] }: { extra?: CleanRecord[] }) {
  const [own, setOwn] = useState<CleanRecord[]>([]);
  const [added, setAdded] = useState<Record<string, CleanPhoto[]>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formPhotos, setFormPhotos] = useState<CleanPhoto[]>([]);
  const [error, setError] = useState('');
  const [again, setAgain] = useState<string | null>(null);

  const records = [...extra, ...own, ...DEMO_MY_RECORDS].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  const field = 'min-h-12 w-full rounded-xl border border-[#C9D1CD] bg-white px-3 text-base';

  const save = () => {
    if (!form.month || !form.partner.trim() || !form.area.trim()) { setError('언제, 어느 업체, 어디인지 적어 주세요.'); return; }
    const [y, m] = form.month.split('-');
    const price = Number(form.price.replace(/[^0-9]/g, ''));
    setOwn([{ id: `own-${Date.now()}`, sortKey: form.month, date: `${y}년 ${Number(m)}월`, service: form.service, area: form.area.trim(), partner: form.partner.trim(), priceWon: price > 0 ? price : undefined, viaZipsin: false, memo: form.memo.trim() || undefined, photos: formPhotos }, ...own]);
    setForm(EMPTY); setFormPhotos([]); setError(''); setFormOpen(false);
  };

  return (
    <div className="grid gap-5">
      <p className="rounded-xl bg-[#F6EBD8] px-4 py-2 text-center text-sm font-semibold text-[#7A4E12]" role="note">체험용 화면이에요 · 입력한 내용과 사진은 저장되지 않아요</p>
      <div>
        <h1 className="!text-[24px] font-bold !leading-9 tracking-[-0.02em]">마이페이지</h1>
        <p className="mt-1 text-[15px] text-[#3E4B47]">어느 업체가, 어디를, 얼마에 청소했는지 한곳에 남겨요.</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="!text-lg font-bold !leading-7">내 청소 기록 <span className="text-[#0B6655]">{records.length}</span></h2>
        {!formOpen && <button className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#0B6655] px-3 text-[15px] font-semibold text-[#083E37]" onClick={() => setFormOpen(true)} type="button"><Plus aria-hidden="true" className="size-4" />예전 청소 남기기</button>}
      </div>

      {formOpen && (
        <section aria-label="예전 청소 남기기" className="grid gap-3 rounded-2xl border-2 border-[#0B6655] bg-white p-4">
          <p className="flex items-center gap-2 text-[17px] font-bold"><NotebookPen aria-hidden="true" className="size-5 text-[#0B6655]" />예전 청소 남기기</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-month">언제</label><input className={field} id="own-month" onChange={(event) => setForm({ ...form, month: event.target.value })} type="month" value={form.month} /></div>
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-service">청소 종류</label><select className={field} id="own-service" onChange={(event) => setForm({ ...form, service: event.target.value })} value={form.service}>{SERVICES.map((item) => <option key={item}>{item}</option>)}</select></div>
          </div>
          <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-partner">어느 업체·누가 했나요</label><input className={field} id="own-partner" onChange={(event) => setForm({ ...form, partner: event.target.value })} placeholder="예: ○○청소, 동네 이모님" value={form.partner} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-area">어디 (구·동)</label><input className={field} id="own-area" onChange={(event) => setForm({ ...form, area: event.target.value })} placeholder="예: 마포구 공덕동" value={form.area} /></div>
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-price">낸 금액 (선택)</label><input className={field} id="own-price" inputMode="numeric" onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="예: 250000" value={form.price} /></div>
          </div>
          <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-memo">메모 (선택)</label><textarea className="min-h-20 w-full rounded-xl border border-[#C9D1CD] bg-white p-3 text-base" id="own-memo" maxLength={MEMO_MAX} onChange={(event) => setForm({ ...form, memo: event.target.value })} placeholder="예: 꼼꼼했어요 / 현장에서 돈을 더 달라고 했어요" value={form.memo} /></div>
          <div className="grid gap-1"><p className="text-[15px] font-bold">사진 (선택)</p><PhotoStrip onAdd={(photos) => setFormPhotos([...formPhotos, ...photos])} photos={formPhotos} /></div>
          {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button className="min-h-12 rounded-xl border border-[#C9D1CD] bg-white text-[15px] font-semibold" onClick={() => { setFormOpen(false); setError(''); }} type="button">닫기</button>
            <button className="min-h-12 rounded-xl bg-[#0B6655] text-[15px] font-bold text-white" onClick={save} type="button">남기기</button>
          </div>
        </section>
      )}

      <ul className="grid gap-4">
        {records.map((record) => {
          const photos = [...record.photos, ...(added[record.id] ?? [])];
          return (
            <li key={record.id}>
              <article aria-label={`${record.date} ${record.service}`} className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-[#5D6A65]">{record.date}</p>
                    <h3 className="!text-[17px] font-bold !leading-7">{record.service}</h3>
                    <p className="text-[15px] text-[#3E4B47]">{record.area} · {record.partner}</p>
                  </div>
                  {record.viaZipsin
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-[#E3F0EC] px-2.5 py-0.5 text-sm font-semibold text-[#083E37]"><BadgeCheck aria-hidden="true" className="size-4" />집신 예약</span>
                    : <span className="rounded-full bg-[#F1F3F2] px-2.5 py-0.5 text-sm font-semibold text-[#5D6A65]">직접 남긴 기록</span>}
                </div>
                {(record.priceWon || record.viaZipsin) && (
                  <dl className="grid gap-1 text-[15px]">
                    {record.priceWon && <div className="flex justify-between"><dt className="text-[#3E4B47]">{record.viaZipsin ? '확정 가격' : '낸 금액'}</dt><dd className="font-semibold">{won(record.priceWon)}</dd></div>}
                    {record.viaZipsin && <div className="flex justify-between text-[#0B6655]"><dt>+ 추가요금 작업 시작 뒤</dt><dd className="font-bold">0원</dd></div>}
                  </dl>
                )}
                {record.memo && <p className="rounded-xl bg-[#F7F7F3] p-3 text-[15px] leading-6 text-[#3E4B47]">{record.memo}</p>}
                <PhotoStrip onAdd={(more) => setAdded({ ...added, [record.id]: [...(added[record.id] ?? []), ...more] })} photos={photos} />
                {record.viaZipsin && (again === record.id
                  ? <p className="rounded-xl bg-[#E3F0EC] p-3 text-[15px] text-[#083E37]" role="status">체험이에요. 실제 서비스에서는 이 업체로 가격 보기부터 시작해요.</p>
                  : <button className="min-h-12 rounded-xl border border-[#C9D1CD] bg-white text-[15px] font-semibold" onClick={() => setAgain(record.id)} type="button">이 업체 다시 부르기</button>)}
              </article>
            </li>
          );
        })}
      </ul>

      <p className="text-sm leading-6 text-[#5D6A65]">이 기록은 나만 봐요. 금액·메모·직접 올린 사진은 업체와 다음에 이 집에 사는 사람에게 보이지 않아요. 직접 남긴 기록은 집신이 확인한 기록이 아니에요.</p>
    </div>
  );
}
