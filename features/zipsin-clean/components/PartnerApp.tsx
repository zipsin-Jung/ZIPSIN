'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { BadgeCheck, ChevronLeft, EyeOff, Lock, MapPin, Truck } from 'lucide-react';
import { DEMO_JOBS, DEMO_PARTNERS, type DemoJob } from '@/features/zipsin-clean/domain/demo';
import { quote, won } from '@/features/zipsin-clean/domain/pricing';
import { formatHour, nextDays } from '@/features/zipsin-clean/domain/schedule';

/**
 * 집신클린 업체 화면 체험(배포 전 눌러 보기).
 * 초대 → 작업 요청(구·동만) → 수락(상세 주소·연락처 공개) → 시작 전 확인 → 작업 → 손님 검수 → 정산(다시 가림).
 * 실제 로그인·저장·전송·정산은 없다. 주소·연락처는 모두 예시 값이다.
 */
type Screen = 'invite' | 'list' | 'job';
type Stage = 'offer' | 'accepted' | 'working' | 'waiting' | 'paid';
const BLOCK_REASONS = ['쓰레기·짐 더미', '화재·그을음', '누수·물바다', '해충이 심함', '이삿짐이 아직 안 빠짐', '물·전기가 안 들어옴', '안전하지 않음', '기타'] as const;
type BlockReason = (typeof BLOCK_REASONS)[number];

const PARTNER = DEMO_PARTNERS[0];

function DemoBanner() {
  return <p className="rounded-xl bg-[#F6EBD8] px-4 py-2 text-center text-sm font-semibold text-[#7A4E12]" role="note">업체 화면 체험용이에요 · 실제 요청이 아니에요</p>;
}

