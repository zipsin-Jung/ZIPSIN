import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Search } from 'lucide-react';
import { isAccountOpen } from '@/lib/site/account-launch';
import { requireUser } from '@/features/auth/guards/require-onboarding';
import { AppNavigation } from '@/features/navigation/components/AppNavigation';
import { SpaceSwitcher } from '@/features/navigation/components/SpaceSwitcher';
import { SPACE_COOKIE, pickSpace } from '@/features/workspace/domain/space';
import { loadSpaceContext } from '@/features/workspace/services/spaces';

/** 로그인 후 바탕 (v2 시안, 2026-10-19). 위: 이름 ▾ · 집 찾기 / 아래: 홈 · 기록 · + · 채팅 · 마이. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isAccountOpen()) redirect('/');
  const { supabase, user } = await requireUser();
  const context = await loadSpaceContext(supabase, user.id);
  const space = pickSpace((await cookies()).get(SPACE_COOKIE)?.value, context.offices, context.personalHomes.length);
  return (
    <div className="app-shell min-h-screen">
      <header className="app-header">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-4 md:min-h-[64px] md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Link aria-label="집신 홈" className="hidden shrink-0 md:block" href="/home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" aria-hidden="true" className="h-8 w-9 object-contain" src="/images/zipsin-company-logo.jpg" />
            </Link>
            <SpaceSwitcher currentOfficeId={space.kind === 'office' ? space.office.id : null} displayName={context.displayName} offices={context.offices} />
          </div>
          <div className="flex items-center gap-1">
            <Link aria-label="집 찾기" className="grid size-11 place-items-center rounded-lg text-[#212124] md:hidden" href="/homes">
              <Search aria-hidden="true" className="size-6" />
            </Link>
            <AppNavigation />
          </div>
        </div>
      </header>
      <div className="pb-28 md:pb-0">{children}</div>
    </div>
  );
}
