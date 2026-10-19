'use client';

/**
 * 집신수리 체험판 화면(2026-10-18 대표 요청). 기술자님이 휴대폰으로 쓰는 흐름을 그대로 눌러 볼 수 있다.
 * 실제 문자는 가지 않고, 손님 화면도 '체험'으로 같은 휴대폰에서 열어 본다. 저장은 이 휴대폰에만.
 *
 * 화면: 홈(나/팀 전환, 내 견적 받기 링크)
 *   → [손님] 견적 요청(사진·증상·원하는 때)  2026-10-19 대표 결정 A: 손님이 고른 기술자님 한 분에게
 *   → 요청 확인·방문 약속(출장비 미리 표시) → 방문·현장 견적(전 사진·견적) → 손님 수락 / 이번엔 안 함(방문 견적만)
 *   → 수리 중(추가 요청·동의·사후 청구) → 수리 후(후 사진) → 완료(손님 확인) · 기록 한 장 · 내 이력서
 *
 * 주의: app/globals.css 전역 규칙(h2 42px, a color:inherit)이 Tailwind보다 우선하므로 제목은 style로 크기를 정한다.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  EXAMPLE_TEAM_ID,
  ME_ID,
  addLateCharge,
  addPhoto,
  createCustomerRequest,
  createJob,
  customerAnswersEstimate,
  customerAnswersExtra,
  customerAnswersFinal,
  customerAnswersVisit,
  finalAmount,
  finishWork,
  formatWon,
  hasLateCharge,
  initialState,
  jobsFor,
  ownerName,
  parseWon,
  pendingExtras,
  removePhoto,
  requestExtra,
  resumeStats,
  sendEstimate,
  sendFinal,
  sendVisitPlan,
  visitFeeCounts,
  type Extra,
  type Job,
  type JobStage,
  type Message,
  type TryState,
} from '@/features/zipsin-repair/try/model';
import { loadTryState, saveTryState, shrinkPhoto } from '@/features/zipsin-repair/try/storage';

const GREEN = '#0B6655';
const INK = '#16211E';
const SUB = '#4F5D58';
const GOLD = '#8A5A12';
const LATE = '#A3401C';

type View =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'request' }
  | { name: 'job'; jobId: string }
  | { name: 'customer'; jobId: string; messageId: string }
  | { name: 'record'; jobId: string }
  | { name: 'resume' };

const QUICK_TITLES = ['욕실 누수 수리', '수전 교체', '보일러 점검', '도배 보수', '콘센트 교체', '문 손잡이 교체'];
const WISH_OPTIONS = ['오늘', '내일', '이번 주 안', '날짜는 상의해요'];
const VISIT_OPTIONS = ['오늘 오후', '내일 오전', '내일 오후'];

const STAGE_TEXT: Record<JobStage, string> = {
  request: '새 요청',
  scheduled: '방문 약속',
  before: '현장 견적',
  quoted: '견적 답 기다림',
  during: '수리 중',
  after: '수리 후',
  done: '완료',
};

function dateText(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function timeText(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function feeText(job: Job): string {
  if (!job.visitFee) return '출장비 없음';
  return `출장비 ${formatWon(job.visitFee)}${job.visitFeeWaived ? ' · 수리하면 빼 드려요' : ''}`;
}

/* ---------- 작은 부품 ---------- */

