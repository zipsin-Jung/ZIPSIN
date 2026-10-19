'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Office = { id: string; name: string };

/**
 * 위쪽 '이름 ▾' (v2 시안 V2Home). 개인(내 집)과 내가 속한 사무소 사이를 바꾼다.
 * 사무소는 실제 구성원인 곳만 보인다. 직원 4자리 확인(DEC-032)은 DB 준비 뒤에 이 자리에 붙인다.
 */
export function SpaceSwitcher({ displayName, offices, currentOfficeId }: { displayName: string; offices: Office[]; currentOfficeId: string | null }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = currentOfficeId ? offices.find((office) => office.id === currentOfficeId) : undefined;
  // 개인 공간 이름은 '우리집'(Figma My Home). 사무소는 사무소 이름.
  const label = current?.name ?? '우리집';

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 max-w-[60vw] items-center gap-1 rounded-lg px-1 text-[20px] font-bold tracking-[-0.02em] text-[#212124] md:text-[24px]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="truncate">{label}</span>
        <ChevronDown aria-hidden="true" className={`size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className="sr-only"> · 공간 바꾸기</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[#EAEBEE] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]" role="menu">
          <a aria-current={!current ? 'true' : undefined} className="flex min-h-14 flex-col justify-center px-4 hover:bg-[#F2F3F6]" href="/space?to=me" role="menuitem">
            <strong className="text-base text-[#212124]">{displayName}{!current && <span className="ml-1 text-[#0B6655]">✓</span>}</strong>
            <span className="text-sm text-[#6B7079]">고객 모드 · 우리집</span>
          </a>
          {offices.map((office) => (
            <a aria-current={current?.id === office.id ? 'true' : undefined} className="flex min-h-14 flex-col justify-center border-t border-[#EAEBEE] px-4 hover:bg-[#F2F3F6]" href={`/space?to=${office.id}`} key={office.id} role="menuitem">
              <strong className="text-base text-[#212124]">{office.name}{current?.id === office.id && <span className="ml-1 text-[#0B6655]">✓</span>}</strong>
              <span className="text-sm text-[#6B7079]">파트너 모드 · 사무소</span>
            </a>
          ))}
          <Link className="flex min-h-12 items-center border-t border-[#EAEBEE] px-4 text-[15px] font-semibold text-[#0B6655] hover:bg-[#F2F3F6]" href="/partners/new" onClick={() => setOpen(false)} role="menuitem">+ 집신 파트너 등록</Link>
        </div>
      )}
    </div>
  );
}
