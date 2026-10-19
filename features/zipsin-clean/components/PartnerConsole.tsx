'use client';

import { useState } from 'react';
import { ChevronLeft, EyeOff, KeyRound, Lock, MapPin, Truck } from 'lucide-react';
import { PhotoStrip } from '@/features/zipsin-clean/components/PhotoStrip';
import { Card, Notice, Primary, Row, Secondary, StatusPill, choiceClass, fieldClass } from '@/features/zipsin-clean/components/ui';
import { BLOCK_REASONS, MEMO_MAX, STATUS_LABEL } from '@/features/zipsin-clean/domain/constants';
import { won } from '@/features/zipsin-clean/domain/pricing';
import { formatHour } from '@/features/zipsin-clean/domain/schedule';
import type { PartnerJob } from '@/features/zipsin-clean/domain/types';
import type { BookingActionPayload } from '@/features/zipsin-clean/schemas/booking';
import type { PhotoTarget } from '@/features/zipsin-clean/client/upload-photo';

type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string };
export type PartnerConsoleProps = {
  partnerName: string | null;
  jobs: PartnerJob[];
  redeem: (code: string) => Promise<Result>;
  act: (payload: BookingActionPayload) => Promise<Result<{ status: string }>>;
  upload: (target: PhotoTarget, files: File[]) => Promise<string | null>;
  refresh: () => void;
};

const OPEN = ['requested', 'accepted', 'working', 'done', 'redo', 'block_reported'];
const dateLabel = (iso: string) => { const [, m, d] = iso.split('-').map(Number); return `${m}월 ${d}일`; };
const serviceLabel = (job: PartnerJob) => job.service === 'tidy' ? `생활 정리 청소 · ${job.hours}시간` : `입주 청소 · ${job.areaPyeong}평 · 방${job.facts?.rooms ?? '-'} 욕실${job.facts?.baths ?? '-'}`;

function Redeem({ redeem, refresh }: Pick<PartnerConsoleProps, 'redeem' | 'refresh'>) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="!text-[24px] font-bold !leading-9 tracking-[-0.02em]">집신이 초대한 업체만 들어와요</h1>
        <p className="mt-2 text-base leading-7 text-[#3E4B47]">집신이 대표님을 직접 만나 확인한 뒤 초대 코드를 드려요. 받은 코드를 넣어 주세요.</p>
      </div>
      <Card label="초대 코드 넣기">
        <label className="flex items-center gap-2 text-[15px] font-bold" htmlFor="invite-code"><KeyRound aria-hidden="true" className="size-5 text-[#0B6655]" />초대 코드</label>
        <input autoComplete="off" className={`${fieldClass} uppercase tracking-widest`} id="invite-code" maxLength={20} onChange={(event) => setCode(event.target.value)} placeholder="예: 3F9A1C0B2D" value={code} />
        <ul className="grid gap-1.5 text-[15px] leading-6 text-[#3E4B47]">
          <li>· 가격은 집신이 정하고, 같은 일은 어느 업체든 같은 가격이에요.</li>
          <li>· 작업을 시작한 뒤 추가요금을 받으면 바로 퇴출이에요.</li>
          <li>· 손님 주소·연락처는 수락한 작업만, 작업이 끝날 때까지만 보여요.</li>
        </ul>
        {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
        <Primary disabled={busy || code.trim().length < 6} onClick={async () => { setBusy(true); const done = await redeem(code); setBusy(false); if (!done.ok) setError(done.error); else refresh(); }}>{busy ? '확인 중…' : '초대 코드로 시작하기'}</Primary>
      </Card>
    </div>
  );
}