function Title({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return <h2 style={{ fontSize: size, lineHeight: 1.35, fontWeight: 700, letterSpacing: '-0.02em', color: INK }}>{children}</h2>;
}

function Btn({ children, onClick, kind = 'primary', disabled, type = 'button' }: {
  children: ReactNode; onClick?: () => void; kind?: 'primary' | 'secondary' | 'quiet' | 'warn'; disabled?: boolean; type?: 'button' | 'submit';
}) {
  const look = {
    primary: { background: GREEN, color: '#fff', border: `1px solid ${GREEN}` },
    secondary: { background: '#fff', color: GREEN, border: '1px solid #B9CFC6' },
    quiet: { background: 'transparent', color: SUB, border: '1px solid transparent' },
    warn: { background: '#fff', color: LATE, border: '1px solid #E6C2B4' },
  }[kind];
  return (
    <button
      className="flex min-h-14 w-full items-center justify-center rounded-2xl px-4 text-[17px] font-bold transition disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      style={look}
      type={type}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'gold' | 'late' | 'gray' }) {
  const look = {
    green: { background: '#E6F1EC', color: GREEN },
    gold: { background: '#F6EEDC', color: GOLD },
    late: { background: '#FBEAE3', color: LATE },
    gray: { background: '#EEF0EE', color: SUB },
  }[tone];
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-semibold" style={look}>{children}</span>;
}

function Card({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 rounded-[20px] border border-[#E1E6E3] bg-white p-5">{children}</div>;
}

function Chips({ options, value, onPick, label }: { options: string[]; value: string; onPick: (v: string) => void; label: string }) {
  return (
    <div aria-label={label} className="flex flex-wrap gap-2" role="group">
      {options.map((item) => (
        <button
          aria-pressed={value === item}
          className="min-h-11 rounded-full border px-3 text-[15px]"
          key={item}
          onClick={() => onPick(item)}
          style={value === item ? { background: GREEN, color: '#fff', borderColor: GREEN } : { borderColor: '#CFD8D3', color: INK }}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function TryBanner() {
  return (
    <p className="rounded-xl bg-[#FFF7E6] px-3 py-2 text-[14px] leading-5" style={{ color: GOLD }}>
      체험판이에요. 실제로 문자가 가지 않고, 이 휴대폰에만 저장돼요.
    </p>
  );
}

function Shell({ title, onBack, children, footer, headerRight }: {
  title: string; onBack?: () => void; children: ReactNode; footer?: ReactNode; headerRight?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F7F3] [word-break:keep-all]" style={{ color: INK }}>
      <header className="sticky top-0 z-10 border-b border-[#E1E6E3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-md items-center gap-2 px-3">
          {onBack ? (
            <button aria-label="뒤로" className="grid size-11 place-items-center rounded-full text-[22px]" onClick={onBack} type="button">←</button>
          ) : null}
          <h1 className="flex-1 truncate text-[18px] font-bold">{title}</h1>
          {headerRight}
        </div>
      </header>
      <main className="mx-auto grid max-w-md gap-4 px-4 pb-48 pt-4">{children}</main>
      {footer ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#E1E6E3] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto grid max-w-md gap-2 px-4 py-3">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

function StageSteps({ job }: { job: Job }) {
  const steps = [
    { label: '요청', stages: ['request', 'scheduled'] },
    { label: '방문 견적', stages: ['before', 'quoted'] },
    { label: '수리 중', stages: ['during'] },
    { label: '수리 후', stages: ['after'] },
    { label: '완료', stages: ['done'] },
  ];
  const current = steps.findIndex((step) => step.stages.includes(job.stage));
  const visitOnly = job.outcome === 'visit_only';
  return (
    <ol aria-label="진행 단계" className="grid grid-cols-5 gap-1">
      {steps.map((step, index) => {
        const skipped = visitOnly && (index === 2 || index === 3);
        const on = index <= current && !skipped;
        return (
          <li
            aria-current={index === current ? 'step' : undefined}
            className="rounded-lg px-0.5 py-2 text-center text-[13px] font-semibold leading-4"
            key={step.label}
            style={on ? { background: GREEN, color: '#fff' } : { background: '#E9ECE9', color: SUB }}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

function extraLabel(extra: Extra): { text: string; tone: 'gold' | 'late' | 'gray' } {
  if (extra.status === 'agreed') return { text: `손님 동의 ${timeText(extra.at)}`, tone: 'gold' };
  if (extra.status === 'late') return { text: '사후 청구', tone: 'late' };
  if (extra.status === 'declined') return { text: '손님 동의 안 함 · 금액에서 빠짐', tone: 'gray' };
  return { text: '손님 동의 기다리는 중', tone: 'gray' };
}

function MoneyRows({ job }: { job: Job }) {
  const visitOnly = job.outcome === 'visit_only';
  const feeCounted = visitFeeCounts(job);
  // 수리를 맡겼는지 정해진 뒤에만 '빼 드림'을 줄 그어 보여 준다
  const settled = job.outcome !== null || job.stage === 'during' || job.stage === 'after';
  const feeNote = visitOnly ? '방문 견적만' : job.visitFeeWaived ? (settled ? '수리해서 빼 드림' : '수리하면 빼 드림') : '방문 전 안내';
  return (
    <dl className="grid gap-2 text-[16px]">
      {job.visitFee ? (
        <div className="flex justify-between gap-3">
          <dt>
            출장비 <span className="text-[13px]" style={{ color: SUB }}>{feeNote}</span>
          </dt>
          <dd className="font-semibold" style={settled && !feeCounted ? { color: SUB, textDecoration: 'line-through' } : undefined}>
            {formatWon(job.visitFee)}
          </dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-3">
        <dt>
          견적{' '}
          <span className="text-[13px]" style={{ color: SUB }}>{visitOnly ? '손님이 이번엔 수리 안 함' : '현장에서 합의'}</span>
        </dt>
        <dd className="font-semibold" style={visitOnly ? { color: SUB, textDecoration: 'line-through' } : undefined}>
          {job.estimate ? formatWon(job.estimate) : '아직 없음'}
        </dd>
      </div>
      {job.extras.map((extra) => {
        const label = extraLabel(extra);
        const counted = extra.status === 'agreed' || extra.status === 'late';
        const color = extra.status === 'late' ? LATE : extra.status === 'agreed' ? GOLD : SUB;
        return (
          <div className="flex justify-between gap-3" key={extra.id}>
            <dt style={{ color }}>
              + {extra.reason || '추가'}{' '}
              <span className="text-[13px] font-semibold">{label.text}</span>
            </dt>
            <dd className="font-semibold" style={{ color, textDecoration: counted ? 'none' : 'line-through' }}>{formatWon(extra.amount)}</dd>
          </div>
        );
      })}
      <div className="flex justify-between gap-3 border-t border-[#E1E6E3] pt-2">
        <dt className="font-bold">= {job.stage === 'done' ? '최종' : '지금까지'}</dt>
        <dd className="text-[18px] font-bold">{formatWon(finalAmount(job))}</dd>
      </div>
    </dl>
  );
}

function PhotoStrip({ label, photos, onAdd, onRemove, single = false, max = 4 }: {
  label: string; photos: string[]; onAdd?: (file: File) => void; onRemove?: (index: number) => void; single?: boolean; max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-2">
      <p className="text-[15px] font-semibold">{label}</p>
      <div className={single ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-3 gap-2'}>
        {photos.map((src, index) => (
          <div className="relative aspect-square overflow-hidden rounded-xl bg-[#EEF1EC]" key={`${label}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={`${label} ${index + 1}`} className="size-full object-cover" src={src} />
            {onRemove ? (
              <button
                aria-label={`${label} ${index + 1} 지우기`}
                className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-black/60 text-[16px] text-white"
                onClick={() => onRemove(index)}
                type="button"
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
        {onAdd && photos.length < max ? (
          <button
            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[#B9CFC6] bg-white text-[15px] font-semibold"
            onClick={() => inputRef.current?.click()}
            style={{ color: GREEN }}
            type="button"
          >
            + 사진 찍기
          </button>
        ) : null}
        {!onAdd && photos.length === 0 ? (
          <div className={`${single ? '' : 'col-span-3'} grid h-20 place-items-center rounded-xl bg-[#EEF1EC] text-[14px]`} style={{ color: SUB }}>사진 없음</div>
        ) : null}
      </div>
      {onAdd ? (
        <input
          accept="image/*"
          aria-label={`${label} 추가`}
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onAdd(file);
            event.target.value = '';
          }}
          ref={inputRef}
          type="file"
        />
      ) : null}
    </div>
  );
}

function MoneyInput({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const parsed = parseWon(value);
  return (
    <div className="grid gap-1.5">
      <label className="text-[15px] font-semibold" htmlFor={id}>{label}</label>
      <input
        className="min-h-14 rounded-2xl border border-[#CFD8D3] bg-white px-4 text-[18px] outline-none focus:border-[#0B6655]"
        id={id}
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        placeholder="예: 150000 또는 15만"
        value={value}
      />
      <p className="text-[14px]" style={{ color: parsed ? GREEN : SUB }}>
        {value ? (parsed ? `= ${formatWon(parsed)}` : '숫자로 적어 주세요') : hint}
      </p>
    </div>
  );
}

function TextInput({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[15px] font-semibold" htmlFor={id}>{label}</label>
      <input
        className="min-h-14 rounded-2xl border border-[#CFD8D3] bg-white px-4 text-[17px] outline-none focus:border-[#0B6655]"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function CheckLine({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#E1E6E3] px-3 text-[16px]">
      <input checked={checked} className="size-5 accent-[#0B6655]" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {children}
    </label>
  );
}

/** 기록 한 장: 집신수리의 핵심 결과물 */
function RecordCard({ job, state }: { job: Job; state: TryState }) {
  const visitOnly = job.outcome === 'visit_only';
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        {job.isExample ? <Badge tone="gray">예시</Badge> : null}
        {visitOnly ? <Badge tone="gray">방문 견적만</Badge> : null}
        {job.customerCheck === 'confirmed' ? <Badge>손님 확인됨</Badge> : null}
        {job.customerCheck === 'waiting' ? <Badge tone="gray">손님 확인 기다리는 중</Badge> : null}
        {job.customerCheck === 'disputed' ? <Badge tone="gray">집신이 확인 중</Badge> : null}
        {!visitOnly ? (hasLateCharge(job) ? <Badge tone="late">사후 청구 있음</Badge> : <Badge tone="gold">견적대로 끝냄</Badge>) : null}
      </div>
      <div>
        <Title>{job.title}</Title>
        <p className="text-[14px]" style={{ color: SUB }}>{job.area} · {dateText(job.doneAt ?? job.createdAt)}</p>
        <p className="mt-1 text-[14px]" style={{ color: SUB }}>
          {ownerName(state, job.ownerId)}{job.crew.length ? ` · 함께한 기술자님 ${job.crew.join(', ')}` : ''}
        </p>
      </div>
      {visitOnly ? (
        <PhotoStrip label="현장 사진" photos={job.photosBefore.slice(0, 1)} single />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <PhotoStrip label="전 사진" photos={job.photosBefore.slice(0, 1)} single />
          <PhotoStrip label="후 사진" photos={job.photosAfter.slice(0, 1)} single />
        </div>
      )}
      <MoneyRows job={job} />
    </Card>
  );
}

function JobRow({ job, state, onOpen }: { job: Job; state: TryState; onOpen: () => void }) {
  const visitOnly = job.outcome === 'visit_only';
  return (
    <button className="grid w-full gap-1 rounded-[18px] border border-[#E1E6E3] bg-white p-4 text-left" onClick={onOpen} type="button">
      <span className="flex items-center justify-between gap-2">
        <span className="text-[17px] font-bold">{job.title}</span>
        <Badge tone={job.stage === 'done' ? 'green' : job.stage === 'request' ? 'late' : 'gold'}>{visitOnly ? '방문 견적만' : STAGE_TEXT[job.stage]}</Badge>
      </span>
      <span className="text-[14px]" style={{ color: SUB }}>
        {job.area} · {dateText(job.doneAt ?? job.createdAt)}{job.ownerId !== ME_ID ? ` · ${ownerName(state, job.ownerId)}` : ''}
        {job.stage === 'scheduled' && job.visitAt ? ` · 방문 ${job.visitAt}` : ''}
      </span>
      <span className="flex flex-wrap items-center gap-2 text-[15px]">
        {job.stage === 'done' || job.estimate ? <span className="font-semibold">{formatWon(finalAmount(job))}</span> : <span style={{ color: SUB }}>견적 전</span>}
        {job.isExample ? <Badge tone="gray">예시</Badge> : null}
        {hasLateCharge(job) ? <Badge tone="late">사후 청구</Badge> : null}
      </span>
    </button>
  );
}

/* ---------- 손님 화면(체험) ---------- */

function messageText(job: Job, message: Message): string {
  if (message.kind === 'visit') return `[집신수리] ${job.title} 방문 약속: ${job.visitAt}. ${feeText(job)}. 괜찮으시면 눌러 주세요.`;
  if (message.kind === 'estimate') return `[집신수리] ${job.title} 현장 견적 ${formatWon(job.estimate ?? 0)}이 도착했어요. 수리할지 정해 주세요.`;
  if (message.kind === 'extra') {
    const extra = job.extras.find((item) => item.id === message.extraId);
    return `[집신수리] 작업 중 추가 금액 요청: ${extra?.reason ?? ''} ${formatWon(extra?.amount ?? 0)}. 동의하시면 눌러 주세요.`;
  }
  return `[집신수리] ${job.title} 작업이 끝났어요. 최종 금액 ${formatWon(finalAmount(job))}이 맞는지 확인해 주세요.`;
}

type CustomerAnswer = 'visit-ok' | 'visit-change' | 'estimate-ok' | 'estimate-no' | 'agree' | 'decline' | 'match' | 'differ';

function CustomerView({ job, message, onAnswer, onBack }: {
  job: Job; message: Message; onAnswer: (answer: CustomerAnswer) => void; onBack: () => void;
}) {
  const extra = message.extraId ? job.extras.find((item) => item.id === message.extraId) : undefined;
  return (
    <Shell onBack={onBack} title="손님 휴대폰 화면 (체험)">
      <p className="text-[15px] leading-6" style={{ color: SUB }}>
        실제 서비스에서는 손님 휴대폰으로 아래 문자가 가요. 손님은 가입 없이 링크만 눌러 답해요.
      </p>
      <div className="rounded-2xl bg-[#E9ECEF] p-4 text-[15px] leading-6">{messageText(job, message)}</div>
      <Card>
        <p className="text-[14px] font-semibold" style={{ color: GREEN }}>집신수리</p>
        <Title>{job.title}</Title>
        <p className="text-[14px]" style={{ color: SUB }}>{job.area}</p>

        {message.kind === 'visit' ? (
          <>
            <div className="grid gap-1 rounded-xl bg-[#F3F6F4] p-3 text-[16px]">
              <span>방문 시간: <b>{job.visitAt}</b></span>
              <span>{job.visitFee ? <>출장비: <b>{formatWon(job.visitFee)}</b></> : <b>출장비 없음</b>}</span>
              {job.visitFee ? (
                <span className="text-[14px]" style={{ color: SUB }}>
                  {job.visitFeeWaived ? '수리를 맡기시면 출장비는 빼 드려요. 수리를 안 하시면 출장비만 내요.' : '수리 여부와 관계없이 출장비가 있어요.'}
                </span>
              ) : null}
            </div>
            {job.stage === 'scheduled' ? (
              <div className="grid gap-2">
                <Btn onClick={() => onAnswer('visit-ok')}>이 시간에 와 주세요</Btn>
                <Btn kind="secondary" onClick={() => onAnswer('visit-change')}>다른 시간이 좋아요</Btn>
              </div>
            ) : <Badge>{job.timeChangeAsked ? '다른 시간을 요청했어요' : '방문 약속을 정했어요'}</Badge>}
          </>
        ) : null}

        {message.kind === 'estimate' ? (
          <>
            <PhotoStrip label="현장 사진" photos={job.photosBefore} />
            <div className="flex justify-between text-[17px]"><span>현장 견적</span><b>{formatWon(job.estimate ?? 0)}</b></div>
            {job.visitFee ? <p className="text-[14px]" style={{ color: SUB }}>{feeText(job)}</p> : null}
            {job.stage === 'quoted' ? (
              <div className="grid gap-2">
                <Btn onClick={() => onAnswer('estimate-ok')}>이 견적으로 수리해 주세요</Btn>
                <Btn kind="secondary" onClick={() => onAnswer('estimate-no')}>이번엔 수리 안 할게요</Btn>
                <p className="text-[13px] leading-5" style={{ color: SUB }}>
                  수리를 안 하셔도 괜찮아요. {job.visitFee ? `출장비 ${formatWon(job.visitFee)}만 내시면 돼요.` : '출장비도 없어요.'}
                </p>
              </div>
            ) : <Badge>{job.outcome === 'visit_only' ? '이번엔 수리 안 하기로 했어요' : '수리를 맡겼어요'}</Badge>}
          </>
        ) : null}

        {message.kind === 'extra' && extra ? (
          <>
            <div className="grid gap-1 rounded-xl bg-[#F6EEDC] p-3 text-[16px]" style={{ color: GOLD }}>
              <span>추가 사유: {extra.reason}</span>
              <b>+ {formatWon(extra.amount)}</b>
            </div>
            <p className="text-[14px]" style={{ color: SUB }}>동의하시면 최종 금액에 더해지고, 동의한 시각이 기록에 남아요.</p>
            {extra.status === 'requested' ? (
              <div className="grid gap-2">
                <Btn onClick={() => onAnswer('agree')}>동의해요</Btn>
                <Btn kind="secondary" onClick={() => onAnswer('decline')}>동의하지 않아요</Btn>
              </div>
            ) : <Badge tone="gray">{extraLabel(extra).text}</Badge>}
          </>
        ) : null}

        {message.kind === 'final' ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <PhotoStrip label="전 사진" photos={job.photosBefore.slice(0, 1)} single />
              <PhotoStrip label="후 사진" photos={job.photosAfter.slice(0, 1)} single />
            </div>
            <MoneyRows job={job} />
            {job.customerCheck === 'waiting' ? (
              <div className="grid gap-2">
                <Btn onClick={() => onAnswer('match')}>금액이 맞아요</Btn>
                <Btn kind="secondary" onClick={() => onAnswer('differ')}>금액이 달라요</Btn>
                <p className="text-[13px] leading-5" style={{ color: SUB }}>
                  &lsquo;금액이 달라요&rsquo;는 공개되지 않고 집신에만 전달돼요. 집신이 양쪽 이야기를 듣고 확인해요.
                </p>
              </div>
            ) : (
              <Badge tone={job.customerCheck === 'confirmed' ? 'green' : 'gray'}>
                {job.customerCheck === 'confirmed' ? '확인했어요' : '집신에 전달했어요'}
              </Badge>
            )}
          </>
        ) : null}
      </Card>
    </Shell>
  );
}

/** 손님이 기술자님 링크(rp.zipsin.net/이름)로 들어와 견적을 요청하는 화면(체험) */
function CustomerRequest({ onBack, onSubmit }: { onBack: () => void; onSubmit: (input: { title: string; area: string; symptom: string; wish: string; photos: string[] }) => void }) {
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [symptom, setSymptom] = useState('');
  const [wish, setWish] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const ready = title.trim() && area.trim() && wish;
  return (
    <Shell
      footer={<Btn disabled={!ready} onClick={() => onSubmit({ title, area, symptom, wish, photos })}>견적 요청 보내기</Btn>}
      onBack={onBack}
      title="손님 휴대폰 화면 (체험)"
    >
      <TryBanner />
      <p className="text-[15px] leading-6" style={{ color: SUB }}>
        손님이 기술자님이 준 링크를 열면 보이는 화면이에요. 이 요청은 이 기술자님 한 분에게만 가요.
      </p>
      <Card>
        <p className="text-[14px] font-semibold" style={{ color: GREEN }}>집신수리 · 나 기술자님께 견적 요청</p>
        <TextInput id="req-title" label="어디를 고쳐야 하나요?" onChange={setTitle} placeholder="예: 욕실 누수" value={title} />
        <Chips label="자주 쓰는 일" onPick={setTitle} options={QUICK_TITLES} value={title} />
        <TextInput id="req-area" label="어느 구인가요?" onChange={setArea} placeholder="예: 마포구" value={area} />
        <div className="grid gap-1.5">
          <label className="text-[15px] font-semibold" htmlFor="req-symptom">어떤 상태인가요? (선택)</label>
          <textarea
            className="min-h-24 rounded-2xl border border-[#CFD8D3] bg-white p-4 text-[17px] outline-none focus:border-[#0B6655]"
            id="req-symptom"
            onChange={(event) => setSymptom(event.target.value)}
            placeholder="예: 아래층 천장에 물이 새요"
            value={symptom}
          />
        </div>
        <PhotoStrip
          label="사진 (최대 3장)"
          max={3}
          onAdd={async (file) => {
            try { setPhotoError(''); const url = await shrinkPhoto(file); setPhotos((current) => [...current, url].slice(0, 3)); } catch { setPhotoError('사진을 읽지 못했어요.'); }
          }}
          onRemove={(index) => setPhotos((current) => current.filter((_, i) => i !== index))}
          photos={photos}
        />
        {photoError ? <p className="text-[14px]" role="alert" style={{ color: LATE }}>{photoError}</p> : null}
        <div className="grid gap-1.5">
          <p className="text-[15px] font-semibold">언제 와 주시면 좋을까요?</p>
          <Chips label="원하는 때" onPick={setWish} options={WISH_OPTIONS} value={wish} />
        </div>
      </Card>
    </Shell>
  );
}

/* ---------- 본체 ---------- */

export function RepairTryApp() {
  const [state, setState] = useState<TryState>(() => initialState());
  const [loaded, setLoaded] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [stack, setStack] = useState<View[]>([{ name: 'home' }]);
  const view = stack[stack.length - 1];

  useEffect(() => {
    setState(loadTryState(window.localStorage));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveFailed(!saveTryState(state, window.localStorage));
  }, [state, loaded]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stack.length, view.name]);

  const go = (next: View) => setStack((current) => [...current, next]);
  const back = () => setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
  const replace = (next: View) => setStack((current) => [...current.slice(0, -1), next]);

  const job = 'jobId' in view ? state.jobs.find((item) => item.id === view.jobId) : undefined;

  const saveWarning = saveFailed ? (
    <p className="rounded-xl bg-[#FBEAE3] px-3 py-2 text-[14px]" role="alert" style={{ color: LATE }}>
      저장 공간이 가득 찼어요. 사진을 몇 장 지우면 다시 저장돼요.
    </p>
  ) : null;

  if (view.name === 'new') {
    return <NewJob onBack={back} onCreate={(input) => {
      const result = createJob(state, input);
      setState({ ...result.state, activeOwnerId: input.ownerId });
      replace({ name: 'job', jobId: result.jobId });
    }} state={state} />;
  }

  if (view.name === 'request') {
    return <CustomerRequest onBack={back} onSubmit={(input) => {
      const result = createCustomerRequest(state, input);
      setState(result.state);
      replace({ name: 'job', jobId: result.jobId });
    }} />;
  }

  if (view.name === 'customer' && job) {
    const message = job.messages.find((item) => item.id === view.messageId);
    if (message) {
      return (
        <CustomerView
          job={job}
          message={message}
          onAnswer={(answer) => {
            if (answer === 'visit-ok' || answer === 'visit-change') setState(customerAnswersVisit(state, job.id, answer === 'visit-ok'));
            if (answer === 'estimate-ok' || answer === 'estimate-no') setState(customerAnswersEstimate(state, job.id, answer === 'estimate-ok'));
            if ((answer === 'agree' || answer === 'decline') && message.extraId) {
              setState(customerAnswersExtra(state, job.id, message.extraId, answer === 'agree'));
            }
            if (answer === 'match' || answer === 'differ') setState(customerAnswersFinal(state, job.id, answer === 'match'));
          }}
          onBack={back}
        />
      );
    }
  }

  if (view.name === 'record' && job) {
    return (
      <Shell onBack={back} title="기록 한 장">
        <RecordCard job={job} state={state} />
        <p className="text-[14px] leading-6" style={{ color: SUB }}>
          손님과 기술자님이 모두 공개에 동의한 기록만 공개 이력서에 보여요. 주소는 구까지만, 사진은 설비 부분만 남겨요.
        </p>
      </Shell>
    );
  }

  if (view.name === 'resume') {
    return <Resume onBack={back} onOpen={(id) => go({ name: 'record', jobId: id })} state={state} />;
  }

  if (view.name === 'job' && job) {
    return (
      <JobScreen
        job={job}
        onBack={back}
        onCustomer={(messageId) => go({ name: 'customer', jobId: job.id, messageId })}
        onRecord={() => go({ name: 'record', jobId: job.id })}
        saveWarning={saveWarning}
        setState={setState}
        state={state}
      />
    );
  }

  return (
    <Home
      onNew={() => go({ name: 'new' })}
      onOpen={(id) => go({ name: 'job', jobId: id })}
      onRequest={() => go({ name: 'request' })}
      onResume={() => go({ name: 'resume' })}
      saveWarning={saveWarning}
      setState={setState}
      state={state}
    />
  );
}

function OwnerSwitch({ state, setState }: { state: TryState; setState: (s: TryState) => void }) {
  return (
    <label className="relative">
      <span className="sr-only">누구 이름으로 볼지 고르기</span>
      <select
        className="min-h-11 rounded-full border border-[#B9CFC6] bg-white py-2 pl-4 pr-9 text-[16px] font-bold"
        onChange={(event) => setState({ ...state, activeOwnerId: event.target.value })}
        style={{ color: GREEN, appearance: 'none' }}
        value={state.activeOwnerId}
      >
        <option value={ME_ID}>나</option>
        {state.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: GREEN }}>▼</span>
    </label>
  );
}

function Home({ state, setState, onNew, onOpen, onRequest, onResume, saveWarning }: {
  state: TryState; setState: (s: TryState) => void; onNew: () => void; onOpen: (id: string) => void;
  onRequest: () => void; onResume: () => void; saveWarning: ReactNode;
}) {
  const jobs = jobsFor(state, state.activeOwnerId);
  const requests = jobs.filter((job) => job.stage === 'request');
  const working = jobs.filter((job) => job.stage !== 'done' && job.stage !== 'request');
  const done = jobs.filter((job) => job.stage === 'done');
  const isTeam = state.activeOwnerId !== ME_ID;
  const team = state.teams.find((item) => item.id === state.activeOwnerId);
  return (
    <Shell
      footer={(
        <>
          <Btn onClick={onNew}>+ 새 일 시작 (전화·현장에서 받은 일)</Btn>
          <Btn kind="secondary" onClick={onResume}>내 이력서 보기</Btn>
        </>
      )}
      headerRight={<OwnerSwitch setState={setState} state={state} />}
      title="집신수리"
    >
      <TryBanner />
      {saveWarning}

      {!isTeam ? (
        <Card>
          <p className="text-[15px] font-semibold">내 견적 받기 링크</p>
          <p className="rounded-xl bg-[#F3F6F4] px-3 py-2 text-[16px] font-semibold" style={{ color: GREEN }}>rp.zipsin.net/나 <span className="text-[13px] font-normal" style={{ color: SUB }}>(체험용 예시 주소)</span></p>
          <p className="text-[14px] leading-5" style={{ color: SUB }}>
            당근 글·명함·문자에 이 링크를 붙이면, 손님이 사진과 함께 나에게만 견적을 요청해요.
          </p>
          <Btn kind="secondary" onClick={onRequest}>손님이 되어 견적 요청해 보기</Btn>
        </Card>
      ) : null}

      {isTeam && team ? (
        <p className="text-[15px] leading-6" style={{ color: SUB }}>
          {team.name}으로 한 일이에요. 함께 다니는 분: {team.members.join(', ')}. 날마다 함께한 사람은 일마다 따로 골라요.
        </p>
      ) : null}

      {requests.length ? (
        <section className="grid gap-3" aria-label="새 견적 요청">
          <Title size={18}>새 견적 요청 {requests.length}건</Title>
          {requests.map((job) => <JobRow job={job} key={job.id} onOpen={() => onOpen(job.id)} state={state} />)}
        </section>
      ) : null}

      <section className="grid gap-3" aria-label="진행 중인 일">
        <Title size={18}>진행 중인 일</Title>
        {working.length ? working.map((job) => <JobRow job={job} key={job.id} onOpen={() => onOpen(job.id)} state={state} />) : (
          <p className="rounded-2xl bg-white p-4 text-[15px]" style={{ color: SUB }}>진행 중인 일이 없어요.</p>
        )}
      </section>

      <section className="grid gap-3" aria-label="끝난 일">
        <Title size={18}>끝난 일</Title>
        {done.length ? done.map((job) => <JobRow job={job} key={job.id} onOpen={() => onOpen(job.id)} state={state} />) : (
          <p className="rounded-2xl bg-white p-4 text-[15px]" style={{ color: SUB }}>아직 끝난 일이 없어요.</p>
        )}
      </section>

      <button
        className="mx-auto min-h-11 px-3 text-[14px] underline underline-offset-4"
        onClick={() => {
          if (window.confirm('체험 기록을 모두 지우고 처음부터 다시 할까요?')) setState(initialState());
        }}
        style={{ color: SUB }}
        type="button"
      >
        체험 처음부터 다시
      </button>
    </Shell>
  );
}

function NewJob({ state, onBack, onCreate }: {
  state: TryState; onBack: () => void; onCreate: (input: { title: string; area: string; customer: string; ownerId: string; crew: string[] }) => void;
}) {
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [customer, setCustomer] = useState('');
  const [ownerId, setOwnerId] = useState(state.activeOwnerId);
  const [crew, setCrew] = useState<string[]>([]);
  const candidates = useMemo(() => {
    const team = state.teams.find((item) => item.id === ownerId);
    return team ? team.members : Array.from(new Set(state.teams.flatMap((item) => item.members)));
  }, [ownerId, state.teams]);
  const ready = title.trim().length > 0 && area.trim().length > 0;

  return (
    <Shell
      footer={<Btn disabled={!ready} onClick={() => onCreate({ title, area, customer: customer || '손님', ownerId, crew: crew.filter((name) => candidates.includes(name)) })}>이 일 시작하기</Btn>}
      onBack={onBack}
      title="새 일 시작"
    >
      <TryBanner />
      <p className="text-[15px] leading-6" style={{ color: SUB }}>전화나 현장에서 바로 받은 일이에요. 현장 견적부터 시작해요.</p>
      <Card>
        <TextInput id="job-title" label="어떤 일인가요?" onChange={setTitle} placeholder="예: 욕실 누수 수리" value={title} />
        <Chips label="자주 쓰는 일" onPick={setTitle} options={QUICK_TITLES} value={title} />
        <TextInput id="job-area" label="어느 구인가요?" onChange={setArea} placeholder="예: 마포구 (주소는 남기지 않아요)" value={area} />
        <TextInput id="job-customer" label="손님 휴대폰 (체험이라 실제로 보내지 않아요)" onChange={setCustomer} placeholder="예: 010-0000-0000" value={customer} />
      </Card>

      <Card>
        <div className="grid gap-1.5">
          <label className="text-[15px] font-semibold" htmlFor="job-owner">누구 이름으로 할까요?</label>
          <select
            className="min-h-14 rounded-2xl border border-[#CFD8D3] bg-white px-4 text-[17px]"
            id="job-owner"
            onChange={(event) => { setOwnerId(event.target.value); setCrew([]); }}
            value={ownerId}
          >
            <option value={ME_ID}>나 (혼자 또는 직접 받은 일)</option>
            {state.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-[15px] font-semibold">오늘 함께한 사람</legend>
          {candidates.map((name) => (
            <CheckLine
              checked={crew.includes(name)}
              key={name}
              onChange={(checked) => setCrew((current) => (checked ? [...current, name] : current.filter((item) => item !== name)))}
            >
              {name}
            </CheckLine>
          ))}
          <p className="text-[14px] leading-5" style={{ color: SUB }}>
            혼자 하는 날은 아무도 고르지 않으면 돼요. 고른 분은 수락하면 그분 이력서에도 이 일이 남아요.
          </p>
        </fieldset>
      </Card>
    </Shell>
  );
}

function JobScreen({ job, state, setState, onBack, onCustomer, onRecord, saveWarning }: {
  job: Job; state: TryState; setState: (s: TryState) => void; onBack: () => void;
  onCustomer: (messageId: string) => void; onRecord: () => void; saveWarning: ReactNode;
}) {
  const [estimate, setEstimate] = useState('');
  const [visitAt, setVisitAt] = useState('');
  const [visitFee, setVisitFee] = useState('20000');
  const [noFee, setNoFee] = useState(false);
  const [waived, setWaived] = useState(true);
  const [extraOpen, setExtraOpen] = useState<null | 'request' | 'late'>(null);
  const [extraAmount, setExtraAmount] = useState('');
  const [extraReason, setExtraReason] = useState('');
  const [finishAsk, setFinishAsk] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const addPhotoFile = async (which: 'before' | 'after', file: File) => {
    try {
      setPhotoError('');
      const dataUrl = await shrinkPhoto(file);
      setState(addPhoto(state, job.id, which, dataUrl));
    } catch {
      setPhotoError('사진을 읽지 못했어요. 다른 사진으로 해 볼까요?');
    }
  };

  const lastMessage = (kind: Message['kind']) => [...job.messages].reverse().find((message) => message.kind === kind);
  const openLast = (kind: Message['kind']) => { const message = lastMessage(kind); if (message) onCustomer(message.id); };
  const pending = pendingExtras(job);
  const parsedEstimate = parseWon(estimate);
  const parsedExtra = parseWon(extraAmount);
  const parsedFee = noFee ? 0 : parseWon(visitFee);
  const visitReady = visitAt.trim().length > 0 && parsedFee !== null;

  const submitExtra = () => {
    if (!parsedExtra || !extraReason.trim()) return;
    setState(extraOpen === 'late'
      ? addLateCharge(state, job.id, parsedExtra, extraReason)
      : requestExtra(state, job.id, parsedExtra, extraReason));
    setExtraOpen(null);
    setExtraAmount('');
    setExtraReason('');
  };

  let footer: ReactNode = null;
  if (job.stage === 'request') {
    footer = (
      <Btn disabled={!visitReady} onClick={() => parsedFee !== null && setState(sendVisitPlan(state, job.id, { visitAt, visitFee: parsedFee, waived }))}>
        손님에게 방문 약속 보내기
      </Btn>
    );
  } else if (job.stage === 'before') {
    footer = (
      <Btn disabled={!parsedEstimate} onClick={() => parsedEstimate && setState(sendEstimate(state, job.id, parsedEstimate))}>
        손님에게 현장 견적 보내기
      </Btn>
    );
  } else if (job.stage === 'during' && !extraOpen) {
    footer = finishAsk ? (
      <>
        <p className="text-[15px] leading-6">아직 손님 동의를 받지 못한 추가 금액이 있어요. 어떻게 할까요?</p>
        <Btn kind="secondary" onClick={() => { setState(finishWork(state, job.id, 'drop')); setFinishAsk(false); }}>그 금액은 빼고 끝내기</Btn>
        <Btn kind="warn" onClick={() => { setState(finishWork(state, job.id, 'late')); setFinishAsk(false); }}>사후 청구로 남기고 끝내기</Btn>
        <Btn kind="quiet" onClick={() => setFinishAsk(false)}>돌아가기</Btn>
      </>
    ) : (
      <Btn onClick={() => (pending.length ? setFinishAsk(true) : setState(finishWork(state, job.id, 'drop')))}>작업 끝내기 → 후 사진</Btn>
    );
  } else if (job.stage === 'after') {
    footer = <Btn onClick={() => setState(sendFinal(state, job.id))}>손님에게 완료·최종 금액 보내기</Btn>;
  } else if (job.stage === 'done') {
    footer = <Btn kind="secondary" onClick={onRecord}>기록 한 장 보기</Btn>;
  }

  return (
    <Shell footer={footer} onBack={onBack} title={job.title}>
      <TryBanner />
      {saveWarning}
      <p className="text-[15px]" style={{ color: SUB }}>
        {job.area} · {ownerName(state, job.ownerId)}{job.crew.length ? ` · 함께한 기술자님 ${job.crew.join(', ')}` : ' · 혼자'}
        {job.source === 'link' ? ' · 내 링크로 들어온 요청' : ' · 직접 받은 일'}
      </p>
      <StageSteps job={job} />
      {photoError ? <p className="text-[14px]" role="alert" style={{ color: LATE }}>{photoError}</p> : null}

      {job.source === 'link' && (job.stage === 'request' || job.stage === 'scheduled' || job.stage === 'before') ? (
        <Card>
          <Title>손님 요청</Title>
          {job.symptom ? <p className="text-[16px] leading-6">&ldquo;{job.symptom}&rdquo;</p> : null}
          <p className="text-[15px]" style={{ color: SUB }}>원하는 때: <b style={{ color: INK }}>{job.wish}</b></p>
          <PhotoStrip label="손님이 보낸 사진" photos={job.requestPhotos} />
        </Card>
      ) : null}

      {job.stage === 'request' ? (
        <Card>
          <Title>방문 약속 정하기</Title>
          {job.timeChangeAsked ? (
            <p className="rounded-xl bg-[#FFF7E6] px-3 py-2 text-[15px]" style={{ color: GOLD }}>손님이 다른 시간을 원해요. 시간을 다시 정해 주세요.</p>
          ) : null}
          <TextInput id="visit-at" label="언제 갈까요?" onChange={setVisitAt} placeholder="예: 내일 오후 2시" value={visitAt} />
          <Chips label="자주 쓰는 시간" onPick={setVisitAt} options={VISIT_OPTIONS} value={visitAt} />
          {!noFee ? (
            <MoneyInput hint="손님은 방문 전에 이 금액을 봐요." id="visit-fee" label="출장비" onChange={setVisitFee} value={visitFee} />
          ) : null}
          <CheckLine checked={noFee} onChange={setNoFee}>출장비 받지 않아요</CheckLine>
          {!noFee ? <CheckLine checked={waived} onChange={setWaived}>수리하면 출장비 빼 드려요</CheckLine> : null}
          <p className="text-[14px] leading-5" style={{ color: SUB }}>
            출장비를 미리 알리면 &ldquo;출장비 얘기 못 들었다&rdquo;는 다툼이 사라져요.
          </p>
        </Card>
      ) : null}

      {job.stage === 'scheduled' ? (
        <Card>
          <Title>방문 약속</Title>
          <p className="text-[16px]">{job.visitAt} · {feeText(job)}</p>
          <SentNote done={false} doneText="" onOpen={() => openLast('visit')} waitText="방문 약속을 보냈어요. 손님 답을 기다리는 중" />
        </Card>
      ) : null}

      {job.stage === 'before' ? (
        <Card>
          <Title>방문 · 현장 견적</Title>
          {job.visitAt ? <p className="text-[15px]" style={{ color: SUB }}>방문 {job.visitAt} · {feeText(job)}</p> : null}
          <PhotoStrip
            label="현장 사진 (전 사진)"
            onAdd={(file) => void addPhotoFile('before', file)}
            onRemove={(index) => setState(removePhoto(state, job.id, 'before', index))}
            photos={job.photosBefore}
          />
          {job.photosBefore.length === 0 ? (
            <p className="text-[14px]" style={{ color: SUB }}>현장 사진이 없으면 기록에 &lsquo;사진 없음&rsquo;으로 남아요.</p>
          ) : null}
          <MoneyInput hint="견적을 보내면 손님이 수리할지 정해요. 보낸 견적은 바꿀 수 없어요." id="estimate" label="현장 견적 금액" onChange={setEstimate} value={estimate} />
        </Card>
      ) : null}

      {job.stage === 'quoted' ? (
        <Card>
          <Title>견적 답 기다리는 중</Title>
          <MoneyRows job={job} />
          <SentNote done={false} doneText="" onOpen={() => openLast('estimate')} waitText="현장 견적을 보냈어요. 손님이 수리할지 정하는 중" />
        </Card>
      ) : null}

      {job.stage === 'during' || job.stage === 'after' ? (
        <Card>
          <Title>금액</Title>
          <MoneyRows job={job} />
        </Card>
      ) : null}

      {job.stage === 'during' ? (
        <Card>
          <Title>수리 중</Title>
          <p className="text-[15px] font-semibold" style={{ color: GREEN }}>✓ 손님이 견적대로 수리를 맡겼어요</p>
          {job.extras.filter((extra) => extra.status === 'requested').map((extra) => {
            const message = job.messages.find((item) => item.extraId === extra.id);
            return (
              <SentNote
                done={false}
                doneText=""
                key={extra.id}
                onOpen={() => message && onCustomer(message.id)}
                waitText={`추가 ${formatWon(extra.amount)} 동의 요청을 보냈어요`}
              />
            );
          })}

          {extraOpen ? (
            <div className="grid gap-3 rounded-2xl border border-[#E1E6E3] p-3">
              <p className="text-[16px] font-bold" style={{ color: extraOpen === 'late' ? LATE : GOLD }}>
                {extraOpen === 'late' ? '손님 동의 없이 금액 추가' : '추가 금액 동의 요청'}
              </p>
              {extraOpen === 'late' ? (
                <p className="text-[14px] leading-5" style={{ color: LATE }}>
                  이 금액은 기록에 &lsquo;사후 청구&rsquo;로 그대로 보여요. 가능하면 손님 동의를 먼저 받아 주세요.
                </p>
              ) : null}
              <MoneyInput id="extra-amount" label="추가 금액" onChange={setExtraAmount} value={extraAmount} />
              <TextInput id="extra-reason" label="왜 추가되나요?" onChange={setExtraReason} placeholder="예: 배관 부속 교체" value={extraReason} />
              <Btn disabled={!parsedExtra || !extraReason.trim()} kind={extraOpen === 'late' ? 'warn' : 'primary'} onClick={submitExtra}>
                {extraOpen === 'late' ? '사후 청구로 기록하기' : '손님에게 동의 요청 보내기'}
              </Btn>
              <Btn kind="quiet" onClick={() => setExtraOpen(null)}>취소</Btn>
            </div>
          ) : (
            <div className="grid gap-2">
              <Btn kind="secondary" onClick={() => setExtraOpen('request')}>+ 추가 금액 요청 (손님 동의)</Btn>
              <Btn kind="quiet" onClick={() => setExtraOpen('late')}>손님 동의 없이 금액 추가하기</Btn>
            </div>
          )}
        </Card>
      ) : null}

      {job.stage === 'after' ? (
        <Card>
          <Title>수리 후</Title>
          <PhotoStrip
            label="후 사진"
            onAdd={(file) => void addPhotoFile('after', file)}
            onRemove={(index) => setState(removePhoto(state, job.id, 'after', index))}
            photos={job.photosAfter}
          />
          <p className="text-[14px] leading-5" style={{ color: SUB }}>
            완료를 보내면 손님 휴대폰에 전후 사진과 최종 금액이 가고, 손님은 &lsquo;금액이 맞아요&rsquo;만 누르면 돼요.
          </p>
        </Card>
      ) : null}

      {job.stage === 'done' ? (
        <Card>
          <Title>{job.outcome === 'visit_only' ? '방문 견적만' : '완료'}</Title>
          {job.outcome === 'visit_only' ? (
            <>
              <MoneyRows job={job} />
              <p className="text-[15px] leading-6" style={{ color: SUB }}>
                손님이 이번엔 수리를 안 하기로 했어요. 방문해서 정직하게 본 것도 내 기록으로 남아요.
              </p>
            </>
          ) : null}
          {job.outcome !== 'visit_only' && job.customerCheck === 'waiting' ? (
            <SentNote done={false} doneText="" onOpen={() => openLast('final')} waitText="완료 알림을 보냈어요. 손님 확인을 기다리는 중" />
          ) : null}
          {job.outcome !== 'visit_only' && job.customerCheck === 'confirmed' ? <Badge>손님이 금액을 확인했어요</Badge> : null}
          {job.customerCheck === 'disputed' ? (
            <p className="text-[15px] leading-6" style={{ color: SUB }}>손님이 금액이 다르다고 했어요. 공개되지 않고, 집신이 양쪽 이야기를 듣고 확인해요.</p>
          ) : null}
          <p className="text-[15px] leading-6" style={{ color: SUB }}>이 일은 내 이력서에 기록 한 장으로 쌓였어요.</p>
        </Card>
      ) : null}
    </Shell>
  );
}

function SentNote({ done, doneText, waitText, onOpen }: { done: boolean; doneText: string; waitText: string; onOpen: () => void }) {
  return (
    <div className="grid gap-2 rounded-2xl bg-[#F3F6F4] p-3">
      <p className="text-[15px] font-semibold" style={{ color: done ? GREEN : INK }}>{done ? `✓ ${doneText}` : waitText}</p>
      {!done ? (
        <button className="min-h-11 justify-self-start text-[15px] font-semibold underline underline-offset-4" onClick={onOpen} style={{ color: GREEN }} type="button">
          손님 화면 열어 보기 (체험)
        </button>
      ) : null}
    </div>
  );
}

function Resume({ state, onBack, onOpen }: { state: TryState; onBack: () => void; onOpen: (id: string) => void }) {
  const stats = resumeStats(state);
  const done = state.jobs.filter((job) => job.stage === 'done');
  const tiles = [
    { label: '수리한 일', value: `${stats.repairedCount}건` },
    { label: '방문 견적만', value: `${stats.visitOnlyCount}건` },
    { label: '견적대로 끝낸 수리', value: `${stats.asEstimatedCount} / ${stats.repairedCount}` },
    { label: '손님이 확인한 일', value: `${stats.confirmedCount}건` },
    { label: '팀으로 한 일', value: `${stats.teamCount}건` },
  ];
  return (
    <Shell onBack={onBack} title="내 이력서">
      <TryBanner />
      <Card>
        <p className="text-[14px] font-semibold" style={{ color: GREEN }}>집신수리 기술자님</p>
        <Title size={22}>{state.meName === '나' ? '나의 기록' : `${state.meName} 기술자님`}</Title>
        <div className="grid grid-cols-2 gap-2">
          {tiles.map((tile) => (
            <div className="grid gap-1 rounded-2xl bg-[#F3F6F4] p-3" key={tile.label}>
              <span className="text-[14px]" style={{ color: SUB }}>{tile.label}</span>
              <span className="text-[22px] font-bold">{tile.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[14px] leading-5" style={{ color: SUB }}>
          &lsquo;견적대로 끝낸 수리&rsquo;는 사후 청구 없이 끝낸 수리예요. 가장 싼 순이 아니라 이 숫자가 먼저 보여요.
          &lsquo;방문 견적만&rsquo;도 정직하게 보고 간 기록이에요.
        </p>
      </Card>
      <section aria-label="쌓인 기록" className="grid gap-3">
        <Title size={18}>쌓인 기록</Title>
        {done.map((job) => <JobRow job={job} key={job.id} onOpen={() => onOpen(job.id)} state={state} />)}
      </section>
      <p className="text-[14px] leading-6" style={{ color: SUB }}>
        서비스가 시작되면 이 이력서를 rp.zipsin.net 링크로 당근 글이나 명함에 붙일 수 있어요.
        {state.teams.some((team) => team.id === EXAMPLE_TEAM_ID) ? ' 김반장 설비팀은 체험용 예시 팀이에요.' : ''}
      </p>
    </Shell>
  );
}
