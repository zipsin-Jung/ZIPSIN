import type { Metadata } from 'next';
import { CleanApp } from '@/features/zipsin-clean/components/CleanApp';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';
import { isCleanDemoOpen } from '@/features/zipsin-clean/domain/demo';

/**
 * 집신클린 (DEC-031). 집신체크처럼 같은 앱 안의 별도 서비스.
 * 배포 전에는 Preview에서만 처음부터 끝까지 눌러 볼 수 있는 체험 화면을 연다.
 * 실서비스(VERCEL_ENV=production)에서는 준비 중 화면만 보인다.
 */
export const metadata: Metadata = {
  title: '집신클린 · 청소 가격 바로 보기',
  description: '사실만 고르면 가격이 하나로 나와요. 작업을 시작한 뒤에는 가격이 바뀌지 않아요.',
  robots: { index: false },
};

export default function CleanPage() {
  if (!isCleanDemoOpen()) return <CleanPreparing />;
  return (
    <main className="min-h-screen bg-[#F7F7F3] text-[#16211E]">
      <header className="border-b border-[#E1E6E3] bg-white">
        <div className="mx-auto flex min-h-14 max-w-xl items-center gap-2 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" aria-hidden="true" className="h-8 w-9 object-contain" src="/images/zipsin-company-logo.jpg" />
          <strong className="text-[19px] font-bold tracking-[-0.02em] text-[#083E37]">집신클린</strong>
          <span className="ml-auto rounded-full bg-[#F6EBD8] px-3 py-1 text-sm font-semibold text-[#7A4E12]">체험용</span>
        </div>
      </header>
      <div className="mx-auto grid max-w-xl gap-6 px-4 py-6 pb-24">
        <CleanApp />
      </div>
    </main>
  );
}