function JobDetail({ job, act, upload, refresh, onBack }: { job: PartnerJob; onBack: () => void } & Pick<PartnerConsoleProps, 'act' | 'upload' | 'refresh'>) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(job.partnerNote ?? '');
  const [blockOpen, setBlockOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [blockNote, setBlockNote] = useState('');
  const run = async (payload: Omit<BookingActionPayload, 'bookingId'>) => {
    setBusy(true); setError('');
    const done = await act({ bookingId: job.id, ...payload });
    setBusy(false);
    if (!done.ok) setError(done.error); else refresh();
  };
  const addPhotos = (kind: PhotoTarget['kind']) => async (files: File[]) => { const problem = await upload({ kind, bookingId: job.id }, files); if (!problem) refresh(); return problem; };
  const showPrivate = job.detailAddress !== null;
  const before = job.photos.filter((photo) => photo.kind === 'before');
  const after = job.photos.filter((photo) => photo.kind === 'after');

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-1">
        <button aria-label="뒤로" className="grid size-11 place-items-center rounded-xl" onClick={onBack} type="button"><ChevronLeft aria-hidden="true" className="size-6" /></button>
        <h1 className="!text-[22px] font-bold !leading-8 tracking-[-0.02em]">{job.status === 'requested' ? '작업 요청' : STATUS_LABEL[job.status]}</h1>
      </div>
      <dl className="divide-y divide-[#E1E6E3] rounded-2xl border border-[#E1E6E3] bg-white px-4 py-2">
        <Row label="청소" value={serviceLabel(job)} />
        <Row label="날짜" value={dateLabel(job.serviceDate)} />
        <Row label="시간" value={`${formatHour(job.startHour)} ~ ${formatHour(job.startHour + job.hours)} · ${job.people}명`} />
        {job.arrivalHour !== null && <Row label="이삿짐 도착" value={formatHour(job.arrivalHour)} />}
        <Row label="등급" value={`${job.grade}등급 (집신 계산)`} />
        <Row label={job.status === 'requested' ? '가격 (수락하면 확정)' : '확정 가격'} strong value={won(job.priceWon)} />
      </dl>
      <Card label="주소와 연락처">
        <p className="flex items-center gap-2 text-[15px] font-bold"><MapPin aria-hidden="true" className="size-5 text-[#0B6655]" />{job.areaDistrict}</p>
        {showPrivate
          ? <dl className="divide-y divide-[#E1E6E3]"><Row label="상세 주소" value={job.detailAddress} /><Row label="손님 연락처" value={job.contactPhone} /></dl>
          : <p className="flex items-center gap-2 text-[15px] text-[#5D6A65]"><EyeOff aria-hidden="true" className="size-5" />{OPEN.includes(job.status) ? '상세 주소와 연락처는 수락하면 보여요.' : '작업이 끝나서 상세 주소와 연락처를 다시 가렸어요.'}</p>}
      </Card>
      <Card label="손님 요청">
        <p className="text-[15px] font-bold">손님이 업체에 하는 말</p>
        {!OPEN.includes(job.status) ? <p className="flex items-center gap-2 text-[15px] text-[#5D6A65]"><EyeOff aria-hidden="true" className="size-5" />작업이 끝나서 손님 요청도 다시 가렸어요.</p>
          : job.requests.length === 0 && !job.memo ? <p className="text-[15px] text-[#5D6A65]">따로 남긴 말이 없어요.</p> : (
            <>
              {job.requests.length > 0 && <p className="flex flex-wrap gap-1.5">{job.requests.map((item) => <span className="rounded-full bg-[#F6EBD8] px-3 py-1 text-[15px] font-semibold text-[#7A4E12]" key={item}>{item}</span>)}</p>}
              {job.memo && <p className="rounded-xl bg-[#F7F7F3] p-3 text-[15px] leading-6">{job.memo}</p>}
              {job.status === 'requested' && <p className="text-sm text-[#5D6A65]">수락하면 이 요청도 지키기로 한 거예요. 지키기 어렵다면 수락하지 말아 주세요.</p>}
            </>
          )}
      </Card>

      {job.status === 'requested' && (
        <>
          <div className="grid gap-2"><h2 className="!text-base font-bold !leading-6">포함된 작업</h2><ul className="grid gap-1 text-[15px] text-[#3E4B47]">{job.includes.map((item) => <li key={item}>✓ {item}</li>)}</ul></div>
          <Notice>수락하면 이 가격으로 손님과 확정돼요. 작업 날 현장에서 다시 계산하거나 더 받지 않아요.</Notice>
          <Primary disabled={busy} onClick={() => run({ action: 'accept' })}>이 가격으로 수락하기</Primary>
          <Secondary disabled={busy} onClick={() => run({ action: 'decline' })}>이번엔 못 해요</Secondary>
        </>
      )}

      {job.status === 'accepted' && (
        <Card label="시작 전 확인">
          <p className="text-[17px] font-bold">작업 날, 시작 전에 확인해 주세요</p>
          {job.arrivalHour !== null && <p className="flex items-center gap-2 text-[15px] text-[#3E4B47]"><Truck aria-hidden="true" className="size-5 text-[#0B6655]" />이삿짐이 {formatHour(job.arrivalHour)}에 들어와요. 그 전에 끝나는 일정이에요.</p>}
          <p className="text-[15px] font-bold">시작 전 사진 (선택)</p>
          <PhotoStrip addLabel="사진 올리기" onAdd={addPhotos('before')} photos={before} />
          {blockOpen ? (
            <div className="grid gap-3 rounded-xl border border-[#C9D1CD] p-3">
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-[15px] font-bold">왜 시작할 수 없나요?</legend>
                <div className="grid grid-cols-2 gap-2">{BLOCK_REASONS.map((item) => <label className={choiceClass(reason === item)} key={item}><input checked={reason === item} className="sr-only" name="block-reason" onChange={() => setReason(item)} type="radio" value={item} />{item}</label>)}</div>
              </fieldset>
              <div className="grid gap-1"><label className="text-[15px] font-bold" htmlFor="block-note">{reason === '기타' ? '어떤 상황인지 적어 주세요' : '덧붙일 말 (선택)'}</label><input className={fieldClass} id="block-note" maxLength={MEMO_MAX} onChange={(event) => setBlockNote(event.target.value)} value={blockNote} /></div>
              <p className="text-[15px] font-bold">현장 사진</p>
              <PhotoStrip addLabel="사진 올리기" onAdd={addPhotos('block')} photos={job.photos.filter((photo) => photo.kind === 'block')} />
              <p className="text-sm text-[#5D6A65]">더러운 정도는 사유가 아니에요(등급에 포함). 집신이 사진을 확인하고 서로 위약금 없이 취소해요. 추가요금을 받고 진행하는 방법은 없어요.</p>
              <Primary disabled={busy || !reason || (reason === '기타' && !blockNote.trim()) || !job.photos.some((photo) => photo.kind === 'block')} onClick={() => run({ action: 'report_block', reason: reason ?? '', note: blockNote })}>집신에 보내기</Primary>
              <Secondary onClick={() => setBlockOpen(false)}>닫기</Secondary>
            </div>
          ) : (
            <>
              <Primary disabled={busy} onClick={() => run({ action: 'start' })}>작업 시작</Primary>
              <Secondary onClick={() => setBlockOpen(true)}>청소를 시작할 수 없는 집이에요</Secondary>
            </>
          )}
        </Card>
      )}

      {(job.status === 'working' || job.status === 'redo') && (
        <Card label="작업 중">
          <p className="text-[17px] font-bold">{job.status === 'redo' ? '손님이 다시 해 달라고 했어요 · 추가요금 없음' : `작업 중 · ${formatHour(job.startHour + job.hours)}까지`}</p>
          <p className="flex items-center gap-2 rounded-xl bg-[#E3F0EC] p-3 text-[15px] font-semibold text-[#083E37]"><Lock aria-hidden="true" className="size-5" />가격 잠김 · 추가요금 버튼은 없어요</p>
          <p className="text-[15px] font-bold">완료 사진 (1장 이상)</p>
          <PhotoStrip addLabel="사진 올리기" onAdd={addPhotos('after')} photos={after} />
          <div className="grid gap-1">
            <label className="text-[15px] font-bold" htmlFor="partner-note">손님에게 남길 말 (선택)</label>
            <textarea className="min-h-24 w-full rounded-xl border border-[#C9D1CD] bg-white p-3 text-base" id="partner-note" maxLength={MEMO_MAX} onChange={(event) => setNote(event.target.value)} placeholder="예: 베란다 배수구 물 빠짐이 느려요. 관리사무소에 알려 주세요." value={note} />
            <p className="text-sm text-[#5D6A65]">추가요금이나 다른 유료 작업을 권하는 말은 남기지 말아 주세요.</p>
          </div>
          <Primary disabled={busy || after.length === 0} onClick={() => run({ action: 'finish', note: note.trim() || undefined })}>작업 끝 · 손님에게 검수 요청</Primary>
        </Card>
      )}

      {job.status === 'done' && <Notice>손님이 검수하고 있어요. 다시 해 달라고 하면 추가요금 없이 다시 가요. 검수가 끝나면 손님이 확정 가격을 직접 내요.</Notice>}
      {job.status === 'block_reported' && <Notice tone="gold">집신이 사진을 확인하고 있어요. 확인되면 서로 위약금 없이 취소돼요.</Notice>}
      {job.status === 'completed' && <Notice>검수가 끝났어요. 확정 가격 {won(job.priceWon)} · 추가요금 0원{job.portfolioConsent ? ' · 손님이 사진 공개에 동의했어요' : ''}</Notice>}
      {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
    </div>
  );
}

