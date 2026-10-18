'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X } from 'lucide-react';
import { createRecordAction, type RecordFormState } from '@/features/records/actions/create-record';
import { completeAttachmentUploadAction, prepareAttachmentUploadAction } from '@/features/attachments/actions/upload';
import { validateAttachmentSelection, ATTACHMENT_MAX_COUNT } from '@/features/attachments/domain/validation';
import { preparePhoto } from '@/lib/media/prepare-photo';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

/**
 * 기록하기 (2026-10-18 승인 시안 ④ '기록하기(+)').
 * 무엇을 남길지 → 누가 볼 수 있는지 → 사진·메모 순서. 저장하면 기록을 먼저 만들고 사진을 한 장씩 올린다.
 * 사진 일부가 실패해도 기록은 남고, 실패한 사진만 다시 올릴 수 있다.
 */
export type RecordSpaceOption = 'office_internal' | 'current_contract';
type Kind = 'photo' | 'repair';
type Pick = { id: string; file: File };
type UploadState = { name: string; status: 'waiting' | 'saved' | 'failed'; message?: string; file: File };

export function RecordForm({
  homeId,
  officeId,
  contractId = null,
  idempotencyKey,
  spaces = ['office_internal'],
  canRepair = true,
  canNote = true,
  initialKind = 'photo',
}: {
  homeId: string;
  officeId: string | null;
  contractId?: string | null;
  idempotencyKey: string;
  spaces?: RecordSpaceOption[];
  canRepair?: boolean;
  canNote?: boolean;
  initialKind?: Kind;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(canRepair ? initialKind : 'photo');
  const [space, setSpace] = useState<RecordSpaceOption>(spaces.includes('current_contract') && kind === 'repair' ? 'current_contract' : spaces[0] ?? 'office_internal');
  const [state, setState] = useState<RecordFormState>({});
  const [pending, setPending] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const counter = useRef(0);

  function addFiles(list: FileList | null) {
    const next = [...picks, ...Array.from(list ?? []).map((file) => ({ id: `pick-${counter.current++}`, file }))];
    if (next.length > ATTACHMENT_MAX_COUNT) { setState({ error: `한 기록에는 사진·파일을 ${ATTACHMENT_MAX_COUNT}개까지 올릴 수 있어요.` }); return; }
    setState({});
    setPicks(next);
  }

  async function uploadAll(targetRecordId: string, files: File[]) {
    const supabase = createBrowserSupabaseClient();
    const results: UploadState[] = files.map((file) => ({ name: file.name, status: 'waiting', file }));
    setUploads(results);
    let locationKept = 0;
    for (const [index, original] of files.entries()) {
      const prepared = original.type.startsWith('image/') ? await preparePhoto(original) : { file: original, converted: false, locationRemoved: true };
      if (!prepared.locationRemoved && original.type !== 'application/pdf') locationKept += 1;
      const file = prepared.file;
      const ready = await prepareAttachmentUploadAction({ recordId: targetRecordId, name: file.name, type: file.type, size: file.size });
      if (!ready.ok) { results[index] = { ...results[index], status: 'failed', message: ready.error }; setUploads([...results]); continue; }
      const { error } = await supabase.storage.from('home-records').upload(ready.storagePath, file, { contentType: file.type, upsert: false });
      if (error) { results[index] = { ...results[index], status: 'failed', message: '올리지 못했어요.' }; setUploads([...results]); continue; }
      const done = await completeAttachmentUploadAction(ready.attachmentId);
      results[index] = done.ok ? { ...results[index], status: 'saved' } : { ...results[index], status: 'failed', message: done.error };
      setUploads([...results]);
    }
    return { failed: results.filter((result) => result.status === 'failed'), locationKept };
  }

  async function finish(targetRecordId: string, files: File[]) {
    const { failed, locationKept } = await uploadAll(targetRecordId, files);
    if (failed.length) {
      setNotice(`기록은 저장했어요. 사진 ${failed.length}개만 다시 올려 주세요.`);
      return;
    }
    if (locationKept) setNotice(`이 브라우저에서 열 수 없는 사진 ${locationKept}개는 원본 그대로 올렸어요.`);
    router.push(`/homes/${homeId}`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const files = picks.map((pick) => pick.file);
    const recordKind = kind === 'repair' ? 'repair' : files.length ? 'photo' : 'note';
    if (recordKind === 'note' && !canNote) { setState({ error: '사진을 1장 이상 골라 주세요.' }); return; }
    if (files.length) {
      const checked = validateAttachmentSelection(files.map((file) => ({ name: file.name, type: file.type === 'image/heif' ? 'image/heic' : file.type, size: file.size })));
      if (!checked.ok && !/20MB/.test(checked.error)) { setState({ error: checked.error }); return; }
    }
    setPending(true); setState({}); setNotice('');
    try {
      const data = new FormData(event.currentTarget);
      data.set('kind', recordKind);
      data.set('space', space);
      data.set('officeId', space === 'office_internal' ? officeId ?? '' : '');
      data.set('contractId', space === 'current_contract' ? contractId ?? '' : '');
      const next = await createRecordAction(data);
      if (!next.recordId) { setState(next.redirectTo ? { error: '기록을 확인하지 못했어요. 집 화면에서 확인해 주세요.' } : next); return; }
      setRecordId(next.recordId);
      if (!files.length) { router.push(`/homes/${homeId}`); return; }
      await finish(next.recordId, files);
    } catch {
      setState({ error: '작성한 내용은 그대로 있어요. 잠시 후 다시 저장해 주세요.' });
    } finally {
      setPending(false);
    }
  }

  async function retryFailed() {
    if (!recordId) return;
    setPending(true); setNotice('');
    try { await finish(recordId, uploads.filter((upload) => upload.status === 'failed').map((upload) => upload.file)); }
    finally { setPending(false); }
  }

  const choice = (on: boolean) => `flex min-h-[64px] w-full flex-col items-start justify-center gap-0.5 rounded-xl px-4 py-2 text-left ${on ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white text-[#3E4B47]'}`;
  const saved = uploads.filter((upload) => upload.status === 'saved').length;
  const failed = uploads.filter((upload) => upload.status === 'failed');
  const locked = pending || Boolean(recordId);

  return (
    <form aria-busy={pending} className="grid gap-6" onSubmit={submit}>
      <input type="hidden" name="homeId" value={homeId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="taskDueAt" value="" />
      <input type="hidden" name="taskAssignedTo" value="" />

      <fieldset className="grid gap-2" disabled={locked}>
        <legend className="mb-2 text-base font-bold text-[#16211E]">무엇을 남길까요?</legend>
        <div className={`grid gap-2 ${canRepair ? 'grid-cols-2' : ''}`}>
          <button aria-pressed={kind === 'photo'} className={choice(kind === 'photo')} onClick={() => setKind('photo')} type="button"><strong className="text-base">사진 · 메모</strong><span className="text-sm">입주 사진, 통화 메모</span></button>
          {canRepair && <button aria-pressed={kind === 'repair'} className={choice(kind === 'repair')} onClick={() => setKind('repair')} type="button"><strong className="text-base">수리 접수</strong><span className="text-sm">고장 · 하자 · 수리 요청</span></button>}
        </div>
      </fieldset>

      <fieldset className="grid gap-2" disabled={locked}>
        <legend className="mb-2 text-base font-bold text-[#16211E]">누가 볼 수 있나요?</legend>
        {spaces.includes('office_internal') && <button aria-pressed={space === 'office_internal'} className={choice(space === 'office_internal')} onClick={() => setSpace('office_internal')} type="button"><strong className="text-base">사무소 내부</strong><span className="text-sm">우리 사무소 직원만 봐요</span></button>}
        {spaces.includes('current_contract') && <button aria-pressed={space === 'current_contract'} className={choice(space === 'current_contract')} onClick={() => setSpace('current_contract')} type="button"><strong className="text-base">이번 계약 공유</strong><span className="text-sm">사무소 + 지금 임대인·임차인이 봐요</span></button>}
        <div aria-disabled="true" className="flex min-h-[64px] w-full flex-col items-start justify-center gap-0.5 rounded-xl border border-dashed border-[#C9D1CD] bg-[#F7F7F3] px-4 py-2 text-[#5D6A65]">
          <strong className="text-base">집 이력 <span className="text-sm font-normal">· 준비 중</span></strong>
          <span className="text-sm">임대인이 승인한 집에서 열려요. 이름·연락처는 빼고 남아요.</span>
        </div>
        {!spaces.includes('current_contract') && spaces.includes('office_internal') && <p className="text-sm text-[#5D6A65]">이번 계약 공유는 계약 기간을 등록하면 고를 수 있어요.</p>}
      </fieldset>

      <div className="grid gap-2">
        <span className="text-base font-bold text-[#16211E]">사진 <span className="text-sm font-normal text-[#5D6A65]">(최대 {ATTACHMENT_MAX_COUNT}장 · 위치정보는 지우고 올려요)</span></span>
        <div className="grid grid-cols-4 gap-2">
          {picks.map((pick) => (
            <div className="relative aspect-square overflow-hidden rounded-xl border border-[#E1E6E3] bg-[#EEF1EF]" key={pick.id}>
              <span className="absolute inset-0 grid place-items-center p-1 text-center text-xs text-[#3E4B47] [overflow-wrap:anywhere]">{pick.file.name}</span>
              {!locked && <button aria-label={`${pick.file.name} 빼기`} className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-white/90 text-[#16211E]" onClick={() => setPicks(picks.filter((item) => item.id !== pick.id))} type="button"><X aria-hidden="true" className="size-4" /></button>}
            </div>
          ))}
          {!locked && picks.length < ATTACHMENT_MAX_COUNT && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-[#0B6655] bg-white text-[#0B6655]">
              <input accept="image/*,application/pdf" className="sr-only" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} type="file" />
              <span className="grid place-items-center gap-1 text-sm font-semibold"><Camera aria-hidden="true" className="size-6" />사진 추가</span>
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-base font-bold text-[#16211E]" htmlFor="title">제목</label>
        <input className="min-h-14 w-full rounded-xl border border-[#C9D1CD] bg-white px-4 text-base" id="title" maxLength={120} name="title" placeholder={kind === 'repair' ? '예: 욕실 천장 누수' : '예: 입주 전 거실 벽지 상태'} readOnly={locked} required />
        {state.fieldErrors?.title && <p className="text-[15px] text-red-700">{state.fieldErrors.title}</p>}
      </div>
      <div className="grid gap-2">
        <label className="text-base font-bold text-[#16211E]" htmlFor="body">내용</label>
        <textarea className="w-full rounded-xl border border-[#C9D1CD] bg-white p-4 text-base" id="body" maxLength={10000} name="body" readOnly={locked} rows={4} />
      </div>

      {uploads.length > 0 && (
        <div className="rounded-xl bg-[#F1F3F2] p-4" role="status">
          <p className="text-[15px] font-semibold">사진 {uploads.length}개 중 {saved}개 저장</p>
          {failed.length > 0 && <ul className="mt-2 grid gap-1 text-[15px] text-red-700">{failed.map((upload, index) => <li key={`${upload.name}-${index}`}>{upload.name} · {upload.message}</li>)}</ul>}
        </div>
      )}
      {notice && <p className="text-[15px] font-semibold text-[#083E37]" role="status">{notice}</p>}
      {state.error && <p className="text-[15px] font-bold text-red-700" role="alert">{state.error}</p>}

      {recordId && failed.length > 0 ? (
        <div className="grid gap-2">
          <button className="app-primary min-h-14 rounded-xl text-[17px] font-bold text-white disabled:opacity-60" disabled={pending} onClick={retryFailed} type="button">실패한 사진 {failed.length}개 다시 올리기</button>
          <button className="min-h-12 rounded-xl border border-[#C9D1CD] bg-white text-base font-semibold" onClick={() => router.push(`/homes/${homeId}`)} type="button">사진 없이 집 화면으로</button>
        </div>
      ) : (
        <button className="app-primary min-h-14 rounded-xl text-[17px] font-bold text-white disabled:opacity-60" disabled={locked} type="submit">
          {pending ? (uploads.length ? `사진 올리는 중 (${saved}/${uploads.length})` : '저장 중…') : kind === 'repair' ? '수리 접수하기' : '집 기록에 남기기'}
        </button>
      )}
    </form>
  );
}