function Primary({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button className="min-h-14 w-full rounded-xl bg-[#0B6655] text-[17px] font-bold text-white disabled:bg-[#C9D1CD] disabled:text-[#3E4B47]" disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function Secondary({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button className="min-h-12 w-full rounded-xl border border-[#C9D1CD] bg-white text-[15px] font-semibold text-[#16211E]" onClick={onClick} type="button">{children}</button>;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-baseline justify-between gap-3 py-1.5"><dt className="text-[15px] text-[#3E4B47]">{label}</dt><dd className={`text-right text-[15px] ${strong ? 'font-bold' : ''} text-[#16211E]`}>{value}</dd></div>;
}

function serviceLabel(job: DemoJob, hours: number) {
  return job.input.service === 'tidy' ? `생활 정리 청소 · ${hours}시간` : `입주 청소 · ${job.input.areaPyeong}평 · 방${job.input.rooms} 욕실${job.input.baths}`;
}

export function PartnerApp({ today = new Date() }: { today?: Date }) {
  const days = useMemo(() => nextDays(today), [today]);
  const [screen, setScreen] = useState<Screen>('invite');
  const [jobId, setJobId] = useState<string | null>(null);
  const [stages, setStages] = useState<Record<string, Stage>>({});
  const [declined, setDeclined] = useState<string[]>([]);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);
  const [blockNote, setBlockNote] = useState('');
  const [blockSent, setBlockSent] = useState(false);
  const resetBlock = () => { setBlockOpen(false); setBlockReason(null); setBlockNote(''); setBlockSent(false); };

  const quotes = useMemo(() => Object.fromEntries(DEMO_JOBS.map((job) => [job.id, quote(job.input)])), []);
  const dayLabel = (job: DemoJob) => { const day = days[job.dayOffset - 1]; return `${day.label} (${day.weekday})`; };
  const setStage = (id: string, stage: Stage) => setStages((prev) => ({ ...prev, [id]: stage }));

  if (screen === 'invite') {
    return (
      <div className="grid gap-5">
        <DemoBanner />
        <div>
          <h1 className="!text-[24px] font-bold !leading-9 tracking-[-0.02em]">집신이 초대한 업체만 들어와요</h1>
          <p className="mt-2 text-base leading-7 text-[#3E4B47]">집신이 대표님을 직접 만나고 현장에 함께 가 본 뒤 초대 링크를 보내요. 아무나 가입할 수 없어요.</p>
        </div>
        <section aria-label="받은 초대" className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="text-sm text-[#5D6A65]">받은 초대</p>
          <p className="text-[19px] font-bold">{PARTNER.name}</p>
          <p className="flex flex-wrap gap-1.5">{PARTNER.checks.map((check) => <span className="inline-flex items-center gap-1 rounded-full bg-[#E3F0EC] px-2.5 py-0.5 text-sm text-[#083E37]" key={check}><BadgeCheck aria-hidden="true" className="size-4" />{check} 완료</span>)}</p>
          <ul className="grid gap-1.5 text-[15px] leading-6 text-[#3E4B47]">
            <li>· 가격은 집신이 정하고, 같은 일은 어느 업체든 같은 가격이에요.</li>
            <li>· 작업을 시작한 뒤 추가요금을 받으면 바로 퇴출이에요.</li>
            <li>· 손님 주소·연락처는 수락한 작업만, 작업이 끝날 때까지만 보여요.</li>
          </ul>
        </section>
        <p className="text-sm text-[#5D6A65]">실제로는 집신·집신체크와 같은 아이디로 로그인해요. 체험에서는 로그인을 건너뛰어요.</p>
        <Primary onClick={() => setScreen('list')}>초대 수락하고 시작하기 (체험)</Primary>
      </div>
    );
  }

  const header = (title: string, onBack: () => void) => (
    <div className="grid gap-3">
      <DemoBanner />
      <div className="flex items-center gap-1">
        <button aria-label="뒤로" className="grid size-11 place-items-center rounded-xl" onClick={onBack} type="button"><ChevronLeft aria-hidden="true" className="size-6" /></button>
        <h1 className="!text-[22px] font-bold !leading-8 tracking-[-0.02em]">{title}</h1>
      </div>
    </div>
  );

  if (screen === 'list' || !jobId) {
    const open = DEMO_JOBS.filter((job) => !declined.includes(job.id));
    return (
      <div className="grid gap-5">
        {header('작업 요청', () => setScreen('invite'))}
        <p className="flex gap-2 rounded-xl bg-[#E3F0EC] p-3 text-[15px] leading-6 text-[#083E37]"><Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />수락하기 전에는 구·동까지만 보여요. 상세 주소와 연락처는 수락한 뒤에 보여요.</p>
        {open.length === 0 && <p className="text-[15px] text-[#3E4B47]">지금은 들어온 요청이 없어요.</p>}
        <ul className="grid gap-3">
          {open.map((job) => {
            const result = quotes[job.id];
            const stage = stages[job.id];
            return (
              <li key={job.id}>
                <button className="grid w-full gap-1.5 rounded-2xl border border-[#E1E6E3] bg-white p-4 text-left" onClick={() => { setJobId(job.id); resetBlock(); setScreen('job'); }} type="button">
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-[17px]">{job.area}</strong>
                    <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${stage === 'paid' ? 'bg-[#F1F3F2] text-[#5D6A65]' : stage ? 'bg-[#E3F0EC] text-[#083E37]' : 'bg-[#F6EBD8] text-[#7A4E12]'}`}>{stage === 'paid' ? '정산 완료' : stage ? '수락함' : '새 요청'}</span>
                  </span>
                  <span className="text-[15px] text-[#3E4B47]">{serviceLabel(job, result.hours)}</span>
                  <span className="text-[15px] text-[#3E4B47]">{dayLabel(job)} {formatHour(job.start)} · {result.people}명 · 약 {result.hours}시간</span>
                  <span className="text-[17px] font-bold">{won(result.priceWon)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const job = DEMO_JOBS.find((item) => item.id === jobId) as DemoJob;
  const result = quotes[job.id];
  const stage: Stage = stages[job.id] ?? 'offer';
  const showPrivate = stage === 'accepted' || stage === 'working' || stage === 'waiting';
  const endsAt = job.start + result.hours;

  return (
    <div className="grid gap-5">
      {header(stage === 'offer' ? '작업 요청' : stage === 'paid' ? '정산 완료' : '수락한 작업', () => setScreen('list'))}

      <dl className="divide-y divide-[#E1E6E3] rounded-2xl border border-[#E1E6E3] bg-white px-4 py-2">
        <Row label="청소" value={serviceLabel(job, result.hours)} />
        <Row label="날짜" value={dayLabel(job)} />
        <Row label="시간" value={`${formatHour(job.start)} ~ ${formatHour(endsAt)} · ${result.people}명`} />
        {job.arrival !== null && <Row label="이삿짐 도착" value={formatHour(job.arrival)} />}
        <Row label="등급" value={`${result.grade}등급 (집신 계산)`} />
        <Row label={stage === 'offer' ? '가격 (수락하면 확정)' : '확정 가격'} strong value={won(result.priceWon)} />
      </dl>

      <section aria-label="주소와 연락처" className="grid gap-2 rounded-2xl border border-[#E1E6E3] bg-white p-4">
        <p className="flex items-center gap-2 text-[15px] font-bold"><MapPin aria-hidden="true" className="size-5 text-[#0B6655]" />{job.area}</p>
        {showPrivate ? (
          <dl className="divide-y divide-[#E1E6E3]">
            <Row label="상세 주소" value={`${job.detailAddress} (예시)`} />
            <Row label="손님 연락처" value={`${job.contact} (예시)`} />
          </dl>
        ) : (
          <p className="flex items-center gap-2 text-[15px] text-[#5D6A65]"><EyeOff aria-hidden="true" className="size-5" />{stage === 'paid' ? '작업이 끝나서 상세 주소와 연락처를 다시 가렸어요.' : '상세 주소와 연락처는 수락하면 보여요.'}</p>
        )}
      </section>

      {stage === 'offer' && (
        <>
          <div className="grid gap-2">
            <h2 className="!text-base font-bold !leading-6">포함된 작업</h2>
            <ul className="grid gap-1 text-[15px] text-[#3E4B47]">{result.includes.map((item) => <li className="flex gap-2" key={item}><span aria-hidden="true" className="text-[#0B6655]">✓</span>{item}</li>)}</ul>
          </div>
          <p className="rounded-xl bg-[#F7F7F3] p-3 text-[15px] leading-6 text-[#3E4B47]">수락하면 이 가격으로 손님과 확정돼요. 작업을 시작한 뒤에는 바뀌지 않아요.</p>
          <Primary onClick={() => setStage(job.id, 'accepted')}>이 가격으로 수락하기</Primary>
          <Secondary onClick={() => { setDeclined([...declined, job.id]); setScreen('list'); }}>이번엔 못 해요</Secondary>
        </>
      )}

      {stage === 'accepted' && (
        <div className="grid gap-4 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="text-[17px] font-bold">작업 날, 시작 전에 확인해 주세요</p>
          {job.arrival !== null && <p className="flex items-center gap-2 text-[15px] text-[#3E4B47]"><Truck aria-hidden="true" className="size-5 text-[#0B6655]" />이삿짐이 {formatHour(job.arrival)}에 들어와요. 그 전에 끝나는 일정이에요.</p>}
          <p className="text-[15px] leading-6 text-[#3E4B47]">가격은 수락할 때 확정됐어요. 작업 날 현장에서 다시 계산하거나 더 받지 않아요.</p>
          {blockSent ? (
            <p className="rounded-xl bg-[#E3F0EC] p-3 text-[15px] leading-6 text-[#083E37]" role="status">집신에 보냈어요(체험). 집신이 사진을 확인하고 서로 위약금 없이 취소해요. 추가요금을 받고 진행하는 방법은 없어요. 손님에게는 특수 청소 방문 견적을 안내해요.</p>
          ) : blockOpen ? (
            <div className="grid gap-3 rounded-xl border border-[#C9D1CD] p-3">
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-[15px] font-bold">왜 시작할 수 없나요?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_REASONS.map((reason) => (
                    <label className={`flex min-h-12 cursor-pointer items-center justify-center break-keep rounded-xl px-2 text-center text-[15px] font-semibold ${blockReason === reason ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white'}`} key={reason}>
                      <input checked={blockReason === reason} className="sr-only" name="block-reason" onChange={() => setBlockReason(reason)} type="radio" value={reason} />
                      {reason}
                    </label>
                  ))}
                </div>
              </fieldset>
              {blockReason === '기타' && (
                <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="block-note">어떤 상황인지 적어 주세요</label><input className="min-h-12 rounded-xl border border-[#C9D1CD] bg-white px-3 text-base" id="block-note" onChange={(event) => setBlockNote(event.target.value)} value={blockNote} /></div>
              )}
              <p className="text-sm text-[#5D6A65]">사진을 함께 보내야 해요. 오염이 심한 정도는 사유가 아니에요(등급에 포함).</p>
              <Primary disabled={!blockReason || (blockReason === '기타' && !blockNote.trim())} onClick={() => setBlockSent(true)}>사진과 함께 집신에 보내기 (체험)</Primary>
            </div>
          ) : null}
          {!blockSent && <Primary onClick={() => { resetBlock(); setStage(job.id, 'working'); }}>작업 시작</Primary>}
          {!blockOpen && <Secondary onClick={() => setBlockOpen(true)}>청소를 시작할 수 없는 집이에요</Secondary>}
        </div>
      )}

      {stage === 'working' && (
        <div className="grid gap-4 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="text-[17px] font-bold">작업 중 · {formatHour(endsAt)}까지</p>
          <p className="flex items-center gap-2 rounded-xl bg-[#E3F0EC] p-3 text-[15px] font-semibold text-[#083E37]"><Lock aria-hidden="true" className="size-5" />가격 잠김 · 추가요금 버튼은 없어요</p>
          <p className="text-[15px] leading-6 text-[#3E4B47]">끝나면 완료 사진을 올려 주세요. 사진 속 위치정보는 올릴 때 지워요.</p>
          <Primary onClick={() => setStage(job.id, 'waiting')}>작업 끝 · 완료 사진 올리기 (체험)</Primary>
        </div>
      )}

      {stage === 'waiting' && (
        <div className="grid gap-4 rounded-2xl border border-[#E1E6E3] bg-white p-4">
          <p className="text-[17px] font-bold">손님이 검수하고 있어요</p>
          <p className="text-[15px] leading-6 text-[#3E4B47]">손님이 다시 해 달라고 하면 추가요금 없이 다시 가요. 검수가 끝나면 정산돼요.</p>
          <Primary onClick={() => setStage(job.id, 'paid')}>손님 검수 완료 보기 (체험)</Primary>
        </div>
      )}

      {stage === 'paid' && (
        <div className="grid gap-4">
          <section aria-label="정산" className="grid gap-1 rounded-2xl border border-[#E1E6E3] bg-white p-4">
            <dl className="divide-y divide-[#E1E6E3]">
              <Row label="확정 가격" value={won(result.priceWon)} />
              <Row label="+ 추가요금" value="0원" />
            </dl>
            <p className="text-sm text-[#5D6A65]">체험이라 실제로 돈이 나가지 않아요.</p>
          </section>
          <p className="text-[15px] text-[#3E4B47]">이 작업은 {PARTNER.name}의 기록으로 남아요. 다음 손님이 업체를 고를 때 &lsquo;시간 지킴&rsquo;과 &lsquo;다시 부름&rsquo;으로 보여요.</p>
          <Primary onClick={() => setScreen('list')}>요청 목록으로</Primary>
        </div>
      )}
    </div>
  );
}
