'use client';

import { useId } from 'react';
import { ImagePlus } from 'lucide-react';
import type { CleanPhoto } from '@/features/zipsin-clean/domain/demo';

/**
 * 사진 목록 + '사진 추가' 칸. 체험에서는 고른 사진을 이 화면에서만 보여 주고 어디에도 저장하지 않는다.
 */
export function PhotoStrip({ photos, onAdd, addLabel = '사진 추가' }: { photos: CleanPhoto[]; onAdd?: (photos: CleanPhoto[]) => void; addLabel?: string }) {
  const inputId = useId();
  return (
    <ul aria-label="사진" className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <li className="grid gap-1" key={photo.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={photo.label} className="aspect-square w-full max-w-full rounded-xl object-cover" src={photo.src} style={photo.pos ? { objectPosition: photo.pos } : undefined} />
          <span className="truncate text-center text-[13px] text-[#5D6A65]">{photo.label}</span>
        </li>
      ))}
      {onAdd && (
        <li>
          <label className="grid aspect-square w-full cursor-pointer place-items-center rounded-xl border border-dashed border-[#0B6655] bg-[#F7F7F3] text-center text-sm font-semibold text-[#083E37]" htmlFor={inputId}>
            <span className="grid justify-items-center gap-1 break-keep px-1"><ImagePlus aria-hidden="true" className="size-6" />{addLabel}</span>
          </label>
          <input
            accept="image/*"
            className="sr-only"
            id={inputId}
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length === 0) return;
              onAdd(files.map((file, index) => ({ id: `${Date.now()}-${index}`, src: URL.createObjectURL(file), label: file.name })));
              event.target.value = '';
            }}
            type="file"
          />
        </li>
      )}
    </ul>
  );
}
