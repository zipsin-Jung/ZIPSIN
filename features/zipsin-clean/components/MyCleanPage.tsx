'use client';

import { useState } from 'react';
import { BadgeCheck, NotebookPen, Plus } from 'lucide-react';
import { PhotoStrip } from '@/features/zipsin-clean/components/PhotoStrip';
import { Card, Notice, Primary, Row, Secondary, StatusPill, choiceClass, fieldClass } from '@/features/zipsin-clean/components/ui';
import { INSPECT_QUESTIONS, MEMO_MAX, RECORD_SERVICES, STATUS_LABEL } from '@/features/zipsin-clean/domain/constants';
import { won } from '@/features/zipsin-clean/domain/pricing';
import { formatHour } from '@/features/zipsin-clean/domain/schedule';
import type { CustomerBooking, MyRecord, VisitRequest } from '@/features/zipsin-clean/domain/types';
import type { BookingActionPayload, RecordPayload } from '@/features/zipsin-clean/schemas/booking';
import type { PhotoTarget } from '@/features/zipsin-clean/client/upload-photo';

type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string };
export type MyCleanPageProps = {
  bookings: CustomerBooking[];
  records: MyRecord[];
  visits: VisitRequest[];
  act: (payload: BookingActionPayload) => Promise<Result<{ status: string }>>;
  addRecord: (payload: RecordPayload) => Promise<Result<{ recordId: string }>>;
  removeRecord: (recordId: string) => Promise<Result>;
  upload: (target: PhotoTarget, files: File[]) => Promise<string | null>;
  refresh: () => void;
};

const dateLabel = (iso: string) => { const [, m, d] = iso.split('-').map(Number); return `${m}월 ${d}일`; };
const monthLabel = (iso: string) => { const [y, m] = iso.split('-').map(Number); return `${y}년 ${m}월`; };
const EMPTY = { month: '', partnerName: '', service: RECORD_SERVICES[0] as string, areaDistrict: '', price: '', memo: '' };

