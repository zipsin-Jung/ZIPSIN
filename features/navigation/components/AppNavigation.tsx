'use client';

import Link from 'next/link';
import { FileText, Home, MessageCircle, Plus, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * 로그인 후 주 메뉴 (2026-10-18 승인 시안: 홈 · 기록 · + · 채팅 · 마이).
 * '기록' 전체 피드는 3단계에서 만든다. 그 전까지는 집 목록(/homes)에서 집을 골라 기록을 본다.
 * '+'(기록하기)도 집을 먼저 고르는 /homes 로 보낸다.
 */
export const RECORDS_HREF = '/homes';
export const ADD_RECORD_HREF = '/homes';

const items = [
  { href: '/home', label: '홈', icon: Home },
  { href: RECORDS_HREF, label: '기록', icon: FileText },
  { href: ADD_RECORD_HREF, label: '기록하기', icon: Plus, emphasized: true },
  { href: '/chats', label: '채팅', icon: MessageCircle },
  { href: '/my', label: '마이', icon: UserRound },
] as const;

export function AppNavigation() {
  const pathname = usePathname();
  const isCurrent = (href: string) => pathname === href || (href !== '/home' && Boolean(pathname?.startsWith(`${href}/`)));
  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        <nav aria-label="주요 메뉴" className="flex items-center gap-1">
          {items.filter((item) => !('emphasized' in item)).map(({ href, label }) => (
            <Link
              aria-current={isCurrent(href) ? 'page' : undefined}
              className={isCurrent(href)
                ? 'rounded-xl bg-[#E3F0EC] px-4 py-2 text-[15px] font-bold text-[#083E37]'
                : 'rounded-xl px-4 py-2 text-[15px] font-semibold text-[#3E4B47] hover:bg-[#F1F3F2] hover:text-[#16211E]'}
              href={href}
              key={label}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="app-primary ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-[15px] font-bold text-white" href={ADD_RECORD_HREF}>
          <Plus aria-hidden="true" className="size-5" />기록하기
        </Link>
      </div>
      <nav aria-label="모바일 주요 메뉴" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#E1E6E3] bg-white px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden">
        {items.map((item) => {
          const { href, label, icon: Icon } = item;
          const emphasized = 'emphasized' in item;
          const current = !emphasized && isCurrent(href);
          return (
            <Link
              aria-current={current ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[13px] ${current ? 'font-bold text-[#0B6655]' : 'font-semibold text-[#5D6A65]'}`}
              href={href}
              key={label}
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
    </>
  );
}
