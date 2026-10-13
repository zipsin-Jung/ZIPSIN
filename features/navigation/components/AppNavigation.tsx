'use client';

import Link from 'next/link';
import { Home, House, MessageCircle, Plus, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/homes', label: '집', icon: House },
  { href: '/homes', label: '추가', icon: Plus, emphasized: true },
  { href: '/chats', label: '채팅', icon: MessageCircle },
  { href: '/my', label: '마이', icon: UserRound },
];

export function AppNavigation() {
  const pathname = usePathname();
  const isCurrent = (href: string) => pathname === href || (href !== '/home' && pathname.startsWith(`${href}/`));
  return (
    <>
      <nav aria-label="주요 메뉴" className="hidden items-center gap-1 rounded-2xl border border-white/80 bg-white/75 p-1.5 shadow-[0_10px_34px_rgba(15,42,55,0.06)] backdrop-blur-xl md:flex">
        {[['/home', '홈'], ['/homes', '집'], ['/tasks', '할 일'], ['/chats', '채팅'], ['/support', '고객지원'], ['/my', '마이']].map(([href, label]) => (
          <Link aria-current={isCurrent(href) ? 'page' : undefined} className={isCurrent(href) ? 'rounded-xl bg-[#edf7f4] px-4 py-2 text-sm font-bold text-[#123e4a]' : 'rounded-xl px-4 py-2 text-sm font-bold text-[#496273] transition hover:bg-[#edf7f4] hover:text-[#123e4a]'} href={href} key={href}>{label}</Link>
        ))}
      </nav>
      <nav aria-label="모바일 주요 메뉴" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#d8e3e2] bg-white/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_rgba(15,46,58,.08)] backdrop-blur-xl md:hidden">
        {items.map(({ href, label, icon: Icon, emphasized }) => (
          <Link aria-current={label !== '추가' && isCurrent(href) ? 'page' : undefined} className={label !== '추가' && isCurrent(href) ? 'flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-black text-[#0b695c]' : 'flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-bold text-[#5f747d]'} href={href} key={label}>
            <span className={emphasized ? 'grid size-10 place-items-center rounded-2xl bg-[#086b5b] text-white shadow-[0_10px_22px_rgba(8,107,91,.25)]' : ''}>
              <Icon aria-hidden="true" className={emphasized ? 'size-5' : 'size-5 text-[#264d58]'} />
            </span>
            <span className={emphasized ? 'sr-only' : ''}>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
