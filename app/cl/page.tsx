import type { Metadata } from 'next';
import { QuoteBuilder } from '@/features/zipsin-clean/components/QuoteBuilder';

/**
 * 집신클린 첫 화면: 우리 집 청소 가격 바로 보기 (DEC-031).
 * 집신체크(/ck)처럼 같은 앱 안의 별도 서비스다. 로그인 없이 가격을 볼 수 있다.
 * cl.zipsin.net 주소 연결은 도메인 설정 뒤에 한다(대표 승인 필요).
 */
export const metadata: Metadata = {
  title: '집신클린 · 청소 가격 바로 보기',
  description: '사실만 고르면 가격이 하나로 나와요. 작업을 시작한 뒤에는 가격이 바뀌지 않아요.',
};

export default function CleanPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F3] text-[#16211E]">
      <header className="border-b border-[#E1E6E3] bg-white">
        <div className="mx-auto flex min-h-14 max-w-xl items-center gap-2 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" aria-hidden="true" className="h-8 w-9 object-contain" src="/images/zipsin-company-logo.jpg" />
          <strong className="text-[19px] font-bold tracking-[-0.02em] text-[#083E37]">집신클린</strong>
        </div>
      </header>
      <div className="mx-auto grid max-w-xl gap-6 px-4 py-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em]">우리 집 청소, 가격부터 보세요</h1>
          <p className="mt-2 text-base leading-7 text-[#3E4B47]">누구나 아는 것만 고르면 가격이 하나로 나와요. 물때·곰팡이를 직접 판단하지 않아도 돼요.</p>
        </div>
        <QuoteBuilder />
      </div>
    </main>
  );
}
