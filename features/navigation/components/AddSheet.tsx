'use client';

import Link from 'next/link';
import { Camera, ChevronRight, ClipboardCheck, NotebookPen, Wrench, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * '+' 기록하기 시트 (v2 시안 V2Add). 고른 뒤 어느 집인지 묻는다(집이 하나면 바로 그 집).
 * 보여 주는 항목은 실제로 저장되는 기능만: 사진·동영상, 입주·퇴거 상태, 수리 요청, 메모.
 */
export const ADD_OPTIONS = [
  { id: 'photo', title: '사진 · 동영상', hint: '지금 찍거나 앨범에서', href: '/records/new', icon: Camera },
  { id: 'inspection', title: '입주 · 퇴거 상태', hint: '방마다 항목별로', href: '/records/new?kind=inspection', icon: ClipboardCheck },
  { id: 'repair', title: '수리 요청', hint: '사진 한 장으로 시작', href: '/records/new?kind=repair', icon: Wrench },
  { id: 'note', title: '메모', hint: '통화 내용, 약속', href: '/records/new?kind=note', icon: NotebookPen },
] as const;

export function AddSheet({ open, onClose, options = ADD_OPTIONS }: { open: boolean; onClose: () => void; options?: ReadonlyArray<(typeof ADD_OPTIONS)[number]> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      aria-labelledby="add-sheet-title"
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-black/40 md:m-auto md:max-w-md"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      ref={dialogRef}
    >
      {open && (
        <section className="rounded-t-[20px] bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 md:rounded-[20px] md:pb-5">
          <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-[#DCDEE3] md:hidden" />
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-[#212124]" id="add-sheet-title">기록하기</h2>
            <button aria-label="닫기" className="grid size-11 place-items-center rounded-lg text-[#212124]" onClick={onClose} type="button"><X aria-hidden="true" className="size-6" /></button>
          </div>
          <ul className="mt-2 grid">
            {options.map(({ id, title, hint, href, icon: Icon }) => (
              <li className="border-t border-[#EAEBEE] first:border-t-0" key={id}>
                <Link className="flex min-h-[68px] items-center gap-3 py-2" href={href} onClick={onClose}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F2F3F6] text-[#0B6655]"><Icon aria-hidden="true" className="size-6" /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[17px] text-[#212124]">{title}</strong>
                    <span className="block text-[15px] text-[#6B7079]">{hint}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 text-[#6B7079]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </dialog>
  );
}
