'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronLeft, Home, Lock, Sparkles, Truck } from 'lucide-react';
import { QuoteBuilder } from '@/features/zipsin-clean/components/QuoteBuilder';
import { Notice, Primary, Row, choiceClass, fieldClass } from '@/features/zipsin-clean/components/ui';
import { ARRIVALS, MEMO_MAX, PHONE_PATTERN, REQUEST_CHIPS, SPECIAL_KINDS } from '@/features/zipsin-clean/domain/constants';
import { won, type Quote, type QuoteInput } from '@/features/zipsin-clean/domain/pricing';
import { checkSchedule, formatHour, nextDays, seoulToday, START_HOURS, type StartHour } from '@/features/zipsin-clean/domain/schedule';
import type { PartnerOption } from '@/features/zipsin-clean/domain/types';
import type { BookingPayload, VisitPayload } from '@/features/zipsin-clean/schemas/booking';

/**
 * 손님 예약: 가격 → 날짜·이삿짐 시간 → 업체 → 주소·연락처·업체에 하고 싶은 말 → 확인 → 예약 요청.
 * 업체가 수락하면 가격이 확정된다. 가격은 서버가 다시 계산해서 저장한다.
 * 가격이 바로 안 나오는 집은 방문 견적·특수 청소 요청으로 보낸다.
 */
type Step = 'quote' | 'date' | 'partner' | 'info' | 'confirm' | 'visit' | 'visitSent';
type VisitKind = 'move_in' | 'tidy' | 'special';
const STEP_TITLES: Partial<Record<Step, string>> = { date: '언제 할까요?', partner: '어느 업체로 할까요?', info: '어디로 가면 될까요?', confirm: '예약 내용을 확인해 주세요', visit: '방문 견적 요청' };
const VISIT_KINDS: Array<{ value: VisitKind; label: string; hint: string }> = [
  { value: 'move_in', label: '입주·이사 청소', hint: '빈집 전체' },
  { value: 'tidy', label: '생활 정리 청소', hint: '사는 집' },
  { value: 'special', label: '특수 청소', hint: '집을 봐야 해요' },
];
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type BookingFlowProps = {
  partners: PartnerOption[];
  signedIn: boolean;
  phoneVerified: boolean;
  loginHref: string;
  verifyHref: string;
  submitBooking: (payload: BookingPayload) => Promise<Result<{ bookingId: string }>>;
  submitVisit: (payload: VisitPayload) => Promise<Result<undefined>>;
  onBooked: () => void;
  today?: Date;
  newKey?: () => string;
};

