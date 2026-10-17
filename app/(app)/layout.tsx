import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAccountOpen } from '@/lib/site/account-launch';
import { requireUser } from '@/features/auth/guards/require-onboarding';
import { AppNavigation } from '@/features/navigation/components/AppNavigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isAccountOpen()) redirect('/');
  await requireUser();
  return (
    <div className="app-shell min-h-screen text-[#102a43]">
      <header className="app-header">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-6 px-5">
          <Link className="flex items-center gap-3 font-extrabold tracking-[-0.04em] text-[#102a43]" href="/home" aria-label="집신 홈">
            <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#0c6b5a] to-[#063d4c] text-sm font-black text-white shadow-[0_10px_28px_rgba(6,61,76,0.2)]">Z</span>
            <span className="text-xl">ZIPSIN</span>
          </Link>
          <AppNavigation />
        </div>
      </header>
      <div className="pb-24 md:pb-0">{children}</div>
    </div>
  );
}