export function PartnerConsole({ partnerName, jobs, redeem, act, upload, refresh }: PartnerConsoleProps) {
  const [tab, setTab] = useState<'requests' | 'works'>('requests');
  const [jobId, setJobId] = useState<string | null>(null);
  if (!partnerName) return <Redeem redeem={redeem} refresh={refresh} />;
  const job = jobs.find((item) => item.id === jobId);
  if (job) return <JobDetail act={act} job={job} onBack={() => setJobId(null)} refresh={refresh} upload={upload} />;

  const open = jobs.filter((item) => OPEN.includes(item.status));
  const works = jobs.filter((item) => item.status === 'completed');
  return (
    <div className="grid gap-5">
      <div><p className="text-sm text-[#5D6A65]">{partnerName}</p><h1 className="!text-[22px] font-bold !leading-8 tracking-[-0.02em]">{tab === 'requests' ? '작업 요청' : '내 작업 기록'}</h1></div>
      <div aria-label="업체 메뉴" className="grid grid-cols-2 gap-1 rounded-xl bg-[#E1E6E3] p-1" role="tablist">
        {(['requests', 'works'] as const).map((value) => <button aria-selected={tab === value} className={`min-h-11 rounded-lg text-[15px] font-semibold ${tab === value ? 'bg-white text-[#083E37] shadow-sm' : 'text-[#3E4B47]'}`} key={value} onClick={() => setTab(value)} role="tab" type="button">{value === 'requests' ? `작업 요청 ${open.length}` : `내 작업 기록 ${works.length}`}</button>)}
      </div>
      {tab === 'requests' ? (
        <>
          <p className="flex gap-2 rounded-xl bg-[#E3F0EC] p-3 text-[15px] leading-6 text-[#083E37]"><Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />수락하기 전에는 구·동까지만 보여요. 상세 주소와 연락처는 수락한 뒤에 보여요.</p>
          {open.length === 0 && <p className="text-[15px] text-[#3E4B47]">지금은 들어온 요청이 없어요. 새 요청은 알림 없이 여기에 생겨요.</p>}
          <ul className="grid gap-3">
            {open.map((item) => (
              <li key={item.id}>
                <button className="grid w-full gap-1.5 rounded-2xl border border-[#E1E6E3] bg-white p-4 text-left" onClick={() => setJobId(item.id)} type="button">
                  <span className="flex items-center justify-between gap-2"><strong className="text-[17px]">{item.areaDistrict}</strong><StatusPill label={item.status === 'requested' ? '새 요청' : STATUS_LABEL[item.status]} status={item.status} /></span>
                  <span className="text-[15px] text-[#3E4B47]">{serviceLabel(item)}</span>
                  <span className="text-[15px] text-[#3E4B47]">{dateLabel(item.serviceDate)} {formatHour(item.startHour)} · {item.people}명 · 약 {item.hours}시간</span>
                  <span className="text-[17px] font-bold">{won(item.priceWon)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {works.length === 0 && <p className="text-[15px] text-[#3E4B47]">아직 끝난 작업이 없어요.</p>}
          <ul className="grid gap-4">
            {works.map((item) => (
              <li key={item.id}>
                <article aria-label={`${dateLabel(item.serviceDate)} ${item.areaDistrict}`} className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-sm text-[#5D6A65]">{dateLabel(item.serviceDate)}</p><h3 className="!text-[17px] font-bold !leading-7">{item.areaDistrict}</h3><p className="text-[15px] text-[#3E4B47]">{serviceLabel(item)}</p></div>
                    <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${item.portfolioConsent ? 'bg-[#E3F0EC] text-[#083E37]' : 'bg-[#F1F3F2] text-[#5D6A65]'}`}>{item.portfolioConsent ? '손님 동의 · 다른 손님에게 보임' : '손님 동의 안 함 · 나만 보임'}</span>
                  </div>
                  <PhotoStrip photos={item.photos.filter((photo) => photo.kind !== 'block')} />
                  <p className="text-sm text-[#5D6A65]">확정 가격 {won(item.priceWon)} · 추가요금 0원</p>
                </article>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-6 text-[#5D6A65]">작업 기록에는 구·동까지만 남아요. 사진은 손님이 검수할 때 동의한 것만 업체를 고르는 다른 손님에게 보여요.</p>
        </>
      )}
    </div>
  );
}
