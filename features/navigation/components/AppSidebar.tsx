'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarClock, Camera, ClipboardCheck, FileText, Folder, Home, Settings, ShieldCheck } from 'lucide-react';

/**
 * PC 왼쪽 메뉴 (대표 Figma "My Home", 2026-10-19).
 * 아직 화면이 없는 메뉴는 링크 대신 '준비 중'으로만 보인다(누르면 아무 데도 가지 않음).
 */
const groups = [
  [
    { href: '/home', label: '내 집', icon: Home },
    { href: null, label: '체크리스트', icon: ClipboardCheck },
    { href: '/homes', label: '계약 · 입주', icon: FileText },
    { href: '/records', label: '거주관리', icon: Camera },
    { href: '/homes?filter=expiring', label: '만기 · 퇴거', icon: CalendarClock },
    { href: null, label: '문서함', icon: Folder },
  ],
  [
    { href: '/notifications', label: '알림', icon: Bell },
    { href: '/my', label: '설정', icon: Settings },
  ],
] as const;

export function AppSidebar() {
  const pathname = usePathname() ?? '';
  const current = (href: string) => {
    const path = href.split('?')[0];
    return path === '/home' ? pathname === '/home' : pathname === path || pathname.startsWith(`${path}/`);
  };
  return (
    <aside aria-label="메뉴" className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-[#EAEBEE] bg-white md:flex">
      <Link aria-label="집신 홈" className="flex h-[88px] items-center gap-2.5 border-b border-[#EAEBEE] px-6" href="/home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" aria-hidden="true" className="h-9 w-10 object-contain" src="/images/zipsin-company-logo.jpg" />
        <span className="flex flex-col leading-none">
          <strong className="text-[22px] font-bold tracking-[0.02em] text-[#212124]">ZIPSIN</strong>
          <small className="mt-1.5 text-[12px] text-[#6B7079]">기록이 자산이 됩니다.</small>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {groups.map((group, index) => (
          <ul className={index ? 'mt-4 border-t border-[#EAEBEE] pt-4' : ''} key={index}>
            {group.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                {href ? (
                  <Link aria-current={current(href) ? 'page' : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-[15px] ${current(href) ? 'bg-[#F2F3F6] font-bold text-[#212124]' : 'font-semibold text-[#4D5159] hover:bg-[#F7F7F8]'}`} href={href}>
                    <Icon aria-hidden="true" className="size-[22px]" strokeWidth={1.7} />{label}
                  </Link>
                ) : (
                  <span className="flex min-h-12 items-center gap-3 px-4 text-[15px] font-semibold text-[#9EA3AB]">
                    <Icon aria-hidden="true" className="size-[22px]" strokeWidth={1.7} />{label}
                    <span className="ml-auto rounded bg-[#F2F3F6] px-1.5 py-0.5 text-[12px] font-semibold text-[#6B7079]">준비 중</span>
                  </span>
                )}
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
