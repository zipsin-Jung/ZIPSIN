import Link from 'next/link';
import { requireUser } from '@/features/auth/guards/require-onboarding';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-screen bg-[#f8faf8] text-[#12362c]">
      <header className="border-b bg-white"><div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-5"><Link className="text-xl font-bold" href="/home">집신 ZIPSIN</Link><span className="text-sm text-slate-500">안전한 집 기록</span></div></header>
      {children}
    </div>
  );
}
