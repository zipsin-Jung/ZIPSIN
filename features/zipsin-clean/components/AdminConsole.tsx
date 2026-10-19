'use client';

import { useState } from 'react';
import { Card, Notice, Primary, Secondary, StatusPill, fieldClass } from '@/features/zipsin-clean/components/ui';
import { STATUS_LABEL } from '@/features/zipsin-clean/domain/constants';
import { won } from '@/features/zipsin-clean/domain/pricing';
import type { AdminBooking, AdminPartner, VisitRequest } from '@/features/zipsin-clean/domain/types';
import type { BookingActionPayload, PartnerPayload } from '@/features/zipsin-clean/schemas/booking';

type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string };
export type AdminConsoleProps = {
  partners: AdminPartner[];
  bookings: AdminBooking[];
  visits: VisitRequest[];
  createPartner: (payload: PartnerPayload) => Promise<Result<{ partnerId: string }>>;
  createInvite: (partnerId: string) => Promise<Result<{ code: string }>>;
  setStatus: (partnerId: string, status: AdminPartner['status']) => Promise<Result>;
  act: (payload: BookingActionPayload) => Promise<Result<{ status: string }>>;
  refresh: () => void;
};

const PARTNER_STATUS: Record<AdminPartner['status'], string> = { active: '예약 받는 중', suspended: '잠시 멈춤', red_card: '퇴출(레드카드)' };
const dateLabel = (iso: string) => { const [, m, d] = iso.slice(0, 10).split('-').map(Number); return `${m}월 ${d}일`; };

