import Link from 'next/link';
import { cookies } from 'next/headers';
import { CalendarClock, ChevronRight, FileText, Folder, Handshake, Headphones, House, ListTodo, MessageCircle, Settings, Users } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { ModeSwitch } from '@/features/navigation/components/ModeSwitch';
import { SPACE_COOKIE, pickSpace } from '@/features/workspace/domain/space';
import { loadSpaceContext } from '@/features/workspace/services/spaces';

const customerMenu = [
  { href: '/contract', label: '계약 · 입주', icon: FileText },
  { href: '/expiry', label: '만기 · 퇴거', icon: CalendarClock },
  { href: '/living?tab=document', label: '문서함', icon: Folder },
  { href: '/homes', label: '집 목록', icon: House },
  { href: '/chats', label: '채팅', icon: MessageCircle },
  { href: '/partners/new', label: '집신 파트너 등록', icon: Handshake },
  { href: '/support', label: '고객지원 채팅', icon: Headphones },
  { href: '/my', label: '설정 · 내 프로필', icon: Settings },
];
const partnerMenu = [
  { href: '/tasks', label: '할 일', icon: ListTodo },
  { href: '/records', label: '기록', icon: FileText },
  { href: '/office/members', label: '직원', icon: Users },
  { href: '/homes?filter=expiring', label: '만기 다가오는 집', icon: CalendarClock },
  { href: '/support', label: '고객지원 채팅', icon: Headphones },
  { href: '/my', label: '설정 · 내 프로필', icon: Settings },
];

/** 더보기 (휴대폰 아래 메뉴 마지막 칸). 맨 위에서 고객 ↔ 파트너 전환. */
export default async function MorePage() {
  const { supabase, user } = await requireOnboardingComplete();
  const context = await loadSpaceContext(supabase, user.id);
  const space = pickSpace((await cookies()).get(SPACE_COOKIE)?.value, context.offices, context.personalHomes.length);
  const mode = space.kind === 'office' ? 'partner' : 'customer';
  const menu = mode === 'partner' ? partnerMenu : customerMenu;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <h1 className="text-[22px] font-bold text-[#212124]">더보기</h1>
      <p className="mt-1 text-[15px] text-[#6B7079]">지금 {mode === 'partner' ? `파트너 모드 · ${space.kind === 'office' ? space.office.name : ''}` : '고객 모드 · 우리집'}</p>
      <div className="mt-4"><ModeSwitch mode={mode} partnerOfficeId={space.kind === 'office' ? space.office.id : context.offices[0]?.id ?? null} variant="row" /></div>
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
