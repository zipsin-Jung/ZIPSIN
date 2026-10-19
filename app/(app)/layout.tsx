import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Bell, ChevronDown, MessageCircle, UserRound } from 'lucide-react';
import { isAccountOpen } from '@/lib/site/account-launch';
import { requireUser } from '@/features/auth/guards/require-onboarding';
import { AppNavigation } from '@/features/navigation/components/AppNavigation';
import { AppSidebar } from '@/features/navigation/components/AppSidebar';
import { SpaceSwitcher } from '@/features/navigation/components/SpaceSwitcher';
import { SPACE_COOKIE, pickSpace } from '@/features/workspace/domain/space';
import { loadSpaceContext } from '@/features/workspace/services/spaces';

/**
 * 로그인 후 바탕 (대표 Figma "My Home", 2026-10-19).
 * PC: 왼쪽 메뉴 + 위 '우리집 ▾ · 채팅 · 알림 · 내 프로필'. 휴대폰: 위 같은 줄(아이콘) + 아래 홈 · 기록 · + · 채팅 · 마이.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isAccountOpen()) redirect('/');
  const { supabase, user } = await requireUser();
  const [context, unread] = await Promise.all([
    loadSpaceContext(supabase, user.id),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
  ]);
  const unreadCount = unread?.count ?? 0;
  const space = pickSpace((await cookies()).get(SPACE_COOKIE)?.value, context.offices, context.personalHomes.length);
  return (
    <div className="app-shell flex min-h-screen">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <header className="app-header">
          <div className="flex min-h-14 items-center justify-between gap-3 px-4 md:h-[88px] md:px-10">
            <SpaceSwitcher currentOfficeId={space.kind === 'office' ? space.office.id : null} displayName={context.displayName} offices={context.offices} />
            <div className="flex items-center gap-1 md:gap-2">
              <Link aria-label="채팅" className="grid size-11 place-items-center rounded-full text-[#212124] md:flex md:h-11 md:w-auto md:gap-2 md:bg-[#F2F3F6] md:px-4 md:text-[15px] md:font-semibold" href="/chats">
                <MessageCircle aria-hidden="true" className="size-6 md:size-5" strokeWidth={1.7} /><span className="hidden md:inline">채팅</span>
              </Link>
              <Link aria-label={unreadCount ? `알림 ${unreadCount}개` : '알림'} className="relative grid size-11 place-items-center rounded-full text-[#212124] md:flex md:w-auto md:gap-2 md:px-3 md:text-[15px] md:font-semibold" href="/notifications">
                <Bell aria-hidden="true" className="size-6 md:size-5" strokeWidth={1.7} /><span className="hidden md:inline">알림</span>
                {unreadCount > 0 && <span aria-hidden="true" className="absolute right-2 top-2 size-2 rounded-full bg-[#E5484D] md:right-1 md:top-2" />}
              </Link>
              <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-[#EAEBEE] md:block" />
              <Link className="hidden h-11 items-center gap-2 rounded-full px-2 text-[15px] font-semibold text-[#212124] md:flex" href="/my">
                <UserRound aria-hidden="true" className="size-6 rounded-full border border-[#DCDEE3] p-0.5" strokeWidth={1.7} />내 프로필<ChevronDown aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </header>
        <AppNavigation />
        <div className="pb-28 md:pb-10">{children}</div>
      </div>
    </div>
  );
}
