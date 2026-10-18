import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAccountOpen } from '@/lib/site/account-launch';
import { requireUser } from '@/features/auth/guards/require-onboarding';
import { AppNavigation } from '@/features/navigation/components/AppNavigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isAccountOpen()) redirect('/');
  await requireUser();
  return (
    <div className="app-shell min-h-screen">
      <header className="app-header">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-6 px-5 md:min-h-[68px]">
          <Link className="flex items-center gap-2" href="/home" aria-label="집신 홈">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" aria-hidden="true" className="h-8 w-9 object-contain" src="/images/zipsin-company-logo.jpg" />
            <span className="flex flex-col leading-none">
              <strong className="text-[19px] font-bold tracking-[-0.02em] text-[#083E37]">집신</strong>
              <small className="mt-0.5 text-[9px] font-semibold tracking-[0.18em] text-[#5D6A65]">ZIPSIN</small>
            </span>
          </Link>
          <AppNavigation />
        </div>
      </header>
      <div className="pb-28 md:pb-0">{children}</div>
    </div>
  );
}
