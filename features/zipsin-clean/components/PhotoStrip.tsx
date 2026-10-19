'use client';

import { useId, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import type { CleanPhoto } from '@/features/zipsin-clean/domain/types';

const LABEL: Record<CleanPhoto['kind'], string> = { before: '청소 전', after: '청소 후', block: '시작 불가', record: '사진' };

/**
 * 사진 목록 + '사진 추가' 칸. onAdd가 실제로 올리고, 실패 문장을 돌려준다(null이면 성공).
 */
export function PhotoStrip({ photos, onAdd, addLabel = '사진 추가' }: { photos: CleanPhoto[]; onAdd?: (files: File[]) => Promise<string | null>; addLabel?: string }) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="grid gap-2">
      <ul aria-label="사진" className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <li className="grid gap-1" key={photo.id}>
            {photo.url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img alt={LABEL[photo.kind]} className="aspect-square w-full max-w-full rounded-xl object-cover" src={photo.url} />
              : <span className="grid aspect-square place-items-center rounded-xl bg-[#F1F3F2] text-sm text-[#5D6A65]">볼 수 없음</span>}
            <span className="text-center text-[13px] text-[#5D6A65]">{LABEL[photo.kind]}</span>
          </li>
        ))}
        {onAdd && (
          <li>
            <label className={`grid aspect-square w-full cursor-pointer place-items-center rounded-xl border border-dashed border-[#0B6655] bg-[#F7F7F3] text-center text-sm font-semibold text-[#083E37] ${busy ? 'opacity-60' : ''}`} htmlFor={inputId}>
              <span className="grid justify-items-center gap-1 break-keep px-1"><ImagePlus aria-hidden="true" className="size-6" />{busy ? '올리는 중…' : addLabel}</span>
            </label>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              id={inputId}
              multiple
              onChange={async (event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                if (files.length === 0) return;
                setBusy(true); setError('');
                const problem = await onAdd(files);
                setBusy(false);
                if (problem) setError(problem);
              }}
              type="file"
            />
          </li>
        )}
      </ul>
      {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
    </div>
  );
}
