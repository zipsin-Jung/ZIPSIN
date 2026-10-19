import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';

/**
 * 고객 ↔ 파트너 전환 (숨고의 '고객으로 전환 / 고수로 전환' 방식, 대표 요청 2026-10-19, DEC-040).
 * 한 아이디 안에서 바꾼다. 파트너 계정(사무소)이 없으면 파트너 등록으로 간다.
 * /space 가 서버에서 사무소 구성원인지 다시 확인한다.
 */
export type AppMode = 'customer' | 'partner';

export function modeSwitchTarget(mode: AppMode, partnerOfficeId: string | null): { href: string; label: string } {
  if (mode === 'partner') return { href: '/space?to=me', label: '고객으로 전환' };
  return partnerOfficeId ? { href: `/space?to=${partnerOfficeId}`, label: '파트너로 전환' } : { href: '/partners/new', label: '파트너로 전환' };
}

export function ModeSwitch({ mode, partnerOfficeId, variant = 'pill' }: { mode: AppMode; partnerOfficeId: string | null; variant?: 'pill' | 'row' }) {
  const target = modeSwitchTarget(mode, partnerOfficeId);
  const Tag = target.href.startsWith('/space') ? 'a' : Link;
  if (variant === 'row') {
    return (
      <Tag className="flex min-h-14 items-center gap-3 rounded-xl bg-[#E3F0EC] px-4 text-base font-bold text-[#083E37]" href={target.href}>
        <ArrowLeftRight aria-hidden="true" className="size-5" />{target.label}
        <span className="ml-auto text-sm font-semibold text-[#0B6655]">{mode === 'partner' ? '내 집 기록' : partnerOfficeId ? '사무소 일' : '등록하기'}</span>
      </Tag>
    );
  }
  return (
    <Tag className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#0B6655] px-3 text-sm font-bold text-[#0B6655] hover:bg-[#E3F0EC] md:h-11 md:px-4 md:text-[15px]" href={target.href}>
      <ArrowLeftRight aria-hidden="true" className="size-4" />{target.label}
    </Tag>
  );
}
