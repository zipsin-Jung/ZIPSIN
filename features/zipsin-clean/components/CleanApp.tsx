'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BadgeCheck, CalendarClock, Check, ChevronLeft, Lock, Truck } from 'lucide-react';
import { QuoteBuilder } from '@/features/zipsin-clean/components/QuoteBuilder';
import { availablePartners, type DemoPartner } from '@/features/zipsin-clean/domain/demo';
import { won, type Quote, type QuoteInput } from '@/features/zipsin-clean/domain/pricing';
import { checkSchedule, formatHour, nextDays, START_HOURS, type StartHour } from '@/features/zipsin-clean/domain/schedule';

/**
 * 집신클린 체험(배포 전 눌러 보기). 가격 → 날짜·시간 → 업체 → 주소·연락처 → 확인 → 작업 진행까지.
 * 실제 예약·저장·전송은 없다. 입력한 주소·연락처는 화면 메모리에만 있고 어디에도 저장하지 않는다.
 */
type Step = 'quote' | 'date' | 'partner' | 'info' | 'confirm' | 'progress';
type Stage = 'booked' | 'precheck' | 'working' | 'done' | 'inspect' | 'saved';
const STEP_TITLES: Record<Exclude<Step, 'quote' | 'progress'>, string> = { date: '언제 할까요?', partner: '어느 업체로 할까요?', info: '어디로 가면 될까요?', confirm: '예약 내용을 확인해 주세요' };
const ARRIVALS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const QUESTIONS = [
  { id: 'hood', text: '주방 후드 안쪽을 손가락으로 쓸었을 때 미끈거리나요?' },
  { id: 'drain', text: '욕실 배수구에 머리카락이 보이나요?' },
  { id: 'rail', text: '창틀 레일을 손으로 쓸면 먼지가 묻나요?' },
];

function DemoBanner() {
  return <p className="rounded-xl bg-[#F6EBD8] px-4 py-2 text-center text-sm font-semibold text-[#7A4E12]" role="note">체험용 화면이에요 · 실제로 예약되지 않아요</p>;
}