export function AdminConsole({ partners, bookings, visits, createPartner, createInvite, setStatus, act, refresh }: AdminConsoleProps) {
  const [tab, setTab] = useState<'partners' | 'bookings' | 'visits'>('partners');
  const [form, setForm] = useState({ name: '', kind: 'company' as 'company' | 'individual', area: '', team: '', checks: '대표 대면, 현장 동행' });
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const blocked = bookings.filter((item) => item.status === 'block_reported');

  const wrap = async <T,>(task: () => Promise<Result<T>>, after?: (value: T) => void) => {
    setBusy(true); setError('');
    const done = await task();
    setBusy(false);
    if (!done.ok) { setError(done.error); return; }
    after?.(done.value);
    refresh();
  };

  return (
    <div className="grid gap-5">
      <div><p className="text-sm text-[#5D6A65]">집신 운영자</p><h1 className="!text-[22px] font-bold !leading-8 tracking-[-0.02em]">집신청소 관리</h1></div>
      {blocked.length > 0 && <Notice role="status" tone="gold">시작 불가 신고 {blocked.length}건을 확인해 주세요.</Notice>}
      <div aria-label="관리 메뉴" className="grid grid-cols-3 gap-1 rounded-xl bg-[#E1E6E3] p-1" role="tablist">
        {([['partners', `업체 ${partners.length}`], ['bookings', `예약 ${bookings.length}`], ['visits', `방문 요청 ${visits.length}`]] as const).map(([value, label]) => (
          <button aria-selected={tab === value} className={`min-h-11 rounded-lg text-[15px] font-semibold ${tab === value ? 'bg-white text-[#083E37] shadow-sm' : 'text-[#3E4B47]'}`} key={value} onClick={() => setTab(value)} role="tab" type="button">{label}</button>
        ))}
      </div>
      {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}

      {tab === 'partners' && (
        <>
          <Card label="업체 등록">
            <p className="text-[17px] font-bold">대표님을 만나 확인한 업체 등록</p>
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="partner-name">업체·이름</label><input className={fieldClass} id="partner-name" maxLength={40} onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="partner-kind">종류</label><select className={fieldClass} id="partner-kind" onChange={(event) => setForm({ ...form, kind: event.target.value as 'company' | 'individual' })} value={form.kind}><option value="company">업체</option><option value="individual">개인(이모님 등)</option></select></div>
              <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="partner-area">지역</label><input className={fieldClass} id="partner-area" maxLength={40} onChange={(event) => setForm({ ...form, area: event.target.value })} placeholder="예: 마포·서대문" value={form.area} /></div>
            </div>
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="partner-team">팀 (선택)</label><input className={fieldClass} id="partner-team" maxLength={40} onChange={(event) => setForm({ ...form, team: event.target.value })} placeholder="예: 정직원 팀, 대표 직접 참여" value={form.team} /></div>
            <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="partner-checks">확인한 것 (쉼표로)</label><input className={fieldClass} id="partner-checks" onChange={(event) => setForm({ ...form, checks: event.target.value })} value={form.checks} /></div>
            <Primary disabled={busy || !form.name.trim()} onClick={() => wrap(() => createPartner({ name: form.name.trim(), kind: form.kind, area: form.area.trim(), team: form.team.trim(), checks: form.checks.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 6) }), () => setForm({ ...form, name: '', area: '', team: '' }))}>업체 등록</Primary>
          </Card>
          <ul className="grid gap-3">
            {partners.map((partner) => (
              <li key={partner.id}>
                <article aria-label={partner.name} className="grid gap-2 rounded-2xl border border-[#E1E6E3] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-[17px]">{partner.name}</strong><span className="text-sm font-semibold text-[#5D6A65]">{PARTNER_STATUS[partner.status]}</span></div>
                  <p className="text-[15px] text-[#3E4B47]">{[partner.kind === 'individual' ? '개인' : '업체', partner.area, partner.team, `계정 ${partner.memberCount}개`].filter(Boolean).join(' · ')}</p>
                  {codes[partner.id] && (
                    <div className="grid gap-1 rounded-xl bg-[#F6EBD8] p-3 text-[#7A4E12]" role="status">
                      <p className="text-sm">초대 코드 (지금 한 번만 보여요 · 14일 동안 한 번 쓸 수 있어요)</p>
                      <p className="select-all font-mono text-[22px] font-bold tracking-widest">{codes[partner.id]}</p>
                      <p className="text-sm">대표님께 직접 전해 주세요. 대표님은 집신 계정으로 로그인한 뒤 업체 화면에서 이 코드를 넣어요.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Secondary disabled={busy} onClick={() => wrap(() => createInvite(partner.id), (value) => setCodes({ ...codes, [partner.id]: value.code }))}>초대 코드 만들기</Secondary>
                    {partner.status === 'active'
                      ? <Secondary disabled={busy} onClick={() => wrap(() => setStatus(partner.id, 'suspended'))}>잠시 멈춤</Secondary>
                      : <Secondary disabled={busy} onClick={() => wrap(() => setStatus(partner.id, 'active'))}>다시 받기</Secondary>}
                  </div>
                  {partner.status !== 'red_card' && <button className="min-h-11 justify-self-end px-2 text-sm text-red-700 underline" disabled={busy} onClick={() => wrap(() => setStatus(partner.id, 'red_card'))} type="button">레드카드(퇴출)</button>}
                </article>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'bookings' && (
        <ul className="grid gap-3">
          {bookings.length === 0 && <p className="text-[15px] text-[#3E4B47]">아직 예약이 없어요.</p>}
          {bookings.map((booking) => (
            <li className="grid gap-2 rounded-2xl border border-[#E1E6E3] bg-white p-4" key={booking.id}>
              <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-[15px]">{dateLabel(booking.serviceDate)} · {booking.areaDistrict}</strong><StatusPill label={STATUS_LABEL[booking.status]} status={booking.status} /></div>
              <p className="text-[15px] text-[#3E4B47]">{booking.partnerName} · {won(booking.priceWon)}</p>
              {booking.status === 'block_reported' && (
                <>
                  <Notice tone="gold">사유: {booking.blockReason}{booking.blockNote ? ` · ${booking.blockNote}` : ''}</Notice>
                  <Primary disabled={busy} onClick={() => wrap(() => act({ bookingId: booking.id, action: 'confirm_block' }))}>확인함 · 위약금 없이 취소</Primary>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === 'visits' && (
        <ul className="grid gap-3">
          {visits.length === 0 && <p className="text-[15px] text-[#3E4B47]">아직 방문 견적 요청이 없어요.</p>}
          {visits.map((visit) => (
            <li className="grid gap-1 rounded-2xl border border-[#E1E6E3] bg-white p-4 text-[15px]" key={visit.id}>
              <strong>{visit.kind === 'special' ? `특수 청소 · ${visit.special.join(', ')}` : visit.kind === 'tidy' ? '생활 정리 청소' : '입주·이사 청소'}</strong>
              <span className="text-[#3E4B47]">{visit.areaDistrict} · {dateLabel(visit.visitDate)} {visit.slot}</span>
              {visit.note && <span className="text-[#3E4B47]">{visit.note}</span>}
              <span className="select-all font-semibold">{visit.contactPhone}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
