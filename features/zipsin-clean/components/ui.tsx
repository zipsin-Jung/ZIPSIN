import type { ReactNode } from 'react';

/** 집신청소 화면 공통 조각. 딥그린·아이보리, 버튼은 최소 48px. */
export function Primary({ children, disabled, onClick, type = 'button' }: { children: ReactNode; disabled?: boolean; onClick?: () => void; type?: 'button' | 'submit' }) {
  return <button className="min-h-14 w-full rounded-xl bg-[#0B6655] px-4 text-[17px] font-bold text-white disabled:bg-[#C9D1CD] disabled:text-[#3E4B47]" disabled={disabled} onClick={onClick} type={type}>{children}</button>;
}

export function Secondary({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick?: () => void }) {
  return <button className="min-h-12 w-full rounded-xl border border-[#C9D1CD] bg-white px-4 text-[15px] font-semibold text-[#16211E] disabled:text-[#5D6A65]" disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

export function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return <div className="flex items-baseline justify-between gap-3 py-1.5"><dt className="text-[15px] text-[#3E4B47]">{label}</dt><dd className={`text-right text-[15px] text-[#16211E] ${strong ? 'font-bold' : ''}`}>{value}</dd></div>;
}

export function Card({ children, label }: { children: ReactNode; label?: string }) {
  return <section aria-label={label} className="grid gap-3 rounded-2xl border border-[#E1E6E3] bg-white p-4">{children}</section>;
}

export function Notice({ children, tone = 'green', role }: { children: ReactNode; tone?: 'green' | 'gold' | 'red'; role?: 'status' | 'alert' }) {
  const colors = { green: 'bg-[#E3F0EC] text-[#083E37]', gold: 'bg-[#F6EBD8] text-[#7A4E12]', red: 'bg-[#FCEDEA] text-red-800' }[tone];
  return <p className={`rounded-xl p-3 text-[15px] leading-6 ${colors}`} role={role}>{children}</p>;
}

export function choiceClass(on: boolean) {
  return `flex min-h-12 cursor-pointer items-center justify-center break-keep rounded-xl px-2 text-center text-[15px] font-semibold ${on ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white'}`;
}

export const fieldClass = 'min-h-12 w-full rounded-xl border border-[#C9D1CD] bg-white px-3 text-base';

export function StatusPill({ status, label }: { status: string; label: string }) {
  const tone = status === 'completed' ? 'bg-[#E3F0EC] text-[#083E37]'
    : status === 'cancelled' || status === 'declined' ? 'bg-[#F1F3F2] text-[#5D6A65]'
      : status === 'done' || status === 'block_reported' ? 'bg-[#F6EBD8] text-[#7A4E12]' : 'bg-[#E3F0EC] text-[#083E37]';
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold ${tone}`}>{label}</span>;
}
