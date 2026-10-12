import Link from 'next/link';
import { requireUser } from '@/features/auth/guards/require-onboarding';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="app-shell min-h-screen text-[#102a43]">
      <header className="app-header">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-6 px-5">
          <Link className="flex items-center gap-3 font-extrabold tracking-[-0.04em] text-[#102a43]" href="/home" aria-label="집신 홈">
            <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#0c6b5a] to-[#063d4c] text-sm font-black text-white shadow-[0_10px_28px_rgba(6,61,76,0.2)]">Z</span>
            <span className="text-xl">ZIPSIN</span>
          </Link>
          <nav aria-label="주요 메뉴" className="flex items-center gap-1 rounded-2xl border border-white/80 bg-white/75 p-1.5 shadow-[0_10px_34px_rgba(15,42,55,0.06)] backdrop-blur-xl">
            <Link className="rounded-xl px-4 py-2 text-sm font-bold text-[#123e4a] transition hover:bg-[#edf7f4]" href="/home">홈</Link>
            <Link className="rounded-xl px-4 py-2 text-sm font-bold text-[#496273] transition hover:bg-[#edf7f4] hover:text-[#123e4a]" href="/homes">집 기록</Link>
            <Link className="rounded-xl px-4 py-2 text-sm font-bold text-[#496273] transition hover:bg-[#edf7f4] hover:text-[#123e4a]" href="/tasks">할 일</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
