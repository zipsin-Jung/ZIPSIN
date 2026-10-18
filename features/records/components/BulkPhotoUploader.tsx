'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Images } from 'lucide-react';
import { createRecordAction } from '@/features/records/actions/create-record';
import { completeAttachmentUploadAction, prepareAttachmentUploadAction } from '@/features/attachments/actions/upload';
import { ATTACHMENT_MAX_COUNT } from '@/features/attachments/domain/validation';
import { chunk, groupPhotos, type PhotoGroup } from '@/features/records/domain/photo-groups';
import { uploadRecordFiles, type UploadDeps } from '@/features/records/client/upload-record-files';
import { readPhotoMeta } from '@/lib/media/photo-meta';
import { preparePhoto, type PreparedPhoto } from '@/lib/media/prepare-photo';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

/**
 * 앨범에서 사진 한꺼번에 올려 집별로 나누기 (승인 시안 ⑤-나, 2026-10-18 고르기판 ⑤ 채택).
 * 1) 사진을 고르면 찍은 날짜·장소로 묶는다(휴대폰 안에서만, 위치는 서버로 보내지 않음).
 * 2) 묶음마다 집을 고른다. 고르지 않은 묶음은 올리지 않는다.
 * 3) 묶음마다 '사무소 내부' 사진 기록을 만든다(한 기록 10장까지, 넘으면 나눔). 사진은 위치정보를 지우고 한 장씩 올린다.
 * 실패한 사진만 다시 올린다. 기록을 만들지 못한 묶음은 같은 요청 번호로 다시 만들어 기록이 두 번 생기지 않는다.
 */
export const BULK_MAX_PHOTOS = 100;
export type BulkHome = { id: string; label: string; officeId: string };
type Picked = { id: string; file: File };
type Batch = { homeId: string; title: string; key: string; files: File[]; recordId: string | null; failed: File[]; error?: string };
type Phase = 'pick' | 'reading' | 'sort' | 'uploading' | 'result';

function newKey() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    /* v8 ignore next */
    : '00000000-0000-4000-8000-000000000000'.replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
}

