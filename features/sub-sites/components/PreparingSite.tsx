import type { SubSiteId } from '@/lib/site/sub-sites';

/**
 * 집신청소(cl)·집신수리(rp) 준비 중 화면 — 2026-10-18 대표 승인 시안(캔버스 '청소·수리 준비 중').
 * 원칙: 정하지 않은 약속(가격 확정·추가요금 없음 등)을 쓰지 않는다. 신청·예약을 받는 척하지 않는다.
 * 머리말은 집신체크와 같은 모양(로고 | 집신 / 서비스 이름).
 */
const COPY: Record<SubSiteId, { name: string; host: string; title: [string, string]; lead: string }> = {
  clean: {
    name: '집신청소',
    host: 'cl.zipsin.net',
    title: ['작은 청소부터 이사 청소까지,', '집 청소는 집신청소에서'],
    lead: '한 번 부르는 청소부터 가사 도우미까지, 집 청소를 한곳에서 찾을 수 있게 준비하고 있어요.',
  },
  repair: {
    name: '집신수리',
    host: 'rp.zipsin.net',
    title: ['작은 고장부터 인테리어까지,', '집 고칠 일은 집신수리에서'],
    lead: '새는 수전 하나부터 인테리어까지, 집 고칠 일을 한곳에서 맡기고 사진으로 기록할 수 있게 준비하고 있어요.',
  },
};

export function PreparingSite({ service, homeHref }: { service: SubSiteId; homeHref: string }) {
  const copy = COPY[service];
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#EEF6F8_0%,#F3F7F5_55%,#F6F7F3_100%)] text-[#16211E] [word-break:keep-all]">
      <header className="mx-auto flex max-w-[1312px] items-center justify-between px-4 py-4 md:px-16 md:py-7">
        <a aria-label={`집신 ${copy.name}`} className="flex items-center gap-3 md:gap-4" href={homeHref}>
          <span className="grid size-14 place-items-center rounded-[14px] bg-white shadow-[0_4px_14px_rgba(22,33,30,0.08)] md:size-[72px] md:rounded-[18px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="size-11 object-contain md:size-[60px]" src="/images/zipsin-company-logo.jpg" />
          </span>
          <span aria-hidden="true" className="h-12 w-0.5 bg-[#C9D1CD] md:h-16" />
          <span className="flex flex-col gap-0.5 md:gap-1.5">
            <strong className="text-[26px] leading-none font-extrabold md:text-[34px]">집신</strong>
            <strong className="text-sm tracking-[0.08em] md:text-[17px]">{copy.name}</strong>
          </span>
        </a>
        <a className="flex min-h-11 items-center text-sm text-[#3E4B47] md:text-[15px]" href={homeHref}>집신 바로가기</a>
      </header>
      <main className="mx-auto grid max-w-[1312px] items-center gap-14 px-4 pt-2 pb-16 md:grid-cols-[1fr_420px] md:gap-20 md:px-[76px] md:pt-16">
        <div className="flex max-w-[600px] flex-col gap-3.5 md:gap-[22px]">
          <h1 className="text-[28px] leading-[1.28] font-extrabold tracking-[-0.03em] md:text-[46px]">
            {copy.title[0]}<br />{copy.title[1]}
          </h1>
          <p className="text-base leading-[1.7] text-[#3E4B47] md:text-[19px]">{copy.lead}</p>
          <p className="mt-1 text-[17px] leading-normal font-bold text-[#0B6655] md:mt-2 md:text-[19px]">
            아직은 이용할 수 없어요.<br />출시하면 이 주소에서 이용할 수 있어요.
          </p>
          <a className="inline-flex h-[50px] items-center self-start rounded-xl border-[1.5px] border-[#16211E] px-[22px] text-base font-bold md:h-[54px] md:text-[17px]" href={homeHref}>
            그동안 집신 둘러보기
          </a>
        </div>
        <div className="flex justify-center">
          <div
            aria-label="준비 중"
            className="flex size-[220px] -rotate-12 flex-col items-center justify-center rounded-full border-[7px] border-[#0B6655] bg-white/80 text-[#0B6655] shadow-[inset_0_0_0_3px_#fff,inset_0_0_0_7px_#0B6655] [font-family:'Noto_Serif_KR','Nanum_Myeongjo','AppleMyungjo',serif] md:size-[340px] md:border-[11px] md:shadow-[inset_0_0_0_5px_#fff,inset_0_0_0_11px_#0B6655]"
            role="img"
          >
            <span className="text-[59px] leading-none font-black tracking-[-0.02em] md:text-[92px]">준비 중</span>
            <span className="mt-2.5 text-xl font-bold tracking-[0.02em] md:mt-4 md:text-[31px]">{copy.host}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export function preparingMetadata(service: SubSiteId) {
  return { title: `${COPY[service].name} · 서비스 준비 중`, robots: { index: false, follow: false } };
}
