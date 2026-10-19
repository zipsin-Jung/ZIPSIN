import Link from 'next/link';
import { companyMissing } from '@/features/legal/company';

/** 약관·개인정보처리방침 공통 바탕. 공개 페이지(로그인 없이 볼 수 있음). */
export function LegalLayout({ title, effective, version, children }: { title: string; effective: string; version: string; children: React.ReactNode }) {
  const missing = companyMissing();
  return (
    <main className="legal-doc mx-auto max-w-3xl px-5 py-10 text-[#212124]">
      <Link className="text-sm font-semibold text-[#0B6655]" href="/">← 집신 홈</Link>
      <h1 className="mt-4 text-[28px] font-bold tracking-[-0.02em]">{title}</h1>
      <p className="mt-2 text-[15px] text-[#4D5159]">시행일 {effective} · 문서 버전 {version}</p>
      {missing.length > 0 && <p className="mt-4 rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="note">출시 전 확인 중인 항목: {missing.join(', ')}</p>}
      <nav aria-label="법적 고지" className="mt-4 flex gap-4 text-[15px] font-semibold">
        <Link className="text-[#0B6655] underline underline-offset-4" href="/terms">이용약관</Link>
        <Link className="text-[#0B6655] underline underline-offset-4" href="/privacy">개인정보처리방침</Link>
      </nav>
      <div className="mt-8 grid gap-8 text-base leading-7">{children}</div>
    </main>
  );
}

export function Article({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <h2 className="text-[19px] font-bold" id={id}>{title}</h2>
      {children}
    </section>
  );
}

export function Ol({ items }: { items: React.ReactNode[] }) {
  return <ol className="grid list-decimal gap-1.5 pl-6">{items.map((item, index) => <li key={index}>{item}</li>)}</ol>;
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[15px]">
        <thead><tr>{head.map((cell) => <th className="border border-[#DCDEE3] bg-[#F2F3F6] px-3 py-2 text-left font-semibold" key={cell} scope="col">{cell}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td className="border border-[#DCDEE3] px-3 py-2 align-top" key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
