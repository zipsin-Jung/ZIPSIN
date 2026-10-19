import Link from 'next/link';
import { CalendarClock, ChevronRight, FileText, Folder, Handshake, Headphones, House, ListTodo, MessageCircle, Settings } from 'lucide-react';

const menu = [
  { href: '/contract', label: '계약 · 입주', icon: FileText },
  { href: '/expiry', label: '만기 · 퇴거', icon: CalendarClock },
  { href: '/living?tab=document', label: '문서함', icon: Folder },
  { href: '/homes', label: '집 목록', icon: House },
  { href: '/tasks', label: '할 일', icon: ListTodo },
  { href: '/chats', label: '채팅', icon: MessageCircle },
  { href: '/partners/new', label: '집신 파트너 등록', icon: Handshake },
  { href: '/support', label: '고객지원 채팅', icon: Headphones },
  { href: '/my', label: '설정 · 내 프로필', icon: Settings },
];

/** 더보기 (휴대폰 아래 메뉴 마지막 칸). PC 왼쪽 메뉴와 같은 곳으로 간다. */
export default function MorePage() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <h1 className="text-[22px] font-bold text-[#212124]">더보기</h1>
      <ul className="mt-3">
        {menu.map(({ href, label, icon: Icon }) => (
          <li className="border-b border-[#EAEBEE]" key={href}>
            <Link className="flex min-h-14 items-center gap-3 text-base font-semibold text-[#212124]" href={href}>
              <Icon aria-hidden="true" className="size-6 text-[#4D5159]" strokeWidth={1.6} />{label}<ChevronRight aria-hidden="true" className="ml-auto size-5 text-[#6B7079]" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
