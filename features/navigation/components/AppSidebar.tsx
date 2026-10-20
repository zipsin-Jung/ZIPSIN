'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookUser, Building2, CalendarClock, Camera, ClipboardCheck, FileText, Folder, Home, ListTodo, MessageCircle, Settings, ShieldCheck, Users } from 'lucide-react';

/**
 * PC 왼쪽 메뉴 (대표 Figma "My Home", 2026-10-19).
 */
const customerGroups = [
  [
    { href: '/home', label: '내 집', icon: Home },
    { href: '/checklist', label: '체크리스트', icon: ClipboardCheck },
    { href: '/contract', label: '계약 · 입주', icon: FileText },
    { href: '/living', label: '거주관리', icon: Camera },
    { href: '/expiry', label: '만기 · 퇴거', icon: CalendarClock },
    { href: '/living?tab=document', label: '문서함', icon: Folder },
    { href: '/contacts', label: '주소록', icon: BookUser },
  ],
  [
    { href: '/notifications', label: '알림', icon: Bell },
    { href: '/my', label: '설정', icon: Settings },
  ],
] as const;

/** 파트너(사무소) 모드 메뉴. */
const partnerGroups = [
  [
    { href: '/home', label: '사무소 홈', icon: Building2 },
    { href: '/homes', label: '집 목록', icon: Home },
    { href: '/tasks', label: '할 일', icon: ListTodo },
    { href: '/records', label: '기록', icon: FileText },
    { href: '/office/members', label: '직원', icon: Users },
    { href: '/chats', label: '채팅', icon: MessageCircle },
  ],
  [
    { href: '/notifications', label: '알림', icon: Bell },
    { href: '/my', label: '설정', icon: Settings },
  ],
] as const;

export function AppSidebar({ mode = 'customer' }: { mode?: 'customer' | 'partner' }) {
  const groups: ReadonlyArray<ReadonlyArray<{ href: string; label: string; icon: typeof Home }>> = mode === 'partner' ? partnerGroups : customerGroups;
  const pathname = usePathname() ?? '';
  const current = (href: string) => {
    if (href.includes('?')) return false;
    const path = href;
    return path === '/home' ? pathname === '/home' : pathname === path || pathname.startsWith(`${path}/`);
  };
  return (
    <aside aria-label="메뉴" className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-[#EAEBEE] bg-white md:flex">
      <Link aria-label="집신 홈" className="flex h-[88px] items-center gap-2.5 border-b border-[#EAEBEE] px-6" href="/home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" aria-hidden="true" className="h-9 w-10 object-contain" src="/images/zipsin-company-logo.jpg" />
        <span className="flex flex-col leading-none">
          <strong className="text-[22px] font-bold tracking-[0.02em] text-[#212124]">ZIPSIN</strong>
          <small className="mt-1.5 text-[12px] text-[#6B7079]">{mode === 'partner' ? '파트너 · 사무소' : '기록이 자산이 됩니다.'}</small>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {groups.map((group, index) => (
          <ul className={index ? 'mt-4 border-t border-[#EAEBEE] pt-4' : ''} key={index}>
            {group.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <Link aria-current={current(href) ? 'page' : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-[15px] ${current(href) ? 'bg-[#F2F3F6] font-bold text-[#212124]' : 'font-semibold text-[#4D5159] hover:bg-[#F7F7F8]'}`} href={href}>
                    <Icon aria-hidden="true" className="size-[22px]" strokeWidth={1.7} />{label}
                  </Link>
              </li>
            ))}
          </ul>
        ))}
      </nav>
      <div className="m-4 rounded-2xl border border-[#EAEBEE] p-4">
        <p className="flex items-center gap-2 text-[15px] font-bold text-[#212124]"><ShieldCheck aria-hidden="true" className="size-5 text-[#0B6655]" />안전한 기록 저장</p>
        <p className="mt-2 text-sm leading-6 text-[#4D5159]">기록은 허락된 사람만 볼 수 있어요. 계약이 끝나면 그 사람의 접근도 끝나요.</p>
      </div>
    </aside>
  );
}