function Primary({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button className="min-h-14 w-full rounded-xl bg-[#0B6655] text-[17px] font-bold text-white disabled:bg-[#C9D1CD] disabled:text-[#3E4B47]" disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-baseline justify-between gap-3 py-1.5"><dt className="text-[15px] text-[#3E4B47]">{label}</dt><dd className={`text-right text-[15px] ${strong ? 'font-bold text-[#16211E]' : 'text-[#16211E]'}`}>{value}</dd></div>;
}

export function CleanApp({ today = new Date() }: { today?: Date }) {
  const [step, setStep] = useState<Step>('quote');
  const [input, setInput] = useState<QuoteInput | null>(null);
  const [result, setResult] = useState<Quote | null>(null);
  const days = useMemo(() => nextDays(today), [today]);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [arrival, setArrival] = useState<number | null>(null);
  const [start, setStart] = useState<StartHour | null>(null);
  const [partner, setPartner] = useState<DemoPartner | null>(null);
  const [info, setInfo] = useState({ area: '', detail: '', phone: '' });
  const [infoError, setInfoError] = useState('');
  const [stage, setStage] = useState<Stage>('booked');
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no' | undefined>>({});
  const [redoSent, setRedoSent] = useState(false);

  // 휴대폰 뒤로가기로 이전 단계로 돌아가게 한다.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => { const next = event.state?.cleanStep as Step | undefined; setStep(next ?? 'quote'); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (next: Step) => { window.history.pushState({ ...window.history.state, cleanStep: next }, ''); setStep(next); window.scrollTo?.({ top: 0 }); };
  const back = () => window.history.back();

  const hours = result?.hours ?? 0;
  const schedule = start !== null && result ? checkSchedule(start, hours, arrival) : null;
  const day = dayIndex !== null ? days[dayIndex] : null;
  const partners = dayIndex !== null ? availablePartners(dayIndex) : [];

  if (step === 'quote' || !input || !result) {
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="!text-[24px] font-bold !leading-9 tracking-[-0.02em]">우리 집 청소, 가격부터 보세요</h1>
          <p className="mt-2 text-base leading-7 text-[#3E4B47]">누구나 아는 것만 고르면 가격이 하나로 나와요. 물때·곰팡이를 직접 판단하지 않아도 돼요.</p>
        </div>
        <QuoteBuilder onBook={(nextInput, nextResult) => { setInput(nextInput); setResult(nextResult); go('date'); }} />
      </div>
    );
  }

  const header = step !== 'progress' && (
    <div className="grid gap-3">
      <DemoBanner />
      <div className="flex items-center gap-1">
        <button aria-label="이전 단계" className="grid size-11 place-items-center rounded-xl text-[#16211E]" onClick={back} type="button"><ChevronLeft aria-hidden="true" className="size-6" /></button>
        <h1 className="!text-[22px] font-bold !leading-8 tracking-[-0.02em]">{STEP_TITLES[step]}</h1>
      </div>
      <p className="rounded-xl bg-white px-4 py-3 text-[15px] text-[#3E4B47]">확정 가격 <strong className="text-[#16211E]">{won(result.priceWon)}</strong> · {result.people}명 · 약 {result.hours}시간</p>
    </div>
  );

  if (step === 'date') {
    const pickStart = (value: StartHour) => setStart(value);
    return (
      <div className="grid gap-6">
        {header}
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-base font-bold">날짜</legend>
          <div className="grid grid-cols-4 gap-2">
            {days.map((option, index) => (
              <button aria-pressed={dayIndex === index} className={`min-h-16 rounded-xl px-1 text-center ${dayIndex === index ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white'}`} key={option.iso} onClick={() => { setDayIndex(index); setPartner(null); }} type="button">
                <span className="block text-[15px] font-semibold">{option.label}</span><span className="block text-sm text-[#5D6A65]">{option.weekday}요일</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-base font-bold" htmlFor="arrival"><Truck aria-hidden="true" className="size-5 text-[#0B6655]" />이삿짐이 들어오는 시간</label>
          <select className="min-h-14 rounded-xl border border-[#C9D1CD] bg-white px-3 text-[17px]" id="arrival" onChange={(event) => setArrival(event.target.value ? Number(event.target.value) : null)} value={arrival ?? ''}>
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
                <button aria-pressed={start === value} className={`min-h-14 rounded-xl text-[15px] font-semibold ${start === value ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white'} disabled:border-dashed disabled:bg-[#F1F3F2] disabled:text-[#5D6A65]`} disabled={!fits} key={value} onClick={() => pickStart(value)} type="button">
                  {formatHour(value)} 시작{!fits && <span className="block text-sm font-normal">이삿짐 전에 못 끝나요</span>}
                </button>
              );
            })}
          </div>
          {schedule?.ok && <p className="text-[15px] text-[#083E37]">{formatHour(start as number)}에 시작하면 {formatHour(schedule.endsAt)}쯤 끝나요.</p>}
          {arrival !== null && START_HOURS.every((value) => !checkSchedule(value, hours, arrival).ok) && <p className="rounded-xl bg-[#FCEDEA] p-3 text-[15px] text-red-800" role="alert">이 날은 이삿짐 전에 끝내기 어려워요. 하루 전에 청소하는 것을 권해요.</p>}
        </fieldset>
        <Primary disabled={dayIndex === null || start === null || !schedule?.ok} onClick={() => go('partner')}>다음</Primary>
      </div>
    );
  }

  if (step === 'partner') {
    return (
      <div className="grid gap-5">
        {header}
        <p className="text-[15px] leading-7 text-[#3E4B47]">{day?.label} {formatHour(start as number)}에 갈 수 있는 인증 업체예요. <strong>가격은 모두 같아요.</strong> 기록을 보고 골라 주세요.</p>
        <ul className="grid gap-3">
          {partners.map((item) => (
            <li key={item.id}>
              <button aria-pressed={partner?.id === item.id} className={`grid w-full gap-2 rounded-2xl p-4 text-left ${partner?.id === item.id ? 'border-2 border-[#0B6655] bg-[#E3F0EC]' : 'border border-[#E1E6E3] bg-white'}`} onClick={() => setPartner(item)} type="button">
                <span className="flex items-center justify-between gap-2"><strong className="text-[17px]">{item.name}</strong><span className="text-sm text-[#5D6A65]">{item.area}</span></span>
                <span className="flex flex-wrap gap-1.5">{item.checks.map((check) => <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-sm text-[#083E37] ring-1 ring-[#C9D1CD]" key={check}><BadgeCheck aria-hidden="true" className="size-4" />{check}</span>)}</span>
                <span className="grid grid-cols-3 gap-2 text-center">
                  <span className="rounded-lg bg-[#F7F7F3] py-1.5"><b className="block text-base">{item.onTimeRate}%</b><span className="text-sm text-[#5D6A65]">시간 지킴</span></span>
                  <span className="rounded-lg bg-[#F7F7F3] py-1.5"><b className="block text-base">{item.rehireRate}%</b><span className="text-sm text-[#5D6A65]">다음 사람도 다시</span></span>
                  <span className="rounded-lg bg-[#F7F7F3] py-1.5"><b className="block text-base">{item.completed}건</b><span className="text-sm text-[#5D6A65]">집신 완료</span></span>
                </span>
                <span className="text-sm text-[#5D6A65]">{item.team} · 시작 뒤 추가요금 0건</span>
              </button>
            </li>
          ))}
        </ul>
        <Primary disabled={!partner} onClick={() => go('info')}>이 업체로 할게요</Primary>
      </div>
    );
  }

  if (step === 'info') {
    const field = 'min-h-14 w-full rounded-xl border border-[#C9D1CD] bg-white px-4 text-[17px]';
    const next = () => {
      if (!info.area.trim() || !info.detail.trim()) { setInfoError('주소를 적어 주세요.'); return; }
      if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(info.phone.trim())) { setInfoError('연락처를 010-0000-0000처럼 적어 주세요.'); return; }
      setInfoError(''); go('confirm');
    };
    return (
      <div className="grid gap-5">
        {header}
        <div className="grid gap-2"><label className="text-base font-bold" htmlFor="area">주소 (구·동까지)</label><input className={field} id="area" onChange={(event) => setInfo({ ...info, area: event.target.value })} placeholder="예: 마포구 공덕동" value={info.area} /></div>
        <div className="grid gap-2"><label className="text-base font-bold" htmlFor="detail">상세 주소</label><input className={field} id="detail" onChange={(event) => setInfo({ ...info, detail: event.target.value })} placeholder="예: ○○아파트 101동 1203호" value={info.detail} /></div>
        <div className="grid gap-2"><label className="text-base font-bold" htmlFor="phone">연락처</label><input className={field} id="phone" inputMode="tel" onChange={(event) => setInfo({ ...info, phone: event.target.value })} placeholder="010-0000-0000" value={info.phone} /></div>
        <div className="flex gap-2 rounded-xl bg-[#E3F0EC] p-4 text-[15px] leading-6 text-[#083E37]"><Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p>상세 주소와 연락처는 <strong>고른 업체에게만</strong>, 작업 하루 전부터 보여요. 작업이 끝나면 다시 가려져요.</p></div>
        <p className="text-sm text-[#5D6A65]">체험용이라 입력한 내용은 저장되지 않아요. 실제 주소·번호를 넣지 않아도 돼요.</p>
        {infoError && <p className="text-[15px] font-bold text-red-700" role="alert">{infoError}</p>}
        <Primary onClick={next}>다음</Primary>
      </div>
    );
  }

  if (step === 'confirm') {
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
          <Row label="확정 가격" strong value={won(result.priceWon)} />
        </dl>
        <div className="grid gap-2 rounded-2xl bg-white p-4 text-[15px] leading-6 text-[#3E4B47]">
          <p className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#0B6655]" />작업을 시작한 뒤에는 가격이 바뀌지 않아요.</p>
          <p className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#0B6655]" />평수·방·욕실 수가 실제와 다를 때만, 시작 전에 다시 계산해요.</p>
          <p className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#0B6655]" />쓰레기 더미·화재 같은 집은 위약금 없이 취소할 수 있어요.</p>
        </div>
        <Primary onClick={() => { setStage('booked'); go('progress'); }}>예약하기 (체험)</Primary>
      </div>
    );
  }

  // 작업 진행 (체험): 예약됨 → 시작 전 확인 → 작업 중 → 완료 사진 → 쉬운 검수 → 집 기록 저장
  const STAGES: Array<{ id: Stage; label: string }> = [
    { id: 'booked', label: '예약' }, { id: 'precheck', label: '시작 전 확인' }, { id: 'working', label: '작업 중' },
    { id: 'done', label: '완료 사진' }, { id: 'inspect', label: '검수' }, { id: 'saved', label: '기록 저장' },
  ];
  const stageIndex = STAGES.findIndex((item) => item.id === stage);
  const problems = QUESTIONS.filter((question) => answers[question.id] === 'yes');
  const allAnswered = QUESTIONS.every((question) => answers[question.id]);
  const endsAt = (schedule as { endsAt: number } | null)?.endsAt ?? 0;
  const photo = (side: 'left' | 'right', label: string) => (
    <figure className="m-0 grid gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={label === '청소 전' ? '청소 전 방 (예시 사진)' : '청소 후 방 (예시 사진)'} className="aspect-[3/4] w-full rounded-xl object-cover" src="/images/public-home/condition-before-after.png" style={{ objectPosition: side === 'left' ? '0% 50%' : '100% 50%' }} />
      <figcaption className="text-center text-sm text-[#3E4B47]">{label}</figcaption>
    </figure>
  );

  return (
    <div className="grid gap-5">
      <DemoBanner />
      <h1 className="!text-[22px] font-bold !leading-8 tracking-[-0.02em]">{stage === 'saved' ? '집 기록에 남았어요' : stage === 'booked' ? '예약됐어요' : '작업 진행'}</h1>
      <ol aria-label="진행 단계" className="grid grid-cols-6 gap-1">
        {STAGES.map((item, index) => <li aria-current={index === stageIndex ? 'step' : undefined} className={`grid gap-1 text-center text-[13px] leading-tight ${index <= stageIndex ? 'font-semibold text-[#083E37]' : 'text-[#5D6A65]'}`} key={item.id}><span className={`h-1.5 rounded-full ${index <= stageIndex ? 'bg-[#0B6655]' : 'bg-[#E1E6E3]'}`} />{item.label}</li>)}
      </ol>

      {stage === 'booked' && (
        <div className="grid gap-4 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="flex items-center gap-2 text-[17px] font-bold"><CalendarClock aria-hidden="true" className="size-5 text-[#0B6655]" />{day?.label} {formatHour(start as number)} · {partner?.name}</p>
          <p className="text-[15px] text-[#3E4B47]">확정 가격 {won(result.priceWon)}. 작업 하루 전부터 업체에 상세 주소가 보여요.</p>
          <Primary onClick={() => setStage('precheck')}>작업 날 미리 보기</Primary>
        </div>
      )}
      {stage === 'precheck' && (
        <div className="grid gap-4 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="text-[17px] font-bold">업체가 시작 전에 집을 확인했어요</p>
          <p className="text-[15px] leading-7 text-[#3E4B47]">평수·방·욕실이 예약과 같아요. <strong>가격은 그대로 {won(result.priceWon)}</strong>이고, 작업을 시작하면 잠겨요.</p>
          <p className="flex items-center gap-2 rounded-xl bg-[#E3F0EC] p-3 text-[15px] font-semibold text-[#083E37]"><Lock aria-hidden="true" className="size-5" />시작 후 추가요금 요구는 집신에서 바로 퇴출해요</p>
          <Primary onClick={() => setStage('working')}>작업 시작 (업체가 누름)</Primary>
        </div>
      )}
      {stage === 'working' && (
        <div className="grid gap-4 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="text-[17px] font-bold">{partner?.name} {result.people}명이 청소하고 있어요</p>
          <dl className="divide-y divide-[#E1E6E3]">
            <Row label="시작" value={formatHour(start as number)} />
            <Row label="끝 예정" value={formatHour(endsAt)} />
            {arrival !== null && <Row label="이삿짐 도착" value={formatHour(arrival)} />}
            <Row label="가격" strong value={`${won(result.priceWon)} · 잠김`} />
          </dl>
          <Primary onClick={() => setStage('done')}>작업 끝 (업체가 누름)</Primary>
        </div>
      )}
      {stage === 'done' && (
        <div className="grid gap-4 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="text-[17px] font-bold">완료 사진이 올라왔어요</p>
          <div className="grid grid-cols-2 gap-2">{photo('left', '청소 전')}{photo('right', '청소 후')}</div>
          <p className="text-sm text-[#5D6A65]">예시 사진이에요. 사진 속 위치정보는 올릴 때 지워요.</p>
          <Primary onClick={() => setStage('inspect')}>직접 확인하기</Primary>
        </div>
      )}
      {stage === 'inspect' && (
        <div className="grid gap-4 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="text-[17px] font-bold">어렵지 않아요. 손으로 확인해 보세요</p>
          {QUESTIONS.map((question) => (
            <fieldset className="grid gap-2" key={question.id}>
              <legend className="mb-1 text-[15px] font-semibold">{question.text}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['no', 'yes'] as const).map((value) => (
                  <label className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl text-[15px] font-semibold ${answers[question.id] === value ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white'}`} key={value}>
                    <input checked={answers[question.id] === value} className="sr-only" name={question.id} onChange={() => { setAnswers({ ...answers, [question.id]: value }); setRedoSent(false); }} type="radio" value={value} />
                    {value === 'no' ? '아니요' : '예'}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {problems.length > 0 ? (
            redoSent
              ? <p className="rounded-xl bg-[#E3F0EC] p-3 text-[15px] text-[#083E37]" role="status">업체에 다시 와 달라고 보냈어요(체험). 추가요금 없이 다시 해요.</p>
              : <Primary onClick={() => setRedoSent(true)}>{problems.length}곳 다시 해 달라고 하기</Primary>
          ) : <Primary disabled={!allAnswered} onClick={() => setStage('saved')}>검수 완료</Primary>}
        </div>
      )}
      {stage === 'saved' && (
        <div className="grid gap-4">
          <section aria-label="집 기록" className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4">
            <p className="text-sm text-[#3E4B47]">이 집의 기록</p>
            <div><h2 className="!text-base font-bold !leading-6">{input.service === 'tidy' ? '생활 정리 청소' : `입주 청소 · ${input.areaPyeong}평`}</h2><p className="text-sm text-[#5D6A65]">{info.area} · {day?.label} · {partner?.name}</p></div>
            <div className="grid grid-cols-2 gap-2">{photo('left', '청소 전')}{photo('right', '청소 후')}</div>
            <dl className="grid gap-1.5 text-[15px]">
              <div className="flex justify-between"><dt>확정 가격 <span className="text-[#5D6A65]">예약할 때</span></dt><dd className="font-semibold">{won(result.priceWon)}</dd></div>
              <div className="flex justify-between text-[#0B6655]"><dt>+ 추가요금 <span>작업 시작 뒤</span></dt><dd className="font-bold">0원</dd></div>
              <div className="flex justify-between border-t border-[#E1E6E3] pt-2"><dt className="font-bold">= 최종 <span className="font-normal text-[#0B6655]">손님 확인됨</span></dt><dd className="font-bold">{won(result.priceWon)}</dd></div>
            </dl>
          </section>
          <p className="text-[15px] text-[#3E4B47]">다음에 이 집에 사는 사람은 작업 종류·날짜·업체만 보고, 이름·연락처·금액은 보지 못해요.</p>
          <Primary onClick={() => { setStep('quote'); setInput(null); setResult(null); setDayIndex(null); setStart(null); setArrival(null); setPartner(null); setInfo({ area: '', detail: '', phone: '' }); setAnswers({}); setRedoSent(false); }}>처음부터 다시 해 보기</Primary>
        </div>
      )}
    </div>
  );
}