export function BulkPhotoUploader({
  homes,
  initialHomeId,
  currentYear = new Date().getFullYear(),
  prepare = preparePhoto,
}: {
  homes: BulkHome[];
  initialHomeId?: string | null;
  currentYear?: number;
  prepare?: (file: File) => Promise<PreparedPhoto>;
}) {
  const defaultHome = homes.some((home) => home.id === initialHomeId) ? (initialHomeId as string) : homes.length === 1 ? homes[0].id : '';
  const [phase, setPhase] = useState<Phase>('pick');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [batches, setBatches] = useState<Batch[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [locationKept, setLocationKept] = useState(0);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const counter = useRef(0);

  // 미리보기 주소는 휴대폰 메모리에만 있다. 화면을 떠나거나 다시 고르면 지운다.
  useEffect(() => () => { Object.values(previews).forEach((url) => URL.revokeObjectURL?.(url)); }, [previews]);

  const byId = useMemo(() => new Map(picked.map((item) => [item.id, item.file])), [picked]);
  const chosenCount = groups.reduce((sum, group) => sum + (choice[group.key] ? group.ids.length : 0), 0);
  const skippedCount = picked.length - chosenCount;
  const totalToUpload = batches.reduce((sum, batch) => sum + batch.files.length, 0);
  const failedCount = batches.reduce((sum, batch) => sum + batch.failed.length, 0);

  const deps: UploadDeps = {
    prepare,
    prepareUpload: prepareAttachmentUploadAction,
    putObject: (path, file) => createBrowserSupabaseClient().storage.from('home-records').upload(path, file, { contentType: file.type, upsert: false }),
    complete: completeAttachmentUploadAction,
  };

  async function choose(list: FileList | null) {
    const files = Array.from(list ?? []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    if (files.length > BULK_MAX_PHOTOS) { setError(`한 번에 ${BULK_MAX_PHOTOS}장까지 골라 주세요.`); return; }
    setError(''); setPhase('reading');
    const items = files.map((file) => ({ id: `photo-${counter.current++}`, file }));
    const metas = await Promise.all(items.map(async (item) => ({ id: item.id, ...(await readPhotoMeta(item.file).catch(() => ({ takenAt: null, gps: null }))) })));
    const nextGroups = groupPhotos(metas, currentYear);
    const fileById = new Map(items.map((item) => [item.id, item.file]));
    const canPreview = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    setPreviews(canPreview ? Object.fromEntries(nextGroups.flatMap((group) => group.ids.slice(0, 6)).map((id) => [id, URL.createObjectURL(fileById.get(id) as File)])) : {});
    setPicked(items);
    setGroups(nextGroups);
    setChoice(Object.fromEntries(nextGroups.map((group) => [group.key, defaultHome])));
    setPhase('sort');
  }

  async function run(list: Batch[]) {
    setPhase('uploading');
    let kept = 0;
    const next = list.map((batch) => ({ ...batch }));
    for (const batch of next) {
      if (!batch.failed.length) continue;
      if (!batch.recordId) {
        const home = homes.find((item) => item.id === batch.homeId) as BulkHome;
        const data = new FormData();
        for (const [name, value] of Object.entries({ homeId: home.id, officeId: home.officeId, contractId: '', space: 'office_internal', kind: 'photo', title: batch.title, body: '', idempotencyKey: batch.key, taskDueAt: '', taskAssignedTo: '' })) data.set(name, value);
        const made = await createRecordAction(data).catch(() => ({ recordId: undefined, error: '기록을 만들지 못했어요.' }));
        if (!made.recordId) { batch.error = made.error ?? '기록을 만들지 못했어요.'; continue; }
        batch.recordId = made.recordId; batch.error = undefined;
      }
      const result = await uploadRecordFiles(batch.recordId, batch.failed, deps, () => setSavedCount((count) => count + 1));
      kept += result.locationKept;
      batch.failed = result.items.filter((item) => item.status === 'failed').map((item) => item.file);
    }
    setBatches(next);
    setLocationKept((count) => count + kept);
    setPhase('result');
  }

  function start() {
    const list: Batch[] = [];
    for (const group of groups) {
      const homeId = choice[group.key];
      if (!homeId) continue;
      const parts = chunk(group.ids.map((id) => byId.get(id) as File), ATTACHMENT_MAX_COUNT);
      parts.forEach((files, index) => list.push({ homeId, title: `${group.label} 사진${parts.length > 1 ? ` (${index + 1}/${parts.length})` : ''}`, key: newKey(), files, recordId: null, failed: files }));
    }
    setBatches(list); setSavedCount(0); setLocationKept(0);
    void run(list);
  }

  if (!homes.length) {
    return (
      <div className="rounded-[20px] border border-[#E1E6E3] bg-white p-8 text-center">
        <p className="text-base font-bold text-[#16211E]">사진을 올릴 집이 아직 없어요.</p>
        <p className="mt-1 text-[15px] text-[#5D6A65]">집을 먼저 등록하면 사진을 집별로 나눠 올릴 수 있어요.</p>
        <Link className="mt-4 inline-flex min-h-12 items-center font-semibold text-[#0B6655]" href="/homes/new">집 등록하기</Link>
      </div>
    );
  }

  const title = phase === 'pick' || phase === 'reading' ? '사진 한꺼번에 올리기' : `사진 ${picked.length}장 고름`;

  return (
    <div className="grid gap-4">
      <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#16211E]">{title}</h1>

      {(phase === 'pick' || phase === 'reading') && (
        <>
          <p className="text-[15px] leading-7 text-[#3E4B47]">휴대폰 앨범에서 여러 장을 한꺼번에 고르세요. 찍은 날짜와 장소로 묶어 드려요. 사진 속 위치정보는 올릴 때 지워요.</p>
          <label className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[#0B6655] bg-white text-[#0B6655] ${phase === 'reading' ? 'pointer-events-none opacity-60' : ''}`}>
            <input accept="image/*" aria-label="앨범에서 사진 고르기" className="sr-only" disabled={phase === 'reading'} multiple onChange={(event) => { const list = event.target.files; void choose(list).finally(() => { event.target.value = ''; }); }} type="file" />
            <Images aria-hidden="true" className="size-8" />
            <span className="text-[17px] font-bold">{phase === 'reading' ? '사진 정보를 읽는 중…' : '앨범에서 사진 고르기'}</span>
            <span className="text-sm text-[#3E4B47]">한 번에 {BULK_MAX_PHOTOS}장까지</span>
          </label>
          {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
        </>
      )}

      {phase === 'sort' && (
        <>
          <p className="text-[15px] leading-7 text-[#3E4B47]">찍은 날짜와 장소로 묶어 봤어요. 맞는 집을 골라 주세요. 사진 속 위치정보는 올릴 때 지워요.</p>
          <ul className="grid gap-3">
            {groups.map((group) => (
              <li className="grid gap-2 rounded-[14px] border border-[#E1E6E3] bg-white p-3" key={group.key}>
                <strong className="text-[15px] text-[#16211E]">{group.label} · {group.ids.length}장</strong>
                <ul aria-hidden="true" className="grid grid-cols-6 gap-1">
                  {group.ids.slice(0, 6).map((id) => (
                    <li className="relative aspect-square overflow-hidden rounded-md bg-[#DCE3DF]" key={id}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- 휴대폰 안의 사진 미리보기(blob 주소) */}
                      {previews[id] && <img alt="" className="absolute inset-0 size-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} src={previews[id]} />}
                    </li>
                  ))}
                </ul>
                {group.ids.length > 6 && <span className="text-sm text-[#5D6A65]">외 {group.ids.length - 6}장</span>}
                <label className="flex min-h-12 items-center gap-2 rounded-[10px] border border-[#8A9792] bg-white px-3 text-[15px] font-semibold text-[#16211E]">
                  <span aria-hidden="true">집:</span>
                  <select aria-label={`${group.label} 사진의 집`} className="min-h-11 flex-1 bg-transparent text-[15px] font-semibold outline-none" onChange={(event) => setChoice({ ...choice, [group.key]: event.target.value })} value={choice[group.key] ?? ''}>
                    <option value="">고르지 않음</option>
                    {homes.map((home) => <option key={home.id} value={home.id}>{home.label}</option>)}
                  </select>
                </label>
              </li>
            ))}
          </ul>
          {skippedCount > 0 && <p className="text-[15px] text-[#3E4B47]">집을 고르지 않은 사진 {skippedCount}장은 올리지 않아요.</p>}
          <button className="app-primary min-h-14 w-full rounded-xl text-[17px] font-bold text-white disabled:opacity-60" disabled={chosenCount === 0} onClick={start} type="button">{chosenCount}장 올리기</button>
        </>
      )}

      {phase === 'uploading' && (
        <div aria-busy="true" className="rounded-xl bg-[#F1F3F2] p-4" role="status">
          <p className="text-[15px] font-semibold">사진 {totalToUpload}장 중 {savedCount}장 올림</p>
          <p className="mt-1 text-sm text-[#3E4B47]">다 올라갈 때까지 이 화면을 닫지 말아 주세요.</p>
        </div>
      )}

      {phase === 'result' && (
        <div className="grid gap-3">
          {locationKept > 0 && <p className="text-[15px] font-semibold text-[#083E37]" role="status">이 브라우저에서 열 수 없는 사진 {locationKept}장은 원본 그대로 올렸어요.</p>}
          {failedCount > 0 ? (
            <>
              <div className="rounded-xl bg-[#FCEDEA] p-4" role="alert">
                <p className="text-[15px] font-bold text-red-800">사진 {failedCount}장을 올리지 못했어요. 다른 사진은 저장했어요.</p>
                <ul className="mt-2 grid gap-1 text-[15px] text-red-800">
                  {batches.filter((batch) => batch.failed.length).map((batch) => <li key={batch.key}>{batch.title} · {batch.failed.length}장{batch.error ? ` · ${batch.error}` : ''}</li>)}
                </ul>
              </div>
              <button className="app-primary min-h-14 rounded-xl text-[17px] font-bold text-white" onClick={() => void run(batches)} type="button">못 올린 {failedCount}장 다시 올리기</button>
              <Link className="flex min-h-12 items-center justify-center rounded-xl border border-[#C9D1CD] bg-white text-base font-semibold text-[#16211E]" href="/records">올린 사진만 보러 가기</Link>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-[#E3F0EC] p-4" role="status">
                <p className="text-[17px] font-bold text-[#083E37]">사진 {totalToUpload}장을 올렸어요.</p>
                <p className="mt-1 text-[15px] text-[#083E37]">각 집의 기록에 &lsquo;사무소 내부&rsquo;로 남았어요.</p>
              </div>
              <Link className="app-primary flex min-h-14 items-center justify-center rounded-xl text-[17px] font-bold text-white" href="/records">기록 보러 가기</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
