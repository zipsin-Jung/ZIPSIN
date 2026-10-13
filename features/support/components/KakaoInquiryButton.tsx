import { MessageCircle } from 'lucide-react';

const KAKAO_CHAT_URL = 'https://pf.kakao.com/_xhcxkFX/chat';

export function KakaoInquiryButton() {
  return (
    <aside aria-label="빠른 고객지원">
      <a
        aria-label="카카오톡으로 집신 대표에게 문의하기 (새 창)"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-[60] inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full border border-black/10 bg-[#FEE500] px-4 font-extrabold text-[#191919] shadow-[0_14px_36px_rgba(25,25,25,0.22)] transition hover:-translate-y-0.5 hover:brightness-[0.98] motion-reduce:transition-none md:bottom-6 md:right-6 md:px-5"
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
