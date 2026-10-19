import type { ReactNode } from 'react';
import Link from 'next/link';

/** 집신청소 체험 화면 공통 틀. 손님 화면 ↔ 업체 화면을 오갈 수 있다. */
export function CleanDemoShell({ children, links }: { children: ReactNode; links: Array<{ href: string; label: string }> }) {
  return (
    <main className="min-h-screen bg-[#F7F7F3] text-[#16211E]">
      <header className="border-b border-[#E1E6E3] bg-white">
        <div className="mx-auto flex min-h-14 max-w-xl items-center gap-2 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" aria-hidden="true" className="h-8 w-9 object-contain" src="/images/zipsin-company-logo.jpg" />
          <strong className="text-[19px] font-bold tracking-[-0.02em] text-[#083E37]">집신청소</strong>
          <span className="hidden rounded-full bg-[#F6EBD8] px-2.5 py-0.5 text-sm font-semibold text-[#7A4E12] sm:inline">체험용</span>
          <nav aria-label="체험 화면" className="ml-auto flex gap-1.5">{links.map((link) => <Link className="inline-flex min-h-11 items-center rounded-xl border border-[#C9D1CD] px-3 text-sm font-semibold text-[#083E37]" href={link.href} key={link.href}>{link.label}</Link>)}</nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-xl gap-6 px-4 py-6 pb-24">{children}</div>
    </main>
  );
}
