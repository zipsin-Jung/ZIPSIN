'use client';

import Link from 'next/link';
import { FileText, Home, MessageCircle, Plus, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AddSheet } from '@/features/navigation/components/AddSheet';

/**
 * 로그인 후 주 메뉴 (2026-10-18 승인 시안: 홈 · 기록 · + · 채팅 · 마이).
 * '+'(기록하기)는 기록하기 시트를 연다(v2). 스크립트가 없으면 집을 고르는 /records/new 로 간다.
 */
export const RECORDS_HREF = '/records';
export const ADD_RECORD_HREF = '/records/new';

const items = [
  { href: '/home', label: '홈', icon: Home },
  { href: RECORDS_HREF, label: '기록', icon: FileText },
  { href: ADD_RECORD_HREF, label: '기록하기', icon: Plus, emphasized: true },
  { href: '/chats', label: '채팅', icon: MessageCircle },
  { href: '/my', label: '마이', icon: UserRound },
] as const;

export function AppNavigation() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = (event: React.MouseEvent) => { event.preventDefault(); setSheetOpen(true); };
  const isCurrent = (href: string) => pathname === href || (href !== '/home' && Boolean(pathname?.startsWith(`${href}/`)) && !items.some((other) => other.href !== href && other.href.startsWith(`${href}/`) && pathname?.startsWith(other.href)));
  return (
    <>
      <nav aria-label="모바일 주요 메뉴" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#EAEBEE] bg-white px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden">
        {items.map((item) => {
          const { href, label, icon: Icon } = item;
          const emphasized = 'emphasized' in item;
          const current = !emphasized && isCurrent(href);
          return (
            <Link
              aria-current={current ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[14px] ${current ? 'font-bold text-[#0B6655]' : 'font-semibold text-[#6B7079]'}`}
              href={href}
              key={label}
              onClick={emphasized ? openSheet : undefined}
            >
              {emphasized ? (
                <span className="grid size-12 place-items-center rounded-full bg-[#0B6655] text-white">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
              ) : (
                <Icon aria-hidden="true" className="size-6" />
              )}
              <span className={emphasized ? 'sr-only' : ''}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <AddSheet onClose={() => setSheetOpen(false)} open={sheetOpen} />
    </>
  );
}
