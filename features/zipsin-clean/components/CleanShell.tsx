import type { ReactNode } from 'react';
import Link from 'next/link';

export type ShellLink = { href: string; label: string; current?: boolean };

/** 집신청소 공통 머리말. 보는 사람에 따라 메뉴가 달라진다(업체·관리는 해당 계정에만). */
export function CleanShell({ children, links }: { children: ReactNode; links: ShellLink[] }) {
  return (
    <main className="min-h-screen bg-[#F7F7F3] text-[#16211E]">
      <header className="border-b border-[#E1E6E3] bg-white">
        <div className="mx-auto grid max-w-xl gap-2 px-4 py-2">
          <Link className="flex min-h-11 items-center gap-2 self-start" href="/cl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" aria-hidden="true" className="h-8 w-9 object-contain" src="/images/zipsin-company-logo.jpg" />
            <strong className="text-[19px] font-bold tracking-[-0.02em] text-[#083E37]">집신청소</strong>
          </Link>
          <nav aria-label="집신청소 메뉴" className={`grid gap-1 rounded-xl bg-[#E1E6E3] p-1 ${links.length >= 4 ? 'grid-cols-4' : links.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {links.map((link) => (
              <Link aria-current={link.current ? 'page' : undefined} className={`grid min-h-11 place-items-center rounded-lg text-[15px] font-semibold ${link.current ? 'bg-white text-[#083E37] shadow-sm' : 'text-[#3E4B47]'}`} href={link.href} key={link.href}>{link.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-xl gap-6 px-4 py-6 pb-24">{children}</div>
    </main>
  );
}
