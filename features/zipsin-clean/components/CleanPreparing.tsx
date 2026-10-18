/**
 * cl.zipsin.net 첫 화면 · 서비스 준비 중 (2026-10-18 대표 지시: 집신수리 준비 중 화면 'B 예시 기록형'과 같은 모습).
 * 준비 중 카드 + "이런 기록이 남아요" 예시 카드. 신청·예약은 받지 않는다(버튼·입력칸 없음).
 * 예시 숫자는 실제 거래가 아니라 화면 예시다.
 */
export function CleanPreparing() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F7F3] px-4 py-12 text-[#16211E]">
      <div className="grid w-full max-w-[400px] gap-4 lg:max-w-[600px]">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr] lg:gap-4">
          <section className="grid content-center gap-3 rounded-[20px] border border-[#E1E6E3] bg-white px-6 py-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" aria-hidden="true" className="mx-auto h-10 w-12 object-contain" src="/images/zipsin-company-logo.jpg" />
            <p className="text-sm font-semibold text-[#0B6655]">집신클린</p>
            <h1 className="text-[20px] font-bold leading-snug tracking-[-0.02em]">집신클린 서비스 준비 중이에요</h1>
            <p className="text-[15px] leading-7 text-[#3E4B47]">예약할 때 가격이 확정되고, 작업을 시작한 뒤에는 가격이 바뀌지 않는 청소 서비스를 준비하고 있어요.</p>
          </section>
          <section aria-label="예시 · 이런 기록이 남아요" className="grid gap-3 rounded-[20px] border border-[#E1E6E3] bg-white p-4">
            <p className="text-sm text-[#3E4B47]">예시 · 이런 기록이 남아요</p>
            <div>
              <h2 className="!text-base font-bold !leading-6">입주 청소 · 24평</h2>
              <p className="text-sm text-[#5D6A65]">마포구 · 2026.10</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <span className="grid aspect-[4/3] place-items-center rounded-lg bg-[#E6EBE8] text-sm text-[#3E4B47]">전 사진</span>
              <span className="grid aspect-[4/3] place-items-center rounded-lg bg-[#E6EBE8] text-sm text-[#3E4B47]">후 사진</span>
            </div>
            <dl className="grid gap-1.5 text-sm">
              <div className="flex items-baseline justify-between gap-2"><dt>확정 가격 <span className="text-[#5D6A65]">예약할 때</span></dt><dd className="font-semibold">32만 5천 원</dd></div>
              <div className="flex items-baseline justify-between gap-2 text-[#0B6655]"><dt>+ 추가요금 <span>작업 시작 뒤</span></dt><dd className="font-bold">0원</dd></div>
              <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-[#E1E6E3] pt-2"><dt className="font-bold">= 최종 <span className="font-normal text-[#0B6655]">손님 확인됨</span></dt><dd className="font-bold">32만 5천 원</dd></div>
            </dl>
          </section>
        </div>
        <a className="mx-auto inline-flex min-h-11 items-center text-[15px] font-semibold text-[#0B6655]" href="https://zipsin.net/">집신 둘러보기</a>
      </div>
    </main>
  );
}
