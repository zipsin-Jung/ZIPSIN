'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { spaceLabels, type FeedRecord } from '@/features/records/components/RecordsFeed';

export type GalleryAlbum = {
  id: string;
  title: string;
  space: FeedRecord['space'];
  occurredAt: string;
  photos: Array<{ id: string; name: string; url: string | null }>;
};

const spaceNote: Record<FeedRecord['space'], string> = {
  office_internal: '“사무소 내부” 칸이라 우리 사무소 직원만 볼 수 있어요.',
  current_contract: '“이번 계약 공유” 칸이라 지금 임대인·임차인도 볼 수 있어요.',
  shared_history: '“집 이력” 칸이라 이름·연락처 없이 다음 계약에도 남아요.',
};

/** 집 화면 · 사진 탭 (승인 시안 ⑭). 사진 주소는 10분짜리 비공개 링크라 화면을 오래 열어 두면 다시 불러와야 한다. */
export function PhotoGallery({ albums, homeId }: { albums: GalleryAlbum[]; homeId: string }) {
  const [view, setView] = useState<{ album: GalleryAlbum; photo: GalleryAlbum['photos'][number] } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (view && !element.open) element.showModal?.();
    if (!view && element.open) element.close?.();
  }, [view]);

  if (!albums.length) {
    return (
      <div className="rounded-[20px] border border-[#E1E6E3] bg-white p-8 text-center">
        <p className="text-lg font-bold text-[#16211E]">아직 올린 사진이 없어요.</p>
        <p className="mt-2 text-[15px] text-[#5D6A65]">입주 사진, 고장 사진을 올리면 날짜별로 모여요.</p>
        <Link className="app-primary mt-5 inline-flex min-h-12 items-center rounded-xl px-5 text-base font-bold text-white" href={`/homes/${homeId}/records/new`}>사진 올리기</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      {albums.map((album) => (
        <section key={album.id}>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="truncate text-base font-bold text-[#16211E]">{album.title}</h3>
            <span className="shrink-0 text-sm text-[#3E4B47]">{new Date(album.occurredAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} · {spaceLabels[album.space]}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {album.photos.map((photo) => (
              <button aria-label={`${photo.name} 크게 보기`} className="aspect-square overflow-hidden rounded-lg bg-[#EEF1EF]" key={photo.id} onClick={() => setView({ album, photo })} type="button">
                {photo.url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img alt="" className="size-full object-cover" loading="lazy" src={photo.url} />
                  : <span className="grid size-full place-items-center p-1 text-xs text-[#3E4B47]">미리보기 없음</span>}
              </button>
            ))}
          </div>
        </section>
      ))}
      <dialog aria-label="사진 크게 보기" className="m-auto w-[min(92vw,720px)] rounded-2xl bg-white p-0 backdrop:bg-black/70" onClose={() => setView(null)} ref={dialog}>
        {view && (
          <div className="grid gap-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[15px] font-semibold">{view.album.title}</span>
              <button aria-label="닫기" className="grid size-11 place-items-center rounded-xl" onClick={() => setView(null)} type="button"><X aria-hidden="true" className="size-6" /></button>
            </div>
            {view.photo.url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img alt={view.photo.name} className="max-h-[70vh] w-full rounded-lg object-contain" src={view.photo.url} />
              : <p className="p-6 text-center">이 사진은 미리 볼 수 없어요.</p>}
            <p className="text-sm leading-6 text-[#3E4B47]">올린 날짜와 올린 사람이 함께 남아요. {spaceNote[view.album.space]}</p>
          </div>
        )}
      </dialog>
    </div>
  );
}
