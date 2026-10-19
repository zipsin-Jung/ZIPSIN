'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const KAKAO_CHAT_URL = 'https://pf.kakao.com/_xhcxkFX/chat';

export function KakaoInquiryButton() {
  const pathname = usePathname();

  if (pathname === '/ck' || pathname.startsWith('/ck/')) return null;
  // 집신수리 체험판은 아래에 큰 버튼이 붙어 있어 문의 버튼이 가린다(2026-10-18).
  if (pathname === '/rp/try' || pathname.startsWith('/rp/try/')) return null;

  return (
    <aside aria-label="빠른 고객지원" data-global-kakao="">
      <a
        aria-label="카카오톡으로 집신 대표에게 문의하기 (새 창)"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-[60] inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full border border-black/10 bg-[#FEE500] px-4 font-extrabold text-[#191919] shadow-[0_14px_36px_rgba(25,25,25,0.22)] transition hover:-translate-y-0.5 hover:brightness-[0.98] motion-reduce:transition-none md:bottom-24 md:right-6 md:px-5 lg:bottom-6"
        href={KAKAO_CHAT_URL}
        referrerPolicy="no-referrer"
        rel="noopener noreferrer external"
        target="_blank"
      >
        <MessageCircle aria-hidden="true" className="size-6" strokeWidth={2.4} />
        <span className="hidden sm:inline">카카오톡 문의</span>
      </a>
    </aside>
  );
}