function BookingCard({ booking, act, refresh }: { booking: CustomerBooking; act: MyCleanPageProps['act']; refresh: () => void }) {
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const run = async (payload: Omit<BookingActionPayload, 'bookingId'>) => {
    setBusy(true); setError('');
    const done = await act({ bookingId: booking.id, ...payload });
    setBusy(false);
    if (!done.ok) setError(done.error); else refresh();
  };
  const problems = INSPECT_QUESTIONS.filter((question) => answers[question.id] === 'yes');
  const allAnswered = INSPECT_QUESTIONS.every((question) => answers[question.id]);
  const service = booking.service === 'tidy' ? `생활 정리 청소 · ${booking.hours}시간` : `입주 청소 · ${booking.areaPyeong}평`;

  return (
    <li>
      <article aria-label={`${dateLabel(booking.serviceDate)} ${service}`} className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-[#5D6A65]">{dateLabel(booking.serviceDate)} · {formatHour(booking.startHour)}</p>
            <h3 className="!text-[17px] font-bold !leading-7">{service}</h3>
            <p className="text-[15px] text-[#3E4B47]">{booking.areaDistrict} · {booking.partnerName}</p>
          </div>
          <StatusPill label={STATUS_LABEL[booking.status]} status={booking.status} />
        </div>
        <dl className="grid gap-1 text-[15px]">
          <div className="flex justify-between"><dt className="text-[#3E4B47]">{booking.status === 'requested' ? '예상 가격 (수락하면 확정)' : '확정 가격'}</dt><dd className="font-semibold">{won(booking.priceWon)}</dd></div>
          {booking.status === 'completed' && <div className="flex justify-between text-[#0B6655]"><dt>+ 추가요금 작업 시작 뒤</dt><dd className="font-bold">0원</dd></div>}
        </dl>
        {booking.partnerNote && <p className="rounded-xl bg-[#F7F7F3] p-3 text-[15px] leading-6 text-[#3E4B47]"><b className="block text-[#16211E]">업체가 남긴 말</b>{booking.partnerNote}</p>}
        {booking.status === 'block_reported' && <Notice tone="gold">업체가 &lsquo;{booking.blockReason}&rsquo;(으)로 청소를 시작할 수 없다고 알렸어요. 집신이 사진을 확인하고 연락드려요. 서로 위약금은 없어요.</Notice>}
        {booking.status === 'declined' && <Notice tone="gold">업체가 이 날 할 수 없다고 했어요. 다른 업체로 다시 예약해 주세요.</Notice>}
        {booking.photos.length > 0 && <PhotoStrip photos={booking.photos} />}

        {(booking.status === 'requested' || booking.status === 'accepted') && (confirmCancel
          ? <div className="grid gap-2"><Notice tone="gold">정말 취소할까요? 취소하면 되돌릴 수 없어요.</Notice><div className="grid grid-cols-2 gap-2"><Secondary onClick={() => setConfirmCancel(false)}>아니요</Secondary><Secondary disabled={busy} onClick={() => run({ action: 'cancel' })}>예약 취소</Secondary></div></div>
          : <Secondary onClick={() => setConfirmCancel(true)}>예약 취소하기</Secondary>)}

        {booking.status === 'done' && (
          <div className="grid gap-3 rounded-xl border border-[#C9D1CD] p-3">
            <p className="text-[17px] font-bold">어렵지 않아요. 손으로 확인해 보세요</p>
            {INSPECT_QUESTIONS.map((question) => (
              <fieldset className="grid gap-2" key={question.id}>
                <legend className="mb-1 text-[15px] font-semibold">{question.text}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['no', 'yes'] as const).map((value) => (
                    <label className={choiceClass(answers[question.id] === value)} key={value}>
                      <input checked={answers[question.id] === value} className="sr-only" name={`${booking.id}-${question.id}`} onChange={() => setAnswers({ ...answers, [question.id]: value })} type="radio" value={value} />
                      {value === 'no' ? '아니요' : '예'}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            {problems.length > 0
              ? <Primary disabled={busy} onClick={() => run({ action: 'request_redo', answers })}>{problems.length}곳 다시 해 달라고 하기 (추가요금 없음)</Primary>
              : (
                <>
                  <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl bg-[#F7F7F3] p-3 text-[15px] leading-6">
                    <input checked={consent} className="mt-1 size-5 accent-[#0B6655]" onChange={(event) => setConsent(event.target.checked)} type="checkbox" />
                    <span>청소 전·후 사진을 이 업체를 고르는 다른 손님에게 보여 줘도 괜찮아요 (선택). 주소·이름은 보이지 않아요.</span>
                  </label>
                  <Primary disabled={!allAnswered || busy} onClick={() => run({ action: 'approve', answers, consent })}>검수 완료</Primary>
                  <p className="text-sm text-[#5D6A65]">검수를 마친 뒤 확정 가격을 업체에 직접 내 주세요.</p>
                </>
              )}
          </div>
        )}
        {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
      </article>
    </li>
  );
}

export function MyCleanPage({ bookings, records, visits, act, addRecord, removeRecord, upload, refresh }: MyCleanPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const save = async () => {
    if (!form.month || !form.partnerName.trim() || !form.areaDistrict.trim()) return setError('언제, 어느 업체, 어디인지 적어 주세요.');
    const price = Number(form.price.replace(/[^0-9]/g, ''));
    setBusy(true);
    const saved = await addRecord({ month: form.month, service: form.service as RecordPayload['service'], partnerName: form.partnerName.trim(), areaDistrict: form.areaDistrict.trim(), priceWon: price > 0 ? price : null, memo: form.memo.trim() });
    setBusy(false);
    if (!saved.ok) return setError(saved.error);
    setForm(EMPTY); setError(''); setFormOpen(false); refresh();
  };
  const active = bookings.filter((item) => item.status !== 'completed' && item.status !== 'cancelled' && item.status !== 'declined');
  const past = bookings.filter((item) => !active.includes(item));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="!text-[24px] font-bold !leading-9 tracking-[-0.02em]">마이페이지</h1>
        <p className="mt-1 text-[15px] text-[#3E4B47]">어느 업체가, 어디를, 얼마에 청소했는지 한곳에 남아요.</p>
      </div>

      <section aria-label="진행 중인 예약" className="grid gap-3">
        <h2 className="!text-lg font-bold !leading-7">진행 중인 예약 <span className="text-[#0B6655]">{active.length}</span></h2>
        {active.length === 0 ? <p className="text-[15px] text-[#5D6A65]">진행 중인 예약이 없어요.</p> : <ul className="grid gap-4">{active.map((booking) => <BookingCard act={act} booking={booking} key={booking.id} refresh={refresh} />)}</ul>}
      </section>

      <section aria-label="내 청소 기록" className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="!text-lg font-bold !leading-7">내 청소 기록 <span className="text-[#0B6655]">{past.length + records.length}</span></h2>
          {!formOpen && <button className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#0B6655] px-3 text-[15px] font-semibold text-[#083E37]" onClick={() => setFormOpen(true)} type="button"><Plus aria-hidden="true" className="size-4" />예전 청소 남기기</button>}
        </div>

        {formOpen && (
          <Card label="예전 청소 남기기">
            <p className="flex items-center gap-2 text-[17px] font-bold"><NotebookPen aria-hidden="true" className="size-5 text-[#0B6655]" />예전 청소 남기기</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-month">언제</label><input className={fieldClass} id="own-month" onChange={(event) => setForm({ ...form, month: event.target.value })} type="month" value={form.month} /></div>
              <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-service">청소 종류</label><select className={fieldClass} id="own-service" onChange={(event) => setForm({ ...form, service: event.target.value })} value={form.service}>{RECORD_SERVICES.map((item) => <option key={item}>{item}</option>)}</select></div>
            </div>
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-partner">어느 업체·누가 했나요</label><input className={fieldClass} id="own-partner" maxLength={40} onChange={(event) => setForm({ ...form, partnerName: event.target.value })} placeholder="예: ○○청소, 동네 이모님" value={form.partnerName} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-area">어디 (구·동)</label><input className={fieldClass} id="own-area" maxLength={40} onChange={(event) => setForm({ ...form, areaDistrict: event.target.value })} placeholder="예: 마포구 공덕동" value={form.areaDistrict} /></div>
              <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-price">낸 금액 (선택)</label><input className={fieldClass} id="own-price" inputMode="numeric" onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="예: 250000" value={form.price} /></div>
            </div>
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="own-memo">메모 (선택)</label><textarea className="min-h-20 w-full rounded-xl border border-[#C9D1CD] bg-white p-3 text-base" id="own-memo" maxLength={MEMO_MAX} onChange={(event) => setForm({ ...form, memo: event.target.value })} placeholder="예: 꼼꼼했어요 / 현장에서 돈을 더 달라고 했어요" value={form.memo} /></div>
            <p className="text-sm text-[#5D6A65]">사진은 남긴 뒤 기록에서 추가할 수 있어요.</p>
            {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
            <div className="grid grid-cols-2 gap-2"><Secondary onClick={() => { setFormOpen(false); setError(''); }}>닫기</Secondary><Primary disabled={busy} onClick={save}>남기기</Primary></div>
          </Card>
        )}

        {past.length === 0 && records.length === 0 && !formOpen && <p className="text-[15px] text-[#5D6A65]">아직 기록이 없어요. 예전에 받은 청소도 남겨 둘 수 있어요.</p>}
        <ul className="grid gap-4">
          {past.map((booking) => <BookingCard act={act} booking={booking} key={booking.id} refresh={refresh} />)}
          {records.map((record) => (
            <li key={record.id}>
              <article aria-label={`${monthLabel(record.doneMonth)} ${record.service}`} className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><p className="text-sm text-[#5D6A65]">{monthLabel(record.doneMonth)}</p><h3 className="!text-[17px] font-bold !leading-7">{record.service}</h3><p className="text-[15px] text-[#3E4B47]">{record.areaDistrict} · {record.partnerName}</p></div>
                  <span className="rounded-full bg-[#F1F3F2] px-2.5 py-0.5 text-sm font-semibold text-[#5D6A65]">직접 남긴 기록</span>
                </div>
                {record.priceWon && <dl><Row label="낸 금액" value={won(record.priceWon)} /></dl>}
                {record.memo && <p className="rounded-xl bg-[#F7F7F3] p-3 text-[15px] leading-6 text-[#3E4B47]">{record.memo}</p>}
                <PhotoStrip onAdd={async (files) => { const problem = await upload({ kind: 'record', recordId: record.id }, files); if (!problem) refresh(); return problem; }} photos={record.photos} />
                {removing === record.id
                  ? <div className="grid grid-cols-2 gap-2"><Secondary onClick={() => setRemoving(null)}>아니요</Secondary><Secondary onClick={async () => { const done = await removeRecord(record.id); setRemoving(null); if (done.ok) refresh(); }}>지우기</Secondary></div>
                  : <button className="min-h-11 justify-self-end px-2 text-sm text-[#5D6A65] underline" onClick={() => setRemoving(record.id)} type="button">이 기록 지우기</button>}
              </article>
            </li>
          ))}
        </ul>
      </section>

      {visits.length > 0 && (
        <section aria-label="방문 견적 요청" className="grid gap-3">
          <h2 className="!text-lg font-bold !leading-7">방문 견적 요청</h2>
          <ul className="grid gap-2">
            {visits.map((item) => (
              <li className="rounded-2xl border border-[#E1E6E3] bg-white p-4 text-[15px]" key={item.id}>
                <p className="font-semibold">{item.kind === 'special' ? `특수 청소 · ${item.special.join(', ')}` : item.kind === 'tidy' ? '생활 정리 청소' : '입주·이사 청소'}</p>
                <p className="text-[#3E4B47]">{item.areaDistrict} · {dateLabel(item.visitDate)} {item.slot} · {item.status === 'requested' ? '집신 확인 중' : item.status === 'contacted' ? '연락함' : '끝남'}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="flex gap-2 text-sm leading-6 text-[#5D6A65]"><BadgeCheck aria-hidden="true" className="size-5 shrink-0" />이 기록은 나만 봐요. 금액·메모·직접 올린 사진은 업체와 다음에 이 집에 사는 사람에게 보이지 않아요. 직접 남긴 기록은 집신이 확인한 기록이 아니에요.</p>
    </div>
  );
}
