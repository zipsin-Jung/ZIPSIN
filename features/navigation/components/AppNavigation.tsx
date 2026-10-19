'use client';

import Link from 'next/link';
import { Bell, Camera, ClipboardCheck, Home, MoreHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * 휴대폰 아래 메뉴 (대표 Figma, 2026-10-19): My Home · 체크리스트 · 거주·관리(가운데) · 알림 · 더보기.
 * 채팅은 위쪽 줄에 있다. PC는 왼쪽 메뉴(AppSidebar).
 */
export const RECORDS_HREF = '/living';
export const ADD_RECORD_HREF = '/records/new';

const items = [
  { href: '/home', label: 'My Home', icon: Home },
  { href: '/checklist', label: '체크리스트', icon: ClipboardCheck },
  { href: RECORDS_HREF, label: '거주·관리', icon: Camera, emphasized: true },
  { href: '/notifications', label: '알림', icon: Bell },
  { href: '/more', label: '더보기', icon: MoreHorizontal },
] as const;

export function AppNavigation() {
  const pathname = usePathname() ?? '';
  const isCurrent = (href: string) => (href === '/home' ? pathname === '/home' : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="모바일 주요 메뉴" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#EAEBEE] bg-white px-1 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden">
      {items.map((item) => {
        const { href, label, icon: Icon } = item;
        const emphasized = 'emphasized' in item;
        const current = isCurrent(href);
        return (
          <Link
            aria-current={current ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[13px] leading-tight ${current ? 'font-bold text-[#0B6655]' : 'font-semibold text-[#4D5159]'}`}
            href={href}
            key={label}
          >
            {emphasized ? (
              <span className={`-mt-4 grid size-12 place-items-center rounded-full border-2 bg-white ${current ? 'border-[#0B6655] text-[#0B6655]' : 'border-[#DCDEE3] text-[#212124]'}`}>
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.6} />
              </span>
            ) : (
              <Icon aria-hidden="true" className="size-6" strokeWidth={1.6} />
            )}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