/** 같은 예약이 두 번 들어가지 않게 붙이는 번호. 오래된 브라우저(randomUUID 없음)도 지원. */
export function makeIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function BookingFlow({ partners, signedIn, phoneVerified, loginHref, verifyHref, submitBooking, submitVisit, onBooked, today, newKey = makeIdempotencyKey }: BookingFlowProps) {
  const [step, setStep] = useState<Step>('quote');
  const [input, setInput] = useState<QuoteInput | null>(null);
  const [result, setResult] = useState<Quote | null>(null);
  const days = useMemo(() => nextDays(today ?? seoulToday()), [today]);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [arrival, setArrival] = useState<number | null>(null);
  const [start, setStart] = useState<StartHour | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [info, setInfo] = useState({ area: '', detail: '', phone: '' });
  const [requests, setRequests] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(newKey);
  const [visit, setVisit] = useState<{ kind: VisitKind; special: string[]; note: string; area: string; dayIndex: number | null; slot: '오전' | '오후' | null; phone: string }>({ kind: 'move_in', special: [], note: '', area: '', dayIndex: null, slot: null, phone: '' });

  useEffect(() => {
    const onPop = (event: PopStateEvent) => { setStep((event.state?.cleanStep as Step | undefined) ?? 'quote'); setError(''); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (next: Step) => { window.history.pushState({ ...window.history.state, cleanStep: next }, ''); setStep(next); setError(''); window.scrollTo?.({ top: 0 }); };
  const back = () => window.history.back();

  const hours = result?.hours ?? 0;
  const schedule = start !== null && result ? checkSchedule(start, hours, arrival) : null;
  const day = dayIndex !== null ? days[dayIndex] : null;
  const partner = partners.find((item) => item.id === partnerId) ?? null;

  const titleBar = (title: string) => (
    <div className="flex items-center gap-1">
      <button aria-label="이전 단계" className="grid size-11 place-items-center rounded-xl" onClick={back} type="button"><ChevronLeft aria-hidden="true" className="size-6" /></button>
      <h1 className="!text-[22px] font-bold !leading-8 tracking-[-0.02em]">{title}</h1>
    </div>
  );
  const needAccount = !signedIn
    ? <Notice tone="gold">예약하려면 집신 계정으로 로그인해야 해요. <a className="font-bold underline" href={loginHref}>로그인하기</a></Notice>
    : !phoneVerified ? <Notice tone="gold">예약하려면 휴대전화 인증이 필요해요. <a className="font-bold underline" href={verifyHref}>인증하기</a></Notice> : null;

  // ── 방문 견적·특수 청소 ──
  if (step === 'visit' || step === 'visitSent') {
    const visitDay = visit.dayIndex !== null ? days[visit.dayIndex] : null;
    if (step === 'visitSent') {
      return (
        <div className="grid gap-5">
          <h1 className="!text-[22px] font-bold !leading-8 tracking-[-0.02em]">방문 견적을 요청했어요</h1>
          <p className="rounded-xl bg-white px-4 py-3 text-[15px] text-[#3E4B47]" role="status">{VISIT_KINDS.find((item) => item.value === visit.kind)?.label}{visit.special.length > 0 && ` · ${visit.special.join(', ')}`} · {visit.area} · {visitDay?.label} {visit.slot}</p>
          <ol className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4 text-[15px] leading-6 text-[#3E4B47]">
            {['집신이 요청을 보고 연락드려요.', '집신 인증 업체가 집을 보러 가요.', '본 내용으로 가격 하나를 보내 드려요. 마음에 들면 예약하고, 아니면 그대로 끝이에요.', '예약한 가격은 작업 날 바뀌지 않아요.'].map((text, index) => (
              <li className="flex gap-3" key={text}><b className="grid size-7 shrink-0 place-items-center rounded-full bg-[#E3F0EC] text-[#083E37]">{index + 1}</b>{text}</li>
            ))}
          </ol>
          <Primary onClick={() => { setVisit({ kind: 'move_in', special: [], note: '', area: '', dayIndex: null, slot: null, phone: '' }); setStep('quote'); }}>처음으로</Primary>
        </div>
      );
    }
    const send = async () => {
      if (visit.kind === 'special' && visit.special.length === 0) return setError('어떤 특수 청소인지 골라 주세요.');
      if (visit.special.includes('기타') && !visit.note.trim()) return setError('기타 상황을 적어 주세요.');
      if (!visit.area.trim()) return setError('주소를 구·동까지 적어 주세요.');
      if (visit.dayIndex === null || !visit.slot) return setError('방문 날짜와 시간대를 골라 주세요.');
      if (!PHONE_PATTERN.test(visit.phone.trim())) return setError('연락처를 010-0000-0000처럼 적어 주세요.');
      setBusy(true);
      const sent = await submitVisit({ kind: visit.kind, special: visit.special as VisitPayload['special'], note: visit.note.trim(), areaDistrict: visit.area.trim(), visitDate: days[visit.dayIndex].iso, slot: visit.slot, contactPhone: visit.phone.trim() });
      setBusy(false);
      if (!sent.ok) return setError(sent.error);
      setError(''); go('visitSent');
    };
    return (
      <div className="grid gap-6">
        <div className="grid gap-2">
          {titleBar('방문 견적 요청')}
          <p className="text-[15px] leading-6 text-[#3E4B47]">인증 업체가 직접 보고 가격을 정해요. 고르기 어려운 집이나 특수 청소일 때 써 주세요.</p>
        </div>
        {needAccount}
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-base font-bold">어떤 청소인가요?</legend>
          <div className="grid grid-cols-3 gap-2">
            {VISIT_KINDS.map((item) => (
              <label className={`${choiceClass(visit.kind === item.value)} min-h-16 flex-col`} key={item.value}>
                <input checked={visit.kind === item.value} className="sr-only" name="visit-kind" onChange={() => setVisit({ ...visit, kind: item.value, special: item.value === 'special' ? visit.special : [] })} type="radio" value={item.value} />
                {item.label}<span className="text-sm font-normal">{item.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {visit.kind === 'special' && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-base font-bold">어떤 특수 청소인가요? (여러 개 골라도 돼요)</legend>
            <div className="grid grid-cols-2 gap-2">
              {SPECIAL_KINDS.map((kind) => {
                const on = visit.special.includes(kind);
                return <label className={choiceClass(on)} key={kind}><input checked={on} className="sr-only" onChange={() => setVisit({ ...visit, special: on ? visit.special.filter((item) => item !== kind) : [...visit.special, kind] })} type="checkbox" value={kind} />{kind}</label>;
              })}
            </div>
            {visit.special.includes('기타') && <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="visit-note">어떤 상황인지 적어 주세요</label><input className={fieldClass} id="visit-note" maxLength={MEMO_MAX} onChange={(event) => setVisit({ ...visit, note: event.target.value })} value={visit.note} /></div>}
            <p className="text-sm text-[#5D6A65]">곰팡이·물때처럼 더러운 정도는 특수 청소가 아니에요. 일반 청소 가격에 들어 있어요.</p>
          </fieldset>
        )}
        <div className="grid gap-2"><label className="text-base font-bold" htmlFor="visit-area">주소 (구·동까지)</label><input className={fieldClass} id="visit-area" maxLength={40} onChange={(event) => setVisit({ ...visit, area: event.target.value })} placeholder="예: 마포구 공덕동" value={visit.area} /></div>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-base font-bold">언제 보러 오면 될까요?</legend>
          <div className="grid grid-cols-4 gap-2">
            {days.slice(0, 8).map((option, index) => (
              <button aria-pressed={visit.dayIndex === index} className={`min-h-16 rounded-xl px-1 text-center ${visit.dayIndex === index ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white'}`} key={option.iso} onClick={() => setVisit({ ...visit, dayIndex: index })} type="button">
                <span className="block text-[15px] font-semibold">{option.label}</span><span className="block text-sm text-[#5D6A65]">{option.weekday}요일</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['오전', '오후'] as const).map((slot) => <button aria-pressed={visit.slot === slot} className={choiceClass(visit.slot === slot)} key={slot} onClick={() => setVisit({ ...visit, slot })} type="button">{slot}</button>)}
          </div>
        </fieldset>
        <div className="grid gap-2"><label className="text-base font-bold" htmlFor="visit-phone">연락처</label><input className={fieldClass} id="visit-phone" inputMode="tel" onChange={(event) => setVisit({ ...visit, phone: event.target.value })} placeholder="010-0000-0000" value={visit.phone} /></div>
        <div className="flex gap-2 rounded-xl bg-[#E3F0EC] p-4 text-[15px] leading-6 text-[#083E37]"><Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p>연락처는 집신만 봐요. 상세 주소는 방문 날짜가 정해지면 알려 주세요.</p></div>
        {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
        <Primary disabled={busy || !signedIn} onClick={send}>{busy ? '보내는 중…' : '방문 견적 요청하기'}</Primary>
      </div>
    );
  }

  // ── 가격 보기 ──
  if (step === 'quote' || !input || !result) {
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="!text-[24px] font-bold !leading-9 tracking-[-0.02em]">우리 집 청소, 가격부터 보세요</h1>
          <p className="mt-2 text-base leading-7 text-[#3E4B47]">누구나 아는 것만 고르면 가격이 하나로 나와요. 물때·곰팡이를 직접 판단하지 않아도 돼요.</p>
        </div>
        <QuoteBuilder onBook={(nextInput, nextResult) => { setInput(nextInput); setResult(nextResult); go('date'); }} />
        <section aria-label="집을 보고 가격 정하기" className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <h2 className="!text-base font-bold !leading-6">가격이 바로 안 나오는 집이라면</h2>
          <button className="flex min-h-14 items-center gap-3 rounded-xl border border-[#C9D1CD] px-4 text-left" onClick={() => { setVisit({ ...visit, kind: 'special' }); go('visit'); }} type="button">
            <Sparkles aria-hidden="true" className="size-5 shrink-0 text-[#0B6655]" /><span><b className="block text-[15px]">특수 청소</b><span className="text-sm text-[#5D6A65]">쓰레기 더미·화재·누수·유품 정리</span></span>
          </button>
          <button className="flex min-h-14 items-center gap-3 rounded-xl border border-[#C9D1CD] px-4 text-left" onClick={() => { setVisit({ ...visit, kind: 'move_in' }); go('visit'); }} type="button">
            <Home aria-hidden="true" className="size-5 shrink-0 text-[#0B6655]" /><span><b className="block text-[15px]">방문 견적 요청</b><span className="text-sm text-[#5D6A65]">업체가 직접 보고 가격을 정해요</span></span>
          </button>
        </section>
      </div>
    );
  }

  const header = (
    <div className="grid gap-3">
      {titleBar(STEP_TITLES[step] ?? '')}
      <p className="rounded-xl bg-white px-4 py-3 text-[15px] text-[#3E4B47]">예상 가격 <strong className="text-[#16211E]">{won(result.priceWon)}</strong> · {result.people}명 · 약 {result.hours}시간</p>
    </div>
  );

  if (step === 'date') {
    const noneFits = arrival !== null && START_HOURS.every((value) => !checkSchedule(value, hours, arrival).ok);
    return (
      <div className="grid gap-6">
        {header}
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-base font-bold">날짜</legend>
          <div className="grid grid-cols-4 gap-2">
            {days.map((option, index) => (
              <button aria-pressed={dayIndex === index} className={`min-h-16 rounded-xl px-1 text-center ${dayIndex === index ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white'}`} key={option.iso} onClick={() => setDayIndex(index)} type="button">
                <span className="block text-[15px] font-semibold">{option.label}</span><span className="block text-sm text-[#5D6A65]">{option.weekday}요일</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-base font-bold" htmlFor="arrival"><Truck aria-hidden="true" className="size-5 text-[#0B6655]" />이삿짐이 들어오는 시간</label>
          <select className="min-h-14 rounded-xl border border-[#C9D1CD] bg-white px-3 text-[17px]" id="arrival" onChange={(event) => { setArrival(event.target.value ? Number(event.target.value) : null); setStart(null); }} value={arrival ?? ''}>
            <option value="">이삿짐 없음 · 시간 상관없음</option>
            {ARRIVALS.map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
          </select>
          <p className="text-sm text-[#5D6A65]">이 시간 30분 전에 끝나는 시작 시간만 고를 수 있어요. 시간에 쫓겨 추가요금을 내는 일이 없게 해요.</p>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-base font-bold">시작 시간</legend>
          <div className="grid grid-cols-2 gap-2">
            {START_HOURS.map((value) => {
              const fits = checkSchedule(value, hours, arrival).ok;
              return (
                <button aria-pressed={start === value} className={`min-h-14 rounded-xl text-[15px] font-semibold ${start === value ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white'} disabled:border-dashed disabled:bg-[#F1F3F2] disabled:text-[#5D6A65]`} disabled={!fits} key={value} onClick={() => setStart(value)} type="button">
                  {formatHour(value)} 시작{!fits && <span className="block text-sm font-normal">이삿짐 전에 못 끝나요</span>}
                </button>
              );
            })}
          </div>
          {schedule?.ok && <p className="text-[15px] text-[#083E37]">{formatHour(start as number)}에 시작하면 {formatHour(schedule.endsAt)}쯤 끝나요.</p>}
          {noneFits && <p className="rounded-xl bg-[#FCEDEA] p-3 text-[15px] text-red-800" role="alert">이 날은 이삿짐 전에 끝내기 어려워요. 하루 전에 청소하는 것을 권해요.</p>}
        </fieldset>
        <Primary disabled={dayIndex === null || start === null || !schedule?.ok} onClick={() => go('partner')}>다음</Primary>
      </div>
    );
  }

  if (step === 'partner') {
    return (
      <div className="grid gap-5">
        {header}
        <p className="text-[15px] leading-7 text-[#3E4B47]">집신이 대표를 직접 만나 확인한 업체예요. <strong>가격은 모두 같아요.</strong> 고른 업체가 수락하면 예약이 확정돼요.</p>
        {partners.length === 0 && (signedIn ? <Notice tone="gold">지금 예약을 받는 업체가 없어요. 방문 견적으로 요청해 주세요.</Notice> : needAccount)}
        <ul className="grid gap-3">
          {partners.map((item) => (
            <li key={item.id}>
              <button aria-pressed={partnerId === item.id} className={`grid w-full gap-2 rounded-2xl p-4 text-left ${partnerId === item.id ? 'border-2 border-[#0B6655] bg-[#E3F0EC]' : 'border border-[#E1E6E3] bg-white'}`} onClick={() => setPartnerId(item.id)} type="button">
                <span className="flex items-center justify-between gap-2"><strong className="text-[17px]">{item.name}</strong><span className="text-sm text-[#5D6A65]">{item.area}</span></span>
                {item.checks.length > 0 && <span className="flex flex-wrap gap-1.5">{item.checks.map((check) => <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-sm text-[#083E37] ring-1 ring-[#C9D1CD]" key={check}><BadgeCheck aria-hidden="true" className="size-4" />{check}</span>)}</span>}
                <span className="text-sm text-[#5D6A65]">{[item.kind === 'individual' ? '개인' : '업체', item.team, `집신 완료 ${item.completedCount}건`].filter(Boolean).join(' · ')}</span>
                {item.samplePhotos.length > 0 && (
                  <span className="grid grid-cols-4 gap-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.samplePhotos.map((photo) => photo.url && <img alt={photo.kind === 'before' ? '이 업체의 청소 전 사진' : '이 업체의 청소 후 사진'} className="aspect-square w-full rounded-lg object-cover" key={photo.id} src={photo.url} />)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <Primary disabled={!partner} onClick={() => go('info')}>이 업체로 할게요</Primary>
      </div>
    );
  }

  if (step === 'info') {
    const next = () => {
      if (!info.area.trim() || !info.detail.trim()) return setError('주소를 적어 주세요.');
      if (!PHONE_PATTERN.test(info.phone.trim())) return setError('연락처를 010-0000-0000처럼 적어 주세요.');
      go('confirm');
    };
    return (
      <div className="grid gap-5">
        {header}
        <div className="grid gap-2"><label className="text-base font-bold" htmlFor="area">주소 (구·동까지)</label><input className={fieldClass} id="area" maxLength={40} onChange={(event) => setInfo({ ...info, area: event.target.value })} placeholder="예: 마포구 공덕동" value={info.area} /></div>
        <div className="grid gap-2"><label className="text-base font-bold" htmlFor="detail">상세 주소</label><input className={fieldClass} id="detail" maxLength={100} onChange={(event) => setInfo({ ...info, detail: event.target.value })} placeholder="예: ○○아파트 101동 1203호" value={info.detail} /></div>
        <div className="grid gap-2"><label className="text-base font-bold" htmlFor="phone">연락처</label><input className={fieldClass} id="phone" inputMode="tel" onChange={(event) => setInfo({ ...info, phone: event.target.value })} placeholder="010-0000-0000" value={info.phone} /></div>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-base font-bold">업체에 하고 싶은 말 (선택)</legend>
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_CHIPS.map((chip) => {
              const on = requests.includes(chip);
              return <label className={choiceClass(on)} key={chip}><input checked={on} className="sr-only" onChange={() => setRequests(on ? requests.filter((item) => item !== chip) : [...requests, chip])} type="checkbox" value={chip} />{chip}</label>;
            })}
          </div>
          <label className="mt-1 text-[15px] font-bold" htmlFor="memo">메모</label>
          <textarea className="min-h-24 w-full rounded-xl border border-[#C9D1CD] bg-white p-3 text-base" id="memo" maxLength={MEMO_MAX} onChange={(event) => setMemo(event.target.value)} placeholder="예: 락스처럼 냄새가 독한 세제는 빼고 해 주세요." value={memo} />
          <p className="text-sm leading-6 text-[#5D6A65]">업체는 이 요청을 보고 수락해요. 요청으로 가격이 바뀌지 않아요. 현관 비밀번호·주소는 여기에 적지 마세요. ({memo.length}/{MEMO_MAX})</p>
        </fieldset>
        <div className="flex gap-2 rounded-xl bg-[#E3F0EC] p-4 text-[15px] leading-6 text-[#083E37]"><Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p>상세 주소와 연락처는 <strong>고른 업체가 수락한 뒤에만</strong> 그 업체에게 보여요. 청소가 끝나면 다시 가려져요.</p></div>
        {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
        <Primary onClick={next}>다음</Primary>
      </div>
    );
  }

  // confirm
  const book = async () => {
    if (!signedIn || !phoneVerified || dayIndex === null || start === null || !partner) return;
    setBusy(true);
    const saved = await submitBooking({
      input, partnerId: partner.id, serviceDate: days[dayIndex].iso, startHour: start, arrivalHour: arrival,
      areaDistrict: info.area.trim(), detailAddress: info.detail.trim(), contactPhone: info.phone.trim(),
      requests: requests as BookingPayload['requests'], memo: memo.trim(), idempotencyKey: key,
    });
    setBusy(false);
    if (!saved.ok) { setError(saved.error); setKey(newKey()); return; }
    onBooked();
  };
  return (
    <div className="grid gap-5">
      {header}
      <dl className="divide-y divide-[#E1E6E3] rounded-2xl border border-[#E1E6E3] bg-white px-4 py-2">
        <Row label="청소" value={input.service === 'tidy' ? `생활 정리 청소 · ${result.hours}시간` : `입주·이사 청소 · ${input.areaPyeong}평`} />
        <Row label="날짜" value={`${day?.label} (${day?.weekday})`} />
        <Row label="시간" value={`${formatHour(start as number)} ~ ${formatHour((schedule as { endsAt: number }).endsAt)}`} />
        {arrival !== null && <Row label="이삿짐 도착" value={formatHour(arrival)} />}
        <Row label="업체" value={partner?.name ?? ''} />
        <Row label="주소" value={info.area} />
        {(requests.length > 0 || memo.trim()) && <Row label="업체에 하는 말" value={[...requests, memo.trim()].filter(Boolean).join(' · ')} />}
        <Row label="예상 가격 (수락하면 확정)" strong value={won(result.priceWon)} />
      </dl>
      <div className="grid gap-2 rounded-2xl bg-white p-4 text-[15px] leading-6 text-[#3E4B47]">
        <p>· 작업 날 현장에서 다시 계산하지 않아요. 작업을 시작한 뒤에는 가격이 바뀌지 않아요.</p>
        <p>· 쓰레기 더미·화재처럼 청소를 시작할 수 없는 집이면, 서로 위약금 없이 취소해요.</p>
        <p>· 돈은 검수를 마친 뒤 업체에 직접 내요. 집신 앱으로 결제하지 않아요.</p>
      </div>
      {needAccount}
      {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
      <Primary disabled={busy || !signedIn || !phoneVerified} onClick={book}>{busy ? '보내는 중…' : '예약 요청하기'}</Primary>
    </div>
  );
}
