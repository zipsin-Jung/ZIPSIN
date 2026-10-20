import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/guards/require-onboarding';

export const metadata: Metadata = { title: '집신 총괄 관리자', robots: { index: false, follow: false } };

/** 총괄 관리자: platform_admins 표에 등록된 아이디만. 아니면 '없는 페이지'로 보인다. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc('is_platform_admin');
  if (isAdmin !== true) notFound();
  return (
    <div className="app-shell min-h-screen bg-[#F7F8F7]">
      <header className="border-b border-[#EAEBEE] bg-white">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 md:px-8">
          <strong className="text-[17px] text-[#212124]">집신 총괄 관리자</strong>
          <nav aria-label="관리자 메뉴" className="flex gap-4 text-[15px] font-semibold">
            <Link className="text-[#212124] hover:underline" href="/admin">대시보드</Link>
            <Link className="text-[#212124] hover:underline" href="/admin/partners">파트너 승인</Link>
          </nav>
          <span className="ml-auto text-sm text-[#6B7079]">집신 · 집신체크 · 집신청소 · 집신수리</span>
        </div>
      </header>
      {children}
    </div>
  );
}
